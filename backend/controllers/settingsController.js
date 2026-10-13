const { validationResult } = require('express-validator');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { withDefaults, normalizeSite } = require('../validators/siteSettings');
const { withDefaults: notificationDefaults, normalizeNotifications, CATEGORIES } = require('../validators/notificationSettings');
const { clearSettingsCache } = require('../services/notifications');

const toSettingsView = (settings) => ({
  examSessions: settings.examSessions.map(({ code, label, open }) => ({ code, label, open })),
  royalClasses: [...settings.royalClasses],
  quickActions: settings.quickActions?.length ? [...settings.quickActions] : null,
  notifications: notificationDefaults(settings.notifications),
  notificationTypes: CATEGORIES,
  updatedAt: settings.updatedAt
});

// @desc    Options for the public registration form (open sessions + Royal classes)
// @route   GET /api/settings/registration
// @access  Public
const getRegistrationOptions = async (req, res) => {
  try {
    const settings = await AppSettings.getGlobal();
    res.status(200).json({
      status: 'success',
      data: {
        examSessions: settings.examSessions
          .filter(s => s.open)
          .map(({ code, label }) => ({ code, label })),
        royalClasses: [...settings.royalClasses]
      }
    });
  } catch (error) {
    console.error('Get registration options error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving registration options' });
  }
};

// @desc    Get all teacher-editable settings
// @route   GET /api/teacher/settings
// @access  Private (Teacher)
const getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getGlobal();
    const [sessionUsage, classUsage] = await Promise.all([
      User.aggregate([
        { $match: { role: 'student', 'studentInfo.session': { $ne: null } } },
        { $group: { _id: '$studentInfo.session', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { role: 'student', 'studentInfo.royalClass': { $ne: null } } },
        { $group: { _id: '$studentInfo.royalClass', count: { $sum: 1 } } }
      ])
    ]);
    const toMap = rows => Object.fromEntries(rows.map(r => [r._id, r.count]));

    res.status(200).json({
      status: 'success',
      data: {
        ...toSettingsView(settings),
        usage: { examSessions: toMap(sessionUsage), royalClasses: toMap(classUsage) }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving settings' });
  }
};

// @desc    Update exam sessions and/or Royal College classes
// @route   PUT /api/teacher/settings
// @access  Private (Teacher)
const updateSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: 'Validation errors', errors: errors.array() });
    }

    const { examSessions, royalClasses, quickActions, notifications, moveStudents = {} } = req.body;
    const settings = await AppSettings.getGlobal();

    // Values already held by students can be closed or renamed, but not removed,
    // so existing students always keep a valid session and class.
    const removedInUse = async (field, oldList, newList) => {
      const removed = oldList.filter(v => !newList.includes(v));
      if (!removed.length) return [];
      return User.distinct(field, { role: 'student', [field]: { $in: removed } });
    };

    if (examSessions) {
      const inUse = await removedInUse(
        'studentInfo.session',
        settings.examSessions.map(s => s.code),
        examSessions.map(s => s.code)
      );
      // A session that still has students can only be removed if the teacher says where they go.
      const newCodes = examSessions.map(s => s.code);
      const stuck = inUse.filter(code => !newCodes.includes(moveStudents[code]));
      if (stuck.length) {
        return res.status(409).json({
          status: 'error',
          message: `These sessions still have students: ${stuck.join(', ')}. Move them to another session, or close the session instead of removing it.`,
          errors: [{ path: 'examSessions', msg: `In use: ${stuck.join(', ')}` }]
        });
      }
      // Students and pending registrations move first, so nobody is ever left on a session that no longer exists.
      for (const code of inUse) {
        await User.updateMany({ role: 'student', 'studentInfo.session': code }, { $set: { 'studentInfo.session': moveStudents[code] } });
        await Registration.updateMany({ session: code }, { $set: { session: moveStudents[code] } });
      }
      settings.examSessions = examSessions;
    }

    if (royalClasses) {
      const inUse = await removedInUse('studentInfo.royalClass', settings.royalClasses, royalClasses);
      if (inUse.length) {
        return res.status(409).json({
          status: 'error',
          message: `These classes still have students: ${inUse.join(', ')}.`,
          errors: [{ path: 'royalClasses', msg: `In use: ${inUse.join(', ')}` }]
        });
      }
      settings.royalClasses = royalClasses;
    }

    if (quickActions) settings.quickActions = quickActions;

    if (notifications !== undefined) {
      const { value, errors: problems } = normalizeNotifications(notifications, settings.notifications);
      if (problems.length) return res.status(400).json({ status: 'error', message: problems[0].msg, errors: problems });
      settings.notifications = value;
      settings.markModified('notifications');
      clearSettingsCache();
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      status: 'success',
      message: 'Settings saved',
      data: toSettingsView(settings)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)[0]?.message || 'Invalid settings';
      return res.status(400).json({ status: 'error', message });
    }
    console.error('Update settings error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving settings' });
  }
};

// @desc    Public website content (numbers, contact details, visible sections, banner)
// @route   GET /api/settings/site
// @access  Public
const getSiteSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getGlobal();
    res.status(200).json({ status: 'success', data: withDefaults(settings.site) });
  } catch (error) {
    console.error('Get site settings error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving site settings' });
  }
};

// @desc    Update public website content (partial updates allowed)
// @route   PUT /api/teacher/settings/site
// @access  Private (Teacher)
const updateSiteSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getGlobal();
    const { value, errors } = normalizeSite(req.body, settings.site);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors[0].msg, errors });
    }
    settings.site = value;
    settings.markModified('site');
    settings.updatedBy = req.user._id;
    await settings.save();
    res.status(200).json({ status: 'success', message: 'Website settings saved', data: withDefaults(settings.site) });
  } catch (error) {
    console.error('Update site settings error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving site settings' });
  }
};

module.exports = { getRegistrationOptions, getSettings, updateSettings, getSiteSettings, updateSiteSettings };
