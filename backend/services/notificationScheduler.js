// Timed notifications: homework deadlines, classes about to start, scheduled announcements, the teacher's daily digest,
// and pushes held back during quiet hours. Runs inside the API process every few minutes; `dedupeKey` on each
// notification keeps a reminder from being sent twice even if two runs overlap.
const Assignment = require('../models/Assignment');
const Schedule = require('../models/Schedule');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { notify, flushPending, getNotificationSettings, studentIds, teacherIds } = require('./notifications');
const { clockToMinutes, humanMinutes, zonedParts } = require('./notificationTime');

const TICK_MS = 5 * 60 * 1000;
const MIN = 60 * 1000;

/** "Due in 2 hours" for students who haven't handed in yet. Only the nearest reminder time that applies is used. */
async function runHomeworkReminders(now = new Date()) {
  const s = await getNotificationSettings();
  const offsets = [...s.homeworkReminders].sort((a, b) => a - b);
  if (!offsets.length) return 0;
  const assignments = await Assignment.find({
    isActive: { $ne: false },
    dueDate: { $gt: now, $lte: new Date(now.getTime() + offsets[offsets.length - 1] * MIN) }
  }).select('title dueDate publishDate assignedTo');

  let sent = 0;
  for (const a of assignments) {
    if (a.publishDate && a.publishDate > now) continue;
    const remaining = (a.dueDate - now) / MIN;
    const offset = offsets.find(o => remaining <= o);
    // Students who were only just given the homework already got the "new homework" notification.
    const recipients = a.assignedTo
      .filter(x => ['assigned', 'in_progress'].includes(x.status) && !(x.assignedDate && x.assignedDate > new Date(now.getTime() - 30 * MIN)))
      .map(x => x.student);
    sent += await notify(recipients, {
      type: 'hw_due',
      title: `Homework due in ${humanMinutes(remaining)}`,
      body: a.title,
      url: '/student-dashboard/work/assignments',
      dedupeKey: `hwdue:${a._id}:${offset}`
    });
  }
  return sent;
}

/** "Class starts in 30 min" for students of the schedules that have a session today. */
async function runClassReminders(now = new Date()) {
  const s = await getNotificationSettings();
  const today = zonedParts(now, s.timezone);
  const schedules = await Schedule.find({ isActive: { $ne: false } }).select('title schedule assignedStudents groups startDate endDate');
  let sent = 0;
  for (const sch of schedules) {
    if ((sch.startDate && sch.startDate > now) || (sch.endDate && sch.endDate < new Date(now.getTime() - 24 * 3600 * 1000))) continue;
    const day = (sch.schedule || []).find(d => d.day === today.weekday);
    if (!day) continue;
    const students = [...(sch.assignedStudents || []).map(x => x.student), ...(sch.groups?.length ? await require('./groups').membersOf(sch.groups) : [])];
    for (const session of day.sessions || []) {
      if (session.isActive === false) continue;
      const start = clockToMinutes(session.startTime);
      if (start === null) continue;
      const delta = start - today.minutes;
      if (delta <= 0 || delta > s.classReminderMinutes) continue;
      sent += await notify(students, {
        type: 'class_soon',
        title: `${session.topic || 'Class'} starts in ${humanMinutes(delta)}`,
        body: `${session.startTime} to ${session.endTime} · ${session.type || ''}`.trim(),
        url: '/student-dashboard/schedule',
        dedupeKey: `class:${sch._id}:${today.ymd}:${session.startTime}`
      });
    }
  }
  return sent;
}

/** Announcements the teacher scheduled for later (instant ones are sent when created, with the same dedupeKey). */
async function runScheduledAnnouncements(now = new Date()) {
  const due = await Announcement.find({
    isPublished: { $ne: false },
    scheduledFor: { $lte: now, $gte: new Date(now.getTime() - 24 * 3600 * 1000) }
  }).select('title content targetAudience groups specificTargets expiresAt');
  let sent = 0;
  for (const a of due) {
    if (a.expiresAt && a.expiresAt < now) continue;
    sent += await notifyAnnouncement(a);
  }
  return sent;
}

/** Sends one announcement to its audience (students; parents are not covered yet). */
async function notifyAnnouncement(a) {
  let ids = [];
  if (a.targetAudience === 'specific') ids = a.specificTargets || [];
  else if (a.groups?.length) ids = await require('./groups').membersOf(a.groups);
  else if (a.targetAudience === 'all' || a.targetAudience === 'students') ids = await studentIds();
  return notify(ids, {
    type: 'announcement',
    title: a.title,
    body: String(a.content || '').slice(0, 140),
    url: '/student-dashboard/inbox/announcements',
    dedupeKey: `ann:${a._id}`
  });
}

/** One morning summary for the teacher: pending registrations and submissions waiting for a grade. */
async function runDigest(now = new Date()) {
  const s = await getNotificationSettings();
  if (!s.digest.enabled) return 0;
  const today = zonedParts(now, s.timezone);
  const at = clockToMinutes(s.digest.time);
  if (at === null || today.minutes < at || today.minutes - at > 180) return 0; // only within 3 hours after the set time

  const [registrations, toGrade] = await Promise.all([
    User.countDocuments({ role: 'student', registrationStatus: 'pending' }),
    Assignment.aggregate([{ $unwind: '$assignedTo' }, { $match: { 'assignedTo.status': 'submitted' } }, { $count: 'n' }]).then(r => r[0]?.n || 0)
  ]);
  if (!registrations && !toGrade) return 0;
  const parts = [];
  if (registrations) parts.push(`${registrations} registration${registrations === 1 ? '' : 's'} to approve`);
  if (toGrade) parts.push(`${toGrade} submission${toGrade === 1 ? '' : 's'} to grade`);
  return notify(await teacherIds(), {
    type: 't_digest',
    title: 'Your day at a glance',
    body: parts.join(' · '),
    url: registrations ? '/teacher-dashboard/students/registrations' : '/teacher-dashboard/work/submissions',
    dedupeKey: `digest:${today.ymd}`
  });
}

async function runAll(now = new Date()) {
  const steps = { runHomeworkReminders, runClassReminders, runScheduledAnnouncements, runDigest, flushPending };
  for (const [name, fn] of Object.entries(steps)) {
    try { await fn(now); } catch (err) { console.error(`Notification scheduler (${name}):`, err.message); }
  }
}

let timer = null;
/**
 * Starts the recurring check (once). It runs in production by default; on a developer machine it stays off unless
 * NOTIFICATIONS_SCHEDULER=on, so a local server pointed at the live database doesn't send real reminders.
 * NOTIFICATIONS_SCHEDULER=off turns it off anywhere. The timer never keeps the process alive on its own.
 */
function startNotificationScheduler() {
  const setting = process.env.NOTIFICATIONS_SCHEDULER;
  const enabled = setting ? setting === 'on' : process.env.NODE_ENV === 'production';
  if (!enabled || timer) return;
  setTimeout(runAll, 30 * 1000).unref();
  timer = setInterval(runAll, TICK_MS);
  timer.unref();
}

module.exports = { startNotificationScheduler, runAll, runHomeworkReminders, runClassReminders, runScheduledAnnouncements, runDigest, notifyAnnouncement };
