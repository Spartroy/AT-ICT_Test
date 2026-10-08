const { validationResult } = require('express-validator');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

const toSettingsView = (settings) => ({
  examSessions: settings.examSessions.map(({ code, label, open }) => ({ code, label, open })),
  royalClasses: [...settings.royalClasses],
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

    const { examSessions, royalClasses } = req.body;
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
      if (inUse.length) {
        return res.status(409).json({
          status: 'error',
          message: `These sessions still have students: ${inUse.join(', ')}. Close them instead of removing them.`,
          errors: [{ path: 'examSessions', msg: `In use: ${inUse.join(', ')}` }]
        });
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

module.exports = { getRegistrationOptions, getSettings, updateSettings };
