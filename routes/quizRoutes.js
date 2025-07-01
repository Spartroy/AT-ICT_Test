const express = require('express');
const { body } = require('express-validator');
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  assignToStudents,
  downloadSubmissionFile,
  getQuizSubmissions
} = require('../controllers/quizController');
const { protect, teacherOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Quiz validation
const quizValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim(),
  body('type').isIn(['theory', 'practical']).withMessage('Invalid quiz type'),
  body('section').isIn(['theory', 'practical']).withMessage('Invalid section type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty')
];

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

// Quiz routes
router.post('/', upload.array('attachments', 5), quizValidation, createQuiz);
router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.get('/:id/submissions', getQuizSubmissions);
router.get('/:id/submissions/:studentId/download/:filename', downloadSubmissionFile);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);
router.post('/:id/assign', assignToStudents);

module.exports = router; 