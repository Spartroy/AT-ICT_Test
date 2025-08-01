const express = require('express');
const router = express.Router();
const { protect, teacherOnly } = require('../middleware/auth');
const {
  getRecentActivities,
  markActivitiesAsRead,
  createActivity
} = require('../controllers/activityController');

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

// Get recent activities
router.get('/', getRecentActivities);

// Mark activities as read
router.put('/mark-read', markActivitiesAsRead);

// Create activity (internal use)
router.post('/', createActivity);

module.exports = router; 