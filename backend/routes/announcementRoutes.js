const express = require('express');
const { body } = require('express-validator');
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike,
  addComment
} = require('../controllers/announcementController');
const { protect, teacherOnly } = require('../middleware/auth');

const router = express.Router();

// Announcement validation
const announcementValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('type').isIn(['general', 'assignment', 'exam', 'holiday', 'deadline', 'meeting', 'important']).withMessage('Invalid announcement type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('targetAudience').isIn(['all', 'students', 'parents', 'specific']).withMessage('Invalid target audience')
];

const commentValidation = [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
];

// Public routes (for authenticated users)
router.use(protect);

// User routes
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.put('/:id/like', toggleLike);
router.post('/:id/comments', commentValidation, addComment);

// Teacher-only routes
router.post('/', teacherOnly, announcementValidation, createAnnouncement);
router.get('/management/all', teacherOnly, getAllAnnouncements);
router.put('/:id', teacherOnly, updateAnnouncement);
router.delete('/:id', teacherOnly, deleteAnnouncement);

module.exports = router; 