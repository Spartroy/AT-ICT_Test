const express = require('express');
const { body } = require('express-validator');
const { getRegistrationOptions, getSettings, updateSettings, getSiteSettings, updateSiteSettings } = require('../controllers/settingsController');
const { protect, teacherOnly } = require('../middleware/auth');
const { QUICK_ACTION_IDS, MAX_QUICK_ACTIONS } = require('../validators/quickActions');

const settingsValidation = [
  body('examSessions').optional().isArray({ min: 1 }).withMessage('Add at least one exam session'),
  body('examSessions.*.code')
    .trim().toUpperCase()
    .matches(/^[A-Z]{3} \d{2}$/).withMessage('Session code must look like "JUN 27"'),
  body('examSessions.*.label').trim().isLength({ min: 2, max: 60 }).withMessage('Session label must be 2-60 characters'),
  body('examSessions.*.open').isBoolean().withMessage('open must be true or false').toBoolean(),
  body('examSessions').optional().custom(list => {
    if (!list.some(s => s.open === true || s.open === 'true')) {
      throw new Error('Keep at least one session open for registration');
    }
    return true;
  }),
  body('royalClasses').optional().isArray({ min: 1 }).withMessage('Add at least one Royal College class'),
  body('royalClasses.*')
    .trim().toUpperCase()
    .matches(/^[A-Z0-9]{1,20}$/).withMessage('Class names can only contain letters and numbers (e.g. 9H)'),
  // Removing a session that still has students: { "JUN 26": "JUN 27" } moves them to the new session first.
  body('moveStudents').optional().custom(map => {
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('moveStudents must be an object');
    const code = /^[A-Z]{3} \d{2}$/;
    Object.entries(map).forEach(([from, to]) => {
      if (!code.test(from) || typeof to !== 'string' || !code.test(to)) throw new Error('moveStudents needs session codes like "JUN 27"');
    });
    return true;
  }),
  body('quickActions').optional().isArray({ min: 1, max: MAX_QUICK_ACTIONS }).withMessage(`Pick 1 to ${MAX_QUICK_ACTIONS} quick actions`),
  body('quickActions').optional().custom(list => {
    if (!list.every(id => QUICK_ACTION_IDS.includes(id))) throw new Error('Unknown quick action');
    if (new Set(list).size !== list.length) throw new Error('Each quick action can only appear once');
    return true;
  })
];

// Mounted at /api/settings (public) and /api/teacher/settings (teacher)
const publicRouter = express.Router();
publicRouter.get('/registration', getRegistrationOptions);
publicRouter.get('/site', getSiteSettings);

const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', getSettings);
teacherRouter.put('/', settingsValidation, updateSettings);
teacherRouter.put('/site', updateSiteSettings);

module.exports = { publicRouter, teacherRouter, settingsValidation };
