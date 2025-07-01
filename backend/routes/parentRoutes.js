const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardData,
  getChildProgress,
  getChildReports
} = require('../controllers/parentController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('parent'));

// Dashboard routes
router.get('/dashboard', getDashboardData);

// Child progress routes
router.get('/child/:childId/progress', getChildProgress);

// Child reports routes
router.get('/child/:childId/reports', getChildReports);

// Placeholder routes for parent portal
router.get('/children', (req, res) => {
  res.json({
    status: 'success',
    message: 'Children overview - Coming soon!'
  });
});

router.get('/children/:childId/progress', (req, res) => {
  res.json({
    status: 'success',
    message: 'Child progress - Coming soon!'
  });
});

router.get('/children/:childId/attendance', (req, res) => {
  res.json({
    status: 'success',
    message: 'Child attendance - Coming soon!'
  });
});

router.get('/fees', (req, res) => {
  res.json({
    status: 'success',
    message: 'Fee management - Coming soon!'
  });
});

module.exports = router; 