const express = require('express');
const {
  getDashboardStats,
  getStudents,
  getStudentDetails,
  updateStudent,
  updateQuizFeedback
} = require('../controllers/teacherController');
const { protect, teacherOnly } = require('../middleware/auth');

// Import new route modules
const scheduleRoutes = require('./scheduleRoutes');
const materialRoutes = require('./materialRoutes');
const videoRoutes = require('./videoRoutes');

// Import assignment and quiz controller functions for grading
const {
  gradeAssignment
} = require('../controllers/assignmentController');

const {
  gradeQuiz
} = require('../controllers/quizController');

const router = express.Router();

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

// Dashboard and overview routes
router.get('/dashboard', getDashboardStats);

// Student management routes
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetails);
router.put('/students/:id', updateStudent);

// Assignment grading route (using the new gradeAssignment function)
router.put('/assignments/:id/students/:studentId', gradeAssignment);

// Quiz grading route
router.put('/quizzes/:id/students/:studentId', gradeQuiz);

// Quiz feedback routes
router.put('/quizzes/:quizId/students/:studentId', updateQuizFeedback);

// Schedule management routes
router.use('/schedule', scheduleRoutes);

// Materials management routes
router.use('/materials', materialRoutes);

// Video management routes
router.use('/videos', videoRoutes);

module.exports = router; 