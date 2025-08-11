const express = require('express');
const {
  getActiveSessions,
  deactivateSession,
  deactivateAllOtherSessions,
  getSessionStats
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all active sessions for current user
router.get('/', getActiveSessions);

// Get session statistics
router.get('/stats', getSessionStats);

// Deactivate all other sessions (except current)
router.delete('/all', deactivateAllOtherSessions);

// Deactivate specific session
router.delete('/:sessionId', deactivateSession);

module.exports = router; 