const express = require('express');
const { body } = require('express-validator');
const {
  submitRegistration,
  getPendingRegistrations,
  getAllRegistrations,
  getRegistration,
  approveRegistration,
  rejectRegistration,
  updateRegistrationNotes
} = require('../controllers/registrationController');
const { protect, teacherOnly } = require('../middleware/auth');

const router = express.Router();

// Validation rules for registration submission
const registrationValidation = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('schoolType').isIn(['royal', 'center']).withMessage('School type must be royal or center'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('contactNumber').trim().custom((value) => {
    // Remove all non-digit characters except + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '');
    // Check if it's a valid phone number format
    // Accepts: +1234567890, 1234567890, 03001234567, etc.
    if (!/^[\+]?[0-9]{7,15}$/.test(cleaned)) {
      throw new Error('Please provide a valid contact number (7-15 digits)');
    }
    return true;
  }),
  body('parentNumber').trim().custom((value) => {
    // Remove all non-digit characters except + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '');
    // Check if it's a valid phone number format
    // Accepts: +1234567890, 1234567890, 03001234567, etc.
    if (!/^[\+]?[0-9]{7,15}$/.test(cleaned)) {
      throw new Error('Please provide a valid parent contact number (7-15 digits)');
    }
    return true;
  }),
  body('techKnowledge').isInt({ min: 1, max: 10 }).withMessage('Tech knowledge must be between 1 and 10'),
  body('englishLevel').isInt({ min: 1, max: 10 }).withMessage('English level must be between 1 and 10'),
  
  // Conditional validation for Center students
  body('year').custom((value, { req }) => {
    if (req.body.schoolType === 'center' && !value) {
      throw new Error('Year is required for Center students');
    }
    if (value && !['10', '11', '12'].includes(value)) {
      throw new Error('Year must be 10, 11, or 12');
    }
    return true;
  }),
  body('nationality').custom((value, { req }) => {
    if (req.body.schoolType === 'center' && !value) {
      throw new Error('Nationality is required for Center students');
    }
    if (value && value.trim().length < 2) {
      throw new Error('Nationality must be at least 2 characters');
    }
    return true;
  }),
  body('city').custom((value, { req }) => {
    if (req.body.schoolType === 'center' && !value) {
      throw new Error('City is required for Center students');
    }
    if (value && value.trim().length < 2) {
      throw new Error('City must be at least 2 characters');
    }
    return true;
  }),
  body('school').custom((value, { req }) => {
    if (req.body.schoolType === 'center' && !value) {
      throw new Error('School is required for Center students');
    }
    if (value && value.trim().length < 2) {
      throw new Error('School must be at least 2 characters');
    }
    return true;
  }),
  body('session').custom((value, { req }) => {
    if (req.body.schoolType === 'center' && !value) {
      throw new Error('Session is required for Center students');
    }
    if (value && !['NOV 25', 'JUN 26'].includes(value)) {
      throw new Error('Session must be NOV 25 or JUN 26');
    }
    return true;
  }),
  
  // Conditional validation for Royal students
  body('royalClass').custom((value, { req }) => {
    if (req.body.schoolType === 'royal' && !value) {
      throw new Error('Royal class is required for Royal College students');
    }
    if (value && !['9H', '9J'].includes(value)) {
      throw new Error('Royal class must be 9H or 9J');
    }
    return true;
  }),
  body('royalNationality').custom((value, { req }) => {
    if (req.body.schoolType === 'royal' && !value) {
      throw new Error('Nationality is required for Royal College students');
    }
    if (value && value.trim().length < 2) {
      throw new Error('Nationality must be at least 2 characters');
    }
    return true;
  })
];

// Public routes
router.post('/submit', registrationValidation, submitRegistration);

// Teacher-only routes
router.get('/pending', protect, teacherOnly, getPendingRegistrations);
router.get('/all', protect, teacherOnly, getAllRegistrations);
router.get('/:id', protect, teacherOnly, getRegistration);
router.put('/:id/approve', protect, teacherOnly, [
  body('feeAmount').optional().isNumeric().withMessage('Fee amount must be a number')
], approveRegistration);
router.put('/:id/reject', protect, teacherOnly, [
  body('reason').trim().isLength({ min: 5 }).withMessage('Rejection reason must be at least 5 characters')
], rejectRegistration);
router.put('/:id/notes', protect, teacherOnly, updateRegistrationNotes);

module.exports = router; 