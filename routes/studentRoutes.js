const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Import existing student controller functions
const {
  getDashboardStats,
  getAssignments,
  getQuizzes,
  getMaterials,
  getVideos,
  submitAssignment,
  submitQuiz,
  startQuiz
} = require('../controllers/studentController');

// Import material controller functions
const {
  getMaterialsForStudent,
  downloadMaterialForStudent
} = require('../controllers/materialController');

// Import schedule controller functions
const {
  getScheduleForStudent,
  getTodayScheduleForStudent
} = require('../controllers/scheduleController');

// Import announcement controller functions
const {
  getAnnouncements
} = require('../controllers/announcementController');

// Get student dashboard
router.get('/dashboard', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getDashboardStats);

// Assignment routes
router.get('/assignments', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getAssignments);

// Assignment submission route
router.post('/assignments/:id/submit', protect, upload.array('files', 10), handleMulterError, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, submitAssignment);

// Quiz routes
router.get('/quizzes', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getQuizzes);

// Quiz start route
router.post('/quizzes/:id/start', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, startQuiz);

// Quiz submission route
router.post('/quizzes/:id/submit', protect, upload.array('files', 10), handleMulterError, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, submitQuiz);

// Materials routes
router.get('/materials', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getMaterialsForStudent);

router.get('/materials/:id/download', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, downloadMaterialForStudent);

// Videos route
router.get('/videos', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getVideos);

// Announcements routes
router.get('/announcements', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getAnnouncements);

// Schedule routes
router.get('/schedule', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getScheduleForStudent);

router.get('/schedule/today', protect, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
}, getTodayScheduleForStudent);

module.exports = router; 