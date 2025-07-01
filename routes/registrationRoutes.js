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
  body('year').isIn(['10', '11', '12']).withMessage('Year must be 10, 11, or 12'),
  body('nationality').trim().isLength({ min: 2 }).withMessage('Nationality is required'),
  body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('school').trim().isLength({ min: 2 }).withMessage('School is required'),
  body('session').isIn(['NOV 25', 'JUN 26']).withMessage('Session must be NOV 25 or JUN 26'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('contactNumber').trim().isLength({ min: 10 }).withMessage('Contact number must be at least 10 digits'),
  body('parentNumber').trim().isLength({ min: 10 }).withMessage('Parent number must be at least 10 digits'),
  body('techKnowledge').isInt({ min: 1, max: 10 }).withMessage('Tech knowledge must be between 1 and 10')
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