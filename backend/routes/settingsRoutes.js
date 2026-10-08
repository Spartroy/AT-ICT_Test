const express = require('express');
const { body } = require('express-validator');
const { getRegistrationOptions, getSettings, updateSettings, getSiteSettings, updateSiteSettings } = require('../controllers/settingsController');
const { protect, teacherOnly } = require('../middleware/auth');

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
    .matches(/^[A-Z0-9]{1,20}$/).withMessage('Class names can only contain letters and numbers (e.g. 9H)')
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
