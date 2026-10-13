// Creates in-app notifications and sends them as Web Push to every device the person has enabled.
// Nothing here throws into the caller: a failed notification must never break saving homework, messages, etc.
const webpush = require('web-push');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');
const Notification = require('../models/Notification');
const NotificationPref = require('../models/NotificationPref');
const PushSubscription = require('../models/PushSubscription');
const { withDefaults } = require('../validators/notificationSettings');
const { zonedParts, inQuietHours } = require('./notificationTime');

let vapidReady = null;
/** Web Push needs the VAPID keys from the environment; without them notifications stay in-app only. */
function pushConfigured() {
  if (vapidReady === null) {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    vapidReady = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
    if (vapidReady) webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    else console.warn('Notifications: VAPID keys are not set, push is disabled (in-app notifications still work).');
  }
  return vapidReady;
}

let cached = { at: 0, value: null };
/** The teacher's notification rules, cached for 20 seconds. */
async function getNotificationSettings() {
  if (cached.value && Date.now() - cached.at < 20000) return cached.value;
  const settings = await AppSettings.getGlobal();
  cached = { at: Date.now(), value: withDefaults(settings.notifications) };
  return cached.value;
}
const clearSettingsCache = () => { cached = { at: 0, value: null }; };

const isQuietNow = (s, now = new Date()) => inQuietHours(zonedParts(now, s.timezone).minutes, s.quietHours);

/** Whether this person should get this type: the teacher's switch first, then their own choice if they're allowed one. */
function wantsType(s, role, type, overrides) {
  if (s.categories[type] === false) return false;
  const mayChoose = role !== 'student' || s.studentsCanChoose;
  return !(mayChoose && overrides?.get?.(type) === false);
}

/** Sends one stored notification to all of a user's devices; dead subscriptions are removed. */
async function sendPush(doc) {
  if (!pushConfigured()) return;
  const subs = await PushSubscription.find({ user: doc.user });
  if (!subs.length) return;
  const payload = JSON.stringify({ id: String(doc._id), title: doc.title, body: doc.body, url: doc.url || '/', tag: doc.type });
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, payload, { TTL: 60 * 60 * 24 });
      await PushSubscription.updateOne({ _id: sub._id }, { lastUsedAt: new Date() });
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) await PushSubscription.deleteOne({ _id: sub._id });
      else console.warn('Push failed:', err.statusCode || err.message);
    }
  }));
}

/**
 * notify(userIds, { type, title, body, url, dedupeKey, urgent })
 * Saves an in-app notification for each person who wants it, and pushes it unless it is quiet hours
 * (urgent ones ignore quiet hours; the others are pushed when quiet hours end). Returns how many were created.
 */
async function notify(userIds, { type, title, body = '', url = '', dedupeKey, urgent = false }) {
  try {
    const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String))];
    if (!ids.length) return 0;
    const s = await getNotificationSettings();
    if (s.categories[type] === false) return 0;

    const [users, prefs] = await Promise.all([
      User.find({ _id: { $in: ids }, isActive: { $ne: false } }).select('role'),
      NotificationPref.find({ user: { $in: ids } })
    ]);
    const prefOf = new Map(prefs.map(p => [String(p.user), p.overrides]));
    const quiet = isQuietNow(s);
    let created = 0;

    for (const user of users) {
      if (!wantsType(s, user.role, type, prefOf.get(String(user._id)))) continue;
      let doc;
      try {
        doc = await Notification.create({ user: user._id, type, title, body, url, dedupeKey: dedupeKey || undefined });
      } catch (err) {
        if (err.code === 11000) continue; // already sent (timed reminders run more than once)
        throw err;
      }
      created += 1;
      if (!quiet || urgent) {
        await sendPush(doc);
        await Notification.updateOne({ _id: doc._id }, { pushed: true });
      }
    }
    return created;
  } catch (err) {
    console.error('Notification error:', err.message);
    return 0;
  }
}

/** Pushes what was held back during quiet hours. More than 3 waiting for one person become a single summary. */
async function flushPending(now = new Date()) {
  const s = await getNotificationSettings();
  if (isQuietNow(s, now)) return 0;
  const waiting = await Notification.find({ pushed: false, createdAt: { $gt: new Date(now - 24 * 3600 * 1000) } }).sort({ createdAt: 1 }).limit(500);
  const byUser = new Map();
  waiting.forEach(n => byUser.set(String(n.user), [...(byUser.get(String(n.user)) || []), n]));
  for (const list of byUser.values()) {
    if (list.length > 3) {
      await sendPush({ _id: list[0]._id, user: list[0].user, type: 'summary', title: `${list.length} new notifications`, body: list.slice(0, 3).map(n => n.title).join(' · '), url: '/' });
    } else {
      for (const n of list) await sendPush(n);
    }
  }
  if (waiting.length) await Notification.updateMany({ _id: { $in: waiting.map(n => n._id) } }, { pushed: true });
  // Anything older than a day is not worth a push any more.
  await Notification.updateMany({ pushed: false, createdAt: { $lte: new Date(now - 24 * 3600 * 1000) } }, { pushed: true });
  return waiting.length;
}

/** Ids of every active student (approved), for notifications to everyone. */
async function studentIds() {
  const rows = await User.find({ role: 'student', registrationStatus: 'approved', isActive: { $ne: false } }).select('_id');
  return rows.map(r => r._id);
}

/** Ids of the teacher account(s). */
async function teacherIds() {
  const rows = await User.find({ role: 'teacher', isActive: { $ne: false } }).select('_id');
  return rows.map(r => r._id);
}

module.exports = { notify, flushPending, sendPush, pushConfigured, getNotificationSettings, clearSettingsCache, isQuietNow, wantsType, studentIds, teacherIds };
