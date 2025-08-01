const express = require('express');
const router = express.Router();
const { protect, teacherOnly } = require('../middleware/auth');
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoStats,
  getNextOrder,
  reorderVideos
} = require('../controllers/videoController');

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

// Get all videos with filtering and pagination
router.get('/', getAllVideos);

// Get video statistics
router.get('/stats', getVideoStats);

// Get next order number for practical videos
router.get('/next-order', getNextOrder);

// Get specific video by ID
router.get('/:id', getVideoById);

// Create new video
router.post('/', createVideo);

// Update video
router.put('/:id', updateVideo);

// Delete video
router.delete('/:id', deleteVideo);

// Bulk reorder videos
router.put('/reorder', reorderVideos);

module.exports = router; 