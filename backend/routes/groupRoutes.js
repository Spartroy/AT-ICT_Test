const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const groups = require('../controllers/groupController');

// Mounted at /api/teacher/groups
const router = express.Router();
router.use(protect, teacherOnly);
router.get('/', groups.list);
router.put('/', groups.save);
router.post('/divide', groups.divide);
router.put('/assign', groups.assign);

module.exports = router;
