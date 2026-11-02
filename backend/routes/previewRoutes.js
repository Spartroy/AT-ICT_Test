const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const { previewMaterials, previewMaterialFile, previewVideos, previewNotes } = require('../controllers/previewController');

// Teacher "preview as student": read-only, GET only. Nothing here records progress, points or views.
const router = express.Router();

router.use(protect, teacherOnly);

router.get('/materials', previewMaterials);
router.get('/materials/:id/download', previewMaterialFile);
router.get('/videos', previewVideos);
router.get('/notes', previewNotes);

module.exports = router;
