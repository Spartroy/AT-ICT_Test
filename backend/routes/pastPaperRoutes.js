const express = require('express');
const { listPastPapers, savePastPapers, deletePastPapers } = require('../controllers/pastPaperController');
const { protect, teacherOnly } = require('../middleware/auth');

// Mounted at /api/pastpapers (any signed-in user reads) and /api/teacher/pastpapers (teacher writes)
const publicRouter = express.Router();
publicRouter.get('/', protect, listPastPapers);

const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', listPastPapers);
teacherRouter.put('/', savePastPapers);
teacherRouter.delete('/:paper/:year', deletePastPapers);

module.exports = { publicRouter, teacherRouter };
