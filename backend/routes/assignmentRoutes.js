const express = require('express');
const { body } = require('express-validator');
const {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  assignToStudents,
  downloadSubmissionFile,
  getAssignmentSubmissions
} = require('../controllers/assignmentController');
const { protect, teacherOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Assignment validation
const assignmentValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim(),
  body('type').isIn(['classified', 'task', 'pastpapers']).withMessage('Invalid assignment type'),
  body('section').isIn(['theory', 'practical']).withMessage('Invalid section type'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty')
];

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

// Assignment routes
router.post('/', upload.array('attachments', 5), assignmentValidation, createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.get('/:id/submissions', getAssignmentSubmissions);
router.get('/:id/submissions/:studentId/download/:filename', downloadSubmissionFile);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/assign', assignToStudents);

module.exports = router; 