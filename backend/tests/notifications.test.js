jest.mock('web-push', () => ({ setVapidDetails: jest.fn(), sendNotification: jest.fn().mockResolvedValue({}) }));
jest.mock('../models/AppSettings', () => ({ getGlobal: jest.fn() }));
jest.mock('../models/User', () => ({ find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Notification', () => ({ create: jest.fn(), updateOne: jest.fn(), updateMany: jest.fn(), find: jest.fn() }));
jest.mock('../models/NotificationPref', () => ({ find: jest.fn() }));
jest.mock('../models/PushSubscription', () => ({ find: jest.fn(), updateOne: jest.fn(), deleteOne: jest.fn() }));
jest.mock('../models/Assignment', () => ({ find: jest.fn(), aggregate: jest.fn() }));
jest.mock('../models/Schedule', () => ({ find: jest.fn() }));
jest.mock('../models/Announcement', () => ({ find: jest.fn() }));

process.env.VAPID_PUBLIC_KEY = 'pub';
process.env.VAPID_PRIVATE_KEY = 'priv';

const webpush = require('web-push');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');
const Notification = require('../models/Notification');
const NotificationPref = require('../models/NotificationPref');
const PushSubscription = require('../models/PushSubscription');
const Assignment = require('../models/Assignment');
const Schedule = require('../models/Schedule');
const { notify, wantsType, clearSettingsCache } = require('../services/notifications');
const { runHomeworkReminders, runClassReminders, runDigest } = require('../services/notificationScheduler');

const NOON_CAIRO = new Date('2026-07-12T09:00:00Z'); // 12:00 in Cairo, outside quiet hours
const NIGHT_CAIRO = new Date('2026-07-12T21:30:00Z'); // 00:30 in Cairo, inside quiet hours

const useSettings = (notifications) => { AppSettings.getGlobal.mockResolvedValue({ notifications }); clearSettingsCache(); };
const students = (...ids) => ids.map(id => ({ _id: id, role: 'student' }));

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOON_CAIRO);
  jest.clearAllMocks();
  useSettings(undefined);
  // Like the real query: only the people whose ids were asked for come back.
  User.find.mockImplementation(q => ({ select: jest.fn().mockResolvedValue(students(...(q._id?.$in || []).map(String))) }));
  NotificationPref.find.mockResolvedValue([]);
  Notification.create.mockImplementation(async d => ({ _id: `n-${d.user}`, ...d }));
  Notification.updateOne.mockResolvedValue({});
  PushSubscription.find.mockResolvedValue([{ _id: 'sub', endpoint: 'https://push.example/1', keys: { p256dh: 'a', auth: 'b' } }]);
});
afterEach(() => jest.useRealTimers());

describe('notify', () => {
  it('saves an in-app notification and pushes it to the person\'s devices', async () => {
    const n = await notify(['s1', 's2'], { type: 'hw_assigned', title: 'New homework', body: 'Excel task' });
    expect(n).toBe(2);
    expect(Notification.create).toHaveBeenCalledTimes(2);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(Notification.updateOne).toHaveBeenCalledWith({ _id: 'n-s1' }, { pushed: true });
  });

  it('skips people who already received this reminder (dedupe key)', async () => {
    Notification.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
    expect(await notify(['s1', 's2'], { type: 'hw_due', title: 'Due', dedupeKey: 'x' })).toBe(1);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the teacher switched that type off', async () => {
    useSettings({ categories: { hw_due: false } });
    expect(await notify(['s1'], { type: 'hw_due', title: 'Due' })).toBe(0);
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('keeps the notification but holds the push during quiet hours', async () => {
    jest.setSystemTime(NIGHT_CAIRO);
    expect(await notify(['s1'], { type: 'hw_assigned', title: 'New homework' })).toBe(1);
    expect(Notification.create).toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
    expect(Notification.updateOne).not.toHaveBeenCalled(); // stays pushed:false for the flush
  });

  it('urgent notifications ignore quiet hours', async () => {
    jest.setSystemTime(NIGHT_CAIRO);
    await notify(['s1'], { type: 'hw_assigned', title: 'x', urgent: true });
    expect(webpush.sendNotification).toHaveBeenCalled();
  });

  it('removes a device whose subscription has expired', async () => {
    webpush.sendNotification.mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }));
    await notify(['s1'], { type: 'chat', title: 'Hi' });
    expect(PushSubscription.deleteOne).toHaveBeenCalledWith({ _id: 'sub' });
  });

  it('never throws into the caller', async () => {
    Notification.create.mockRejectedValue(new Error('db down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(notify(['s1'], { type: 'chat', title: 'Hi' })).resolves.toBe(0);
  });
});

describe('wantsType (who may switch what off)', () => {
  const s = (over = {}) => ({ studentsCanChoose: true, categories: { hw_due: true }, ...over });
  const off = new Map([['hw_due', false]]);

  it('respects a student\'s own choice when the teacher allows choosing', () => {
    expect(wantsType(s(), 'student', 'hw_due', off)).toBe(false);
  });
  it('ignores a student\'s choice when the teacher decides for everyone', () => {
    expect(wantsType(s({ studentsCanChoose: false }), 'student', 'hw_due', off)).toBe(true);
  });
  it('the teacher can always choose their own', () => {
    expect(wantsType(s({ studentsCanChoose: false }), 'teacher', 'hw_due', off)).toBe(false);
  });
  it('the teacher\'s master switch wins', () => {
    expect(wantsType(s({ categories: { hw_due: false } }), 'student', 'hw_due', undefined)).toBe(false);
  });
});

describe('homework reminders', () => {
  const hours = (h) => new Date(NOON_CAIRO.getTime() + h * 3600 * 1000);
  const assignment = (dueInHours, assignedTo, extra = {}) => ({ _id: 'a1', title: 'Excel task', dueDate: hours(dueInHours), assignedTo, ...extra });
  const given = (...rows) => Assignment.find.mockReturnValue({ select: jest.fn().mockResolvedValue(rows) });
  const longAgo = new Date(NOON_CAIRO.getTime() - 5 * 3600 * 1000);

  it('uses the nearest reminder time that applies, and only for students who have not handed in', async () => {
    given(assignment(20, [
      { student: 's1', status: 'assigned', assignedDate: longAgo },
      { student: 's2', status: 'submitted', assignedDate: longAgo }
    ]));
    await runHomeworkReminders(NOON_CAIRO);
    expect(Notification.create).toHaveBeenCalledTimes(1);
    expect(Notification.create.mock.calls[0][0].user).toBe('s1');
    const call = Notification.create.mock.calls[0][0];
    expect(call.dedupeKey).toBe('hwdue:a1:1440');
    expect(call.title).toBe('Homework due in 20 hours');
  });

  it('switches to the 2-hour reminder once the deadline is that close', async () => {
    given(assignment(1.5, [{ student: 's1', status: 'in_progress', assignedDate: longAgo }]));
    await runHomeworkReminders(NOON_CAIRO);
    expect(Notification.create.mock.calls[0][0].dedupeKey).toBe('hwdue:a1:120');
  });

  it('skips homework that was only just assigned', async () => {
    given(assignment(1.5, [{ student: 's1', status: 'assigned', assignedDate: new Date(NOON_CAIRO.getTime() - 10 * 60 * 1000) }]));
    await runHomeworkReminders(NOON_CAIRO);
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('follows the reminder times the teacher set', async () => {
    useSettings({ homeworkReminders: [4320, 30] });
    given(assignment(0.4, [{ student: 's1', status: 'assigned', assignedDate: longAgo }]));
    await runHomeworkReminders(NOON_CAIRO);
    expect(Notification.create.mock.calls[0][0].dedupeKey).toBe('hwdue:a1:30');
  });
});

describe('class reminders', () => {
  const sched = (startTime) => ({ _id: 'sch1', schedule: [{ day: 'Sunday', sessions: [{ startTime, endTime: '21:00', type: 'theory', topic: 'Networks', isActive: true }] }], assignedStudents: [{ student: 's1' }] });

  it('reminds students 30 minutes before a session today (local time)', async () => {
    Schedule.find.mockReturnValue({ select: jest.fn().mockResolvedValue([sched('12:20')]) }); // noon + 20 min
    await runClassReminders(NOON_CAIRO);
    const call = Notification.create.mock.calls[0][0];
    expect(call.title).toBe('Networks starts in 20 min');
    expect(call.dedupeKey).toBe('class:sch1:2026-07-12:12:20');
  });

  it('reads 12-hour times too, and ignores sessions further away or already started', async () => {
    Schedule.find.mockReturnValue({ select: jest.fn().mockResolvedValue([sched('1:00 PM'), sched('11:30')]) });
    await runClassReminders(NOON_CAIRO);
    expect(Notification.create).not.toHaveBeenCalled();
  });
});

describe('daily digest', () => {
  beforeEach(() => {
    User.countDocuments.mockResolvedValue(3);
    Assignment.aggregate.mockResolvedValue([{ n: 5 }]);
  });
  const teacherLookup = () => User.find.mockImplementation(() => ({ select: jest.fn().mockResolvedValue([{ _id: 't1', role: 'teacher' }]) }));

  it('sends one summary after the set time, with counts', async () => {
    teacherLookup();
    await runDigest(NOON_CAIRO); // 12:00 is more than 3 hours after 08:00, so too late
    expect(Notification.create).not.toHaveBeenCalled();

    useSettings({ digest: { enabled: true, time: '11:00' } });
    await runDigest(NOON_CAIRO);
    const call = Notification.create.mock.calls[0][0];
    expect(call.body).toBe('3 registrations to approve · 5 submissions to grade');
    expect(call.dedupeKey).toBe('digest:2026-07-12');
  });

  it('stays quiet when there is nothing to report or the digest is off', async () => {
    teacherLookup();
    useSettings({ digest: { enabled: true, time: '11:00' } });
    User.countDocuments.mockResolvedValue(0);
    Assignment.aggregate.mockResolvedValue([]);
    await runDigest(NOON_CAIRO);
    expect(Notification.create).not.toHaveBeenCalled();

    User.countDocuments.mockResolvedValue(2);
    useSettings({ digest: { enabled: false, time: '11:00' } });
    await runDigest(NOON_CAIRO);
    expect(Notification.create).not.toHaveBeenCalled();
  });
});
