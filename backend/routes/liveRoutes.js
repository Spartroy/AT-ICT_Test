const express = require('express');
const live = require('../controllers/liveController');
const { protect, teacherOnly, studentOnly } = require('../middleware/auth');

// Mounted at /api/live (students) and /api/teacher/live (teacher)
const studentRouter = express.Router();
studentRouter.use(protect, studentOnly);
studentRouter.get('/current', live.current);
studentRouter.post('/:id/join', live.join);

const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', live.teacherList);
teacherRouter.post('/', live.create);
teacherRouter.put('/:id', live.update);
teacherRouter.post('/:id/start', live.start);
teacherRouter.post('/:id/end', live.end);
teacherRouter.delete('/:id', live.remove);
teacherRouter.get('/:id/attendance', live.attendance);

module.exports = { studentRouter, teacherRouter };
