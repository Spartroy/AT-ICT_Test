const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getLeaderboard, getHallOfFame } = require('../controllers/leaderboardController');

// Public hall-of-fame endpoint (no auth required)
router.get('/hall-of-fame', getHallOfFame);

// Authenticated leaderboard — accessible by student, teacher, parent
router.get('/', protect, authorize('student', 'teacher', 'parent'), getLeaderboard);

module.exports = router;
