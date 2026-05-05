const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getLeaderboard, getHallOfFame } = require('../controllers/leaderboardController');
const { getStudentStories } = require('../controllers/studentStoryController');

// Public hall-of-fame endpoint (no auth required)
router.get('/hall-of-fame', getHallOfFame);
router.get('/stories', getStudentStories);

// Authenticated leaderboard — accessible by student, teacher, parent
router.get('/', protect, authorize('student', 'teacher', 'parent'), getLeaderboard);

module.exports = router;
