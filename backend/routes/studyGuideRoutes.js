const express = require('express');
const { getGuide, getEditable, saveDraft, discardDraft, publish, resetToOriginal } = require('../controllers/studyGuideController');
const { protect, teacherOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Everyone signed in reads the published guide.
router.get('/', getGuide);

// Only the teacher edits it.
router.get('/edit', teacherOnly, getEditable);
router.put('/draft', teacherOnly, saveDraft);
router.delete('/draft', teacherOnly, discardDraft);
router.post('/publish', teacherOnly, publish);
router.post('/reset', teacherOnly, resetToOriginal);

module.exports = router;
