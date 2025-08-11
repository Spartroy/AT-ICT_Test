const express = require('express');
const {
  getStudentSessions,
  getStudentSessionStats,
  deactivateStudentSession,
  deactivateAllStudentSessions
} = require('../controllers/teacherSessionController');
const { protect, teacherOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and teacher role
router.use(protect);
router.use(teacherOnly);

// Get all student sessions for monitoring
router.get('/students', getStudentSessions);

// Get session statistics for all students
router.get('/stats', getStudentSessionStats);

// Deactivate a specific student session
router.delete('/students/:studentId/:sessionId', deactivateStudentSession);

// Deactivate all sessions for a specific student
router.delete('/students/:studentId/all', deactivateAllStudentSessions);

module.exports = router; 