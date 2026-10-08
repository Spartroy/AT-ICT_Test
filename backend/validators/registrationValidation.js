const { body } = require('express-validator');
const AppSettings = require('../models/AppSettings');

// Student self-registration rules.
// schoolType 'royal'  → Royal College students: class only (no year, session, nationality, location).
// schoolType 'center' → Center / other schools: year, session, school, nationality, city, country.

const SCHOOL_TYPES = ['royal', 'center'];
const YEARS = ['10', '11', '12'];

const isRoyal = (value, { req }) => req.body.schoolType === 'royal';
const isCenter = (value, { req }) => req.body.schoolType === 'center';

const phone = (field, label) => body(field)
  .trim()
  .custom((value) => {
    const cleaned = String(value || '').replace(/[^\d+]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
      throw new Error(`Please provide a valid ${label} (7-15 digits)`);
    }
    return true;
  });

const name = (field, label) => body(field)
  .trim()
  .isLength({ min: 2, max: 50 }).withMessage(`${label} must be 2-50 characters`).bail()
  .matches(/^[a-zA-Z\s]+$/).withMessage(`${label} should only contain letters and spaces`);

const requiredText = (field, label) => body(field)
  .if(isCenter)
  .trim()
  .isLength({ min: 2 }).withMessage(`${label} is required`);

// Loads the teacher-editable lists (open sessions, Royal classes) once per request.
const loadRegistrationSettings = async (req, res, next) => {
  try {
    req.appSettings = await AppSettings.getGlobal();
    next();
  } catch (error) {
    next(error);
  }
};

const registrationValidation = [
  name('firstName', 'First name'),
  name('lastName', 'Last name'),
  body('email').trim().isEmail().withMessage('Please enter a valid email').bail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('schoolType').isIn(SCHOOL_TYPES).withMessage('School type must be royal or center'),
  phone('contactNumber', 'contact number'),
  phone('parentNumber', 'parent contact number'),
  body('techKnowledge').isInt({ min: 1, max: 10 }).withMessage('Tech knowledge must be between 1 and 10').toInt(),
  body('englishLevel').isInt({ min: 1, max: 10 }).withMessage('English level must be between 1 and 10').toInt(),

  // Royal College
  body('royalClass')
    .if(isRoyal)
    .trim()
    .notEmpty().withMessage('Class is required for Royal College students').bail()
    .custom((value, { req }) => {
      if (!req.appSettings.royalClasses.includes(value.toUpperCase())) {
        throw new Error('Please choose one of the listed classes');
      }
      return true;
    })
    .toUpperCase(),

  // Center / other school
  body('year')
    .if(isCenter)
    .customSanitizer(value => (value == null ? value : String(value)))
    .isIn(YEARS).withMessage('Year must be 10, 11, or 12'),
  body('session')
    .if(isCenter)
    .trim()
    .notEmpty().withMessage('Session is required').bail()
    .custom((value, { req }) => {
      const open = req.appSettings.examSessions.filter(s => s.open).map(s => s.code);
      if (!open.includes(value.toUpperCase())) {
        throw new Error('Please choose one of the open exam sessions');
      }
      return true;
    })
    .toUpperCase(),
  requiredText('school', 'School'),
  requiredText('nationality', 'Nationality'),
  requiredText('city', 'City'),
  requiredText('country', 'Country'),
  body('isRetaker').optional({ values: 'null' }).isBoolean().withMessage('Retaker must be true or false').toBoolean(),
  body('otherSubjects')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 }).withMessage('Other subjects cannot be more than 500 characters')
];

module.exports = {
  registrationValidation,
  loadRegistrationSettings,
  SCHOOL_TYPES
};
