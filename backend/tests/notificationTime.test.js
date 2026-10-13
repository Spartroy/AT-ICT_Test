const { clockToMinutes, zonedParts, inQuietHours, humanMinutes } = require('../services/notificationTime');
const { withDefaults, normalizeNotifications, DEFAULTS } = require('../validators/notificationSettings');

describe('clockToMinutes', () => {
  it('reads 24-hour and 12-hour times', () => {
    expect(clockToMinutes('19:00')).toBe(1140);
    expect(clockToMinutes('7:00 PM')).toBe(1140);
    expect(clockToMinutes('12:30 AM')).toBe(30);
    expect(clockToMinutes('12:30 PM')).toBe(750);
    expect(clockToMinutes('08:05')).toBe(485);
  });
  it('rejects nonsense', () => {
    ['', 'abc', '25:00', '13:00 PM', '7:75', null].forEach(v => expect(clockToMinutes(v)).toBeNull());
  });
});

describe('zonedParts', () => {
  it('converts UTC to the school time zone (Cairo is UTC+3 in summer, UTC+2 in winter)', () => {
    const summer = zonedParts(new Date('2026-07-12T17:00:00Z'), 'Africa/Cairo');
    expect(summer).toEqual({ weekday: 'Sunday', ymd: '2026-07-12', minutes: 20 * 60 });
    const winter = zonedParts(new Date('2026-01-12T17:00:00Z'), 'Africa/Cairo');
    expect(winter.minutes).toBe(19 * 60);
  });
  it('rolls over to the next local day', () => {
    const p = zonedParts(new Date('2026-07-12T22:30:00Z'), 'Africa/Cairo');
    expect(p.ymd).toBe('2026-07-13');
    expect(p.weekday).toBe('Monday');
    expect(p.minutes).toBe(90);
  });
});

describe('inQuietHours', () => {
  const q = { enabled: true, start: '22:00', end: '07:00' };
  it('handles a window that wraps past midnight', () => {
    expect(inQuietHours(23 * 60, q)).toBe(true);
    expect(inQuietHours(3 * 60, q)).toBe(true);
    expect(inQuietHours(7 * 60, q)).toBe(false);
    expect(inQuietHours(12 * 60, q)).toBe(false);
    expect(inQuietHours(22 * 60, q)).toBe(true);
  });
  it('handles a same-day window and being switched off', () => {
    expect(inQuietHours(13 * 60, { enabled: true, start: '12:00', end: '14:00' })).toBe(true);
    expect(inQuietHours(15 * 60, { enabled: true, start: '12:00', end: '14:00' })).toBe(false);
    expect(inQuietHours(23 * 60, { ...q, enabled: false })).toBe(false);
  });
});

describe('humanMinutes', () => {
  it('words durations', () => {
    expect(humanMinutes(45)).toBe('45 min');
    expect(humanMinutes(60)).toBe('1 hour');
    expect(humanMinutes(90)).toBe('1 hour 30 min');
    expect(humanMinutes(120)).toBe('2 hours');
    expect(humanMinutes(1440)).toBe('1 day');
    expect(humanMinutes(2880)).toBe('2 days');
  });
});

describe('notification settings validation', () => {
  it('fills in defaults for a fresh install', () => {
    const s = withDefaults(undefined);
    expect(s.homeworkReminders).toEqual([1440, 120]);
    expect(s.digest).toEqual({ enabled: true, time: '08:00' });
    expect(s.studentsCanChoose).toBe(true);
    expect(s.timezone).toBe('Africa/Cairo');
    expect(Object.values(s.categories).every(Boolean)).toBe(true);
  });

  it('applies a partial update on top of what is stored, sorting reminders longest first', () => {
    const { value, errors } = normalizeNotifications({ homeworkReminders: [60, 2880, 360], digest: { time: '07:30' }, categories: { content: false } }, { digest: { enabled: false } });
    expect(errors).toEqual([]);
    expect(value.homeworkReminders).toEqual([2880, 360, 60]);
    expect(value.digest).toEqual({ enabled: false, time: '07:30' });
    expect(value.categories.content).toBe(false);
    expect(value.categories.hw_due).toBe(true);
  });

  it.each([
    [{ homeworkReminders: [1, 120] }],
    [{ homeworkReminders: [60, 60] }],
    [{ homeworkReminders: [10, 20, 30, 40, 50] }],
    [{ classReminderMinutes: 500 }],
    [{ digest: { time: '8am' } }],
    [{ quietHours: { start: '25:00' } }],
    [{ timezone: 'Mars/Olympus' }],
    [{ categories: { nonsense: true } }],
    [{ studentsCanChoose: 'yes' }]
  ])('rejects %j', (input) => {
    expect(normalizeNotifications(input, undefined).errors.length).toBeGreaterThan(0);
  });

  it('does not change the shared defaults', () => {
    normalizeNotifications({ categories: { hw_due: false } }, undefined);
    expect(DEFAULTS.categories.hw_due).toBe(true);
  });
});
