const express = require('express');
const { protect, teacherOnly, assistantOnly } = require('../middleware/auth');
const assistants = require('../controllers/assistantController');

/** Teacher-only management of assistant accounts. Mounted at /api/teacher/assistants. */
const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', assistants.list);
teacherRouter.post('/', assistants.create);
teacherRouter.get('/audit', assistants.audit);
teacherRouter.put('/:id', assistants.update);
teacherRouter.post('/:id/reset-password', assistants.resetPassword);
teacherRouter.delete('/:id', assistants.remove);

/** The assistant's own account. Mounted at /api/assistant. */
const selfRouter = express.Router();
selfRouter.use(protect, assistantOnly);
selfRouter.get('/me', assistants.me);

module.exports = { teacherRouter, selfRouter };
