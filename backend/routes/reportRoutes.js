const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const reports = require('../controllers/reportController');

// Mounted at /api/teacher/reports (teachers, and assistants allowed to grade submissions)
const router = express.Router();
router.use(protect, teacherOnly);
router.get('/', reports.roster);
router.post('/autofill', reports.autofill);
router.post('/publish', reports.publish);
router.get('/:studentId', reports.detail);
router.put('/:studentId', reports.save);

module.exports = router;
