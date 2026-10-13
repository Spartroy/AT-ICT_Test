const Notification = require('../models/Notification');
const NotificationPref = require('../models/NotificationPref');
const PushSubscription = require('../models/PushSubscription');
const { CATEGORIES } = require('../validators/notificationSettings');
const { notify, getNotificationSettings, pushConfigured } = require('../services/notifications');

const audienceOf = (role) => (role === 'teacher' ? 'teacher' : 'student');

// @desc    My latest notifications + unread count
// @route   GET /api/notifications
const listNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40).lean(),
      Notification.countDocuments({ user: req.user._id, read: false })
    ]);
    res.status(200).json({ status: 'success', data: { notifications, unreadCount } });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving notifications' });
  }
};

// @desc    Mark some (ids) or all notifications as read
// @route   POST /api/notifications/read
const markRead = async (req, res) => {
  try {
    const { ids, all } = req.body || {};
    const filter = { user: req.user._id, read: false };
    if (!all) {
      if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ status: 'error', message: 'Say which notifications to mark as read' });
      filter._id = { $in: ids.slice(0, 100) };
    }
    const result = await Notification.updateMany(filter, { read: true });
    res.status(200).json({ status: 'success', data: { updated: result.modifiedCount } });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Server error updating notifications' });
  }
};

// @desc    Public VAPID key the browser needs to subscribe (null when push is not configured on the server)
// @route   GET /api/notifications/push-key
const getPushKey = (req, res) => {
  res.status(200).json({ status: 'success', data: { publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null } });
};

// @desc    Save this device's push subscription
// @route   POST /api/notifications/subscribe
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body || {};
    const ok = subscription && typeof subscription.endpoint === 'string' && /^https:\/\//.test(subscription.endpoint) && subscription.keys?.p256dh && subscription.keys?.auth;
    if (!ok) return res.status(400).json({ status: 'error', message: 'Invalid push subscription' });
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { user: req.user._id, endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }, userAgent: String(req.get('user-agent') || '').slice(0, 300), lastUsedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', message: 'Notifications enabled on this device' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving the subscription' });
  }
};

// @desc    Forget this device
// @route   DELETE /api/notifications/subscribe
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) await PushSubscription.deleteOne({ user: req.user._id, endpoint });
    res.status(200).json({ status: 'success', message: 'Notifications turned off on this device' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ status: 'error', message: 'Server error removing the subscription' });
  }
};

// @desc    The types I can switch on or off, and whether I'm allowed to
// @route   GET /api/notifications/preferences
const getPreferences = async (req, res) => {
  try {
    const [s, pref] = await Promise.all([getNotificationSettings(), NotificationPref.findOne({ user: req.user._id })]);
    const mayChoose = req.user.role !== 'student' || s.studentsCanChoose;
    const audience = audienceOf(req.user.role);
    const types = CATEGORIES
      .filter(c => c.audience === audience && s.categories[c.id] !== false)
      .map(c => ({ id: c.id, label: c.label, enabled: !mayChoose || pref?.overrides?.get(c.id) !== false }));
    res.status(200).json({ status: 'success', data: { canChoose: mayChoose, types } });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving preferences' });
  }
};

// @desc    Save my choices: { overrides: { hw_due: false } }
// @route   PUT /api/notifications/preferences
const updatePreferences = async (req, res) => {
  try {
    const s = await getNotificationSettings();
    if (req.user.role === 'student' && !s.studentsCanChoose) {
      return res.status(403).json({ status: 'error', message: 'Your teacher chooses which notifications you get.' });
    }
    const allowed = new Set(CATEGORIES.filter(c => c.audience === audienceOf(req.user.role)).map(c => c.id));
    const incoming = req.body?.overrides && typeof req.body.overrides === 'object' ? req.body.overrides : {};
    const pref = (await NotificationPref.findOne({ user: req.user._id })) || new NotificationPref({ user: req.user._id });
    Object.entries(incoming).forEach(([id, on]) => {
      if (allowed.has(id) && typeof on === 'boolean') pref.overrides.set(id, on);
    });
    await pref.save();
    res.status(200).json({ status: 'success', message: 'Notification settings saved' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving preferences' });
  }
};

// @desc    Send myself a test notification (to check this device works)
// @route   POST /api/notifications/test
const sendTest = async (req, res) => {
  const created = await notify([req.user._id], { type: 'test', title: 'Notifications are working', body: 'This is a test from AT-ICT.', url: '/', urgent: true });
  res.status(200).json({ status: 'success', message: created ? 'Test notification sent' : 'Nothing was sent', data: { pushConfigured: pushConfigured() } });
};

module.exports = { listNotifications, markRead, getPushKey, subscribe, unsubscribe, getPreferences, updatePreferences, sendTest };
