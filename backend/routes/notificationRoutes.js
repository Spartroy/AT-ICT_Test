const express = require('express');
const { protect } = require('../middleware/auth');
const {
  listNotifications, markRead, getPushKey, subscribe, unsubscribe, getPreferences, updatePreferences, sendTest
} = require('../controllers/notificationController');

// Mounted at /api/notifications (signed-in users: students and the teacher)
const router = express.Router();
router.use(protect);
router.get('/', listNotifications);
router.post('/read', markRead);
router.get('/push-key', getPushKey);
router.post('/subscribe', subscribe);
router.delete('/subscribe', unsubscribe);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/test', sendTest);

module.exports = router;
