// Teacher-editable notification rules (stored in AppSettings.notifications). Missing keys fall back to DEFAULTS.

// Every kind of notification, who receives it, and the label shown in settings. Keep ids in sync with the client.
const CATEGORIES = [
  { id: 'hw_assigned', audience: 'student', label: 'New homework' },
  { id: 'hw_due', audience: 'student', label: 'Homework due soon' },
  { id: 'hw_graded', audience: 'student', label: 'Homework graded' },
  { id: 'announcement', audience: 'student', label: 'Announcements' },
  { id: 'class_soon', audience: 'student', label: 'Class starting soon' },
  { id: 'content', audience: 'student', label: 'New videos, notes and materials' },
  { id: 'chat', audience: 'student', label: 'Messages from the teacher' },
  { id: 't_registration', audience: 'teacher', label: 'New registrations' },
  { id: 't_submission', audience: 'teacher', label: 'New submissions to grade' },
  { id: 't_chat', audience: 'teacher', label: 'Messages from students' },
  { id: 't_payment', audience: 'teacher', label: 'Payment proofs to review' },
  { id: 't_digest', audience: 'teacher', label: 'Daily digest' }
];
const CATEGORY_IDS = CATEGORIES.map(c => c.id);

const DEFAULTS = Object.freeze({
  studentsCanChoose: true,
  categories: Object.freeze(Object.fromEntries(CATEGORY_IDS.map(id => [id, true]))),
  homeworkReminders: Object.freeze([1440, 120]), // minutes before the deadline
  classReminderMinutes: 30,
  digest: Object.freeze({ enabled: true, time: '08:00' }),
  quietHours: Object.freeze({ enabled: true, start: '22:00', end: '07:00' }),
  timezone: 'Africa/Cairo'
});

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_REMINDERS = 4;
const validZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return typeof tz === 'string' && tz.length < 60;
  } catch {
    return false;
  }
};

/** Stored value (possibly partial or missing) → complete settings object. */
function withDefaults(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    studentsCanChoose: typeof r.studentsCanChoose === 'boolean' ? r.studentsCanChoose : DEFAULTS.studentsCanChoose,
    categories: { ...DEFAULTS.categories, ...Object.fromEntries(Object.entries(r.categories || {}).filter(([k, v]) => CATEGORY_IDS.includes(k) && typeof v === 'boolean')) },
    homeworkReminders: Array.isArray(r.homeworkReminders) ? [...r.homeworkReminders] : [...DEFAULTS.homeworkReminders],
    classReminderMinutes: Number.isInteger(r.classReminderMinutes) ? r.classReminderMinutes : DEFAULTS.classReminderMinutes,
    digest: { ...DEFAULTS.digest, ...(r.digest || {}) },
    quietHours: { ...DEFAULTS.quietHours, ...(r.quietHours || {}) },
    timezone: r.timezone || DEFAULTS.timezone
  };
}

/** Validates a partial update on top of the current value. Returns { value, errors: [{ path, msg }] }. */
function normalizeNotifications(input = {}, current) {
  const errors = [];
  const next = withDefaults(current);
  const i = input && typeof input === 'object' ? input : {};

  if (i.studentsCanChoose !== undefined) {
    if (typeof i.studentsCanChoose !== 'boolean') errors.push({ path: 'studentsCanChoose', msg: 'Choose yes or no' });
    else next.studentsCanChoose = i.studentsCanChoose;
  }
  if (i.categories !== undefined) {
    Object.entries(i.categories || {}).forEach(([id, on]) => {
      if (!CATEGORY_IDS.includes(id) || typeof on !== 'boolean') errors.push({ path: `categories.${id}`, msg: 'Unknown notification type' });
      else next.categories[id] = on;
    });
  }
  if (i.homeworkReminders !== undefined) {
    const list = i.homeworkReminders;
    if (!Array.isArray(list) || list.length > MAX_REMINDERS || !list.every(n => Number.isInteger(n) && n >= 5 && n <= 10080)) {
      errors.push({ path: 'homeworkReminders', msg: `Add up to ${MAX_REMINDERS} reminders, each between 5 minutes and 7 days` });
    } else if (new Set(list).size !== list.length) {
      errors.push({ path: 'homeworkReminders', msg: 'Each reminder time can only appear once' });
    } else next.homeworkReminders = [...list].sort((a, b) => b - a);
  }
  if (i.classReminderMinutes !== undefined) {
    if (!Number.isInteger(i.classReminderMinutes) || i.classReminderMinutes < 5 || i.classReminderMinutes > 240) errors.push({ path: 'classReminderMinutes', msg: 'Class reminders can be 5 to 240 minutes before' });
    else next.classReminderMinutes = i.classReminderMinutes;
  }
  if (i.digest !== undefined) {
    const d = i.digest || {};
    if (d.enabled !== undefined && typeof d.enabled !== 'boolean') errors.push({ path: 'digest.enabled', msg: 'Choose yes or no' });
    else if (d.enabled !== undefined) next.digest.enabled = d.enabled;
    if (d.time !== undefined && !CLOCK.test(d.time)) errors.push({ path: 'digest.time', msg: 'Digest time must look like 08:00' });
    else if (d.time !== undefined) next.digest.time = d.time;
  }
  if (i.quietHours !== undefined) {
    const q = i.quietHours || {};
    if (q.enabled !== undefined && typeof q.enabled !== 'boolean') errors.push({ path: 'quietHours.enabled', msg: 'Choose yes or no' });
    else if (q.enabled !== undefined) next.quietHours.enabled = q.enabled;
    ['start', 'end'].forEach((k) => {
      if (q[k] !== undefined && !CLOCK.test(q[k])) errors.push({ path: `quietHours.${k}`, msg: 'Quiet hours must look like 22:00' });
      else if (q[k] !== undefined) next.quietHours[k] = q[k];
    });
  }
  if (i.timezone !== undefined) {
    if (!validZone(i.timezone)) errors.push({ path: 'timezone', msg: 'Unknown time zone (e.g. Africa/Cairo)' });
    else next.timezone = i.timezone;
  }
  return { value: next, errors };
}

module.exports = { CATEGORIES, CATEGORY_IDS, DEFAULTS, MAX_REMINDERS, withDefaults, normalizeNotifications };
