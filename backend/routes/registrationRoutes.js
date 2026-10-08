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
const { registrationValidation, loadRegistrationSettings } = require('../validators/registrationValidation');

const router = express.Router();

// Public routes
router.post('/submit', loadRegistrationSettings, registrationValidation, submitRegistration);

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