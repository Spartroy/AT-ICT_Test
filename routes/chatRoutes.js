const express = require('express');
const { body } = require('express-validator');
const {
  getStudentTeacher,
  getTeacherStudents,
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  downloadFile
} = require('../controllers/chatController');
const { protect, teacherOnly, studentOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Message validation
const sendMessageValidation = [
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('content').optional().trim().isLength({ min: 0, max: 2000 }).withMessage('Message content cannot be more than 2000 characters'),
  body('type').optional().isIn(['text', 'image', 'file', 'audio', 'video']).withMessage('Invalid message type')
];

// Student-specific routes
router.get('/student/teacher', studentOnly, getStudentTeacher);

// Teacher-specific routes
router.get('/teacher/students', teacherOnly, getTeacherStudents);

// General chat routes
router.get('/conversations', getConversations);
router.get('/conversations/:userId', getConversationMessages);
router.post('/send', upload.array('files', 5), sendMessageValidation, sendMessage);
router.put('/messages/:messageId/read', markMessageAsRead);
router.get('/unread-count', getUnreadCount);
router.delete('/messages/:messageId', deleteMessage);

// File download route
router.get('/files/:messageId/:filename', downloadFile);

module.exports = router; 