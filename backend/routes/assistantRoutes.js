const express = require('express');
const { protect, teacherOnly, assistantOnly } = require('../middleware/auth');
const assistants = require('../controllers/assistantController');
const tasks = require('../controllers/assistantTaskController');

/** Teacher-only management of assistant accounts. Mounted at /api/teacher/assistants. */
const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', assistants.list);
teacherRouter.post('/', assistants.create);
teacherRouter.get('/audit', assistants.audit);
teacherRouter.get('/tasks', tasks.listTasks);
teacherRouter.post('/tasks', tasks.createTask);
teacherRouter.put('/tasks/:taskId', tasks.updateTask);
teacherRouter.delete('/tasks/:taskId', tasks.deleteTask);
teacherRouter.put('/:id', assistants.update);
teacherRouter.post('/:id/reset-password', assistants.resetPassword);
teacherRouter.delete('/:id', assistants.remove);

/** The assistant's own account. Mounted at /api/assistant. */
const selfRouter = express.Router();
selfRouter.use(protect, assistantOnly);
selfRouter.get('/me', assistants.me);
selfRouter.get('/tasks', tasks.myTasks);
selfRouter.put('/tasks/:taskId/done', tasks.markDone);
selfRouter.get('/activity', tasks.myActivity);

module.exports = { teacherRouter, selfRouter };
