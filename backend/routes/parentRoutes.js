const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardData,
  getChildProgress,
  getChildReports
} = require('../controllers/parentController');
const { getParentPayments, payPayment } = require('../controllers/paymentController');

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


// Payment routes
router.get('/payments', getParentPayments);
router.put('/payments/:paymentId/pay', payPayment);

module.exports = router; 