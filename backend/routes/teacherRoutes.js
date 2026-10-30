const express = require('express');
const {
  getDashboardStats,
  getStudents,
  getStudentDetails,
  updateStudent,
  updateQuizFeedback,
  createParentAccount,
  deleteParentAccount,
  recreateParentAccount,
  deleteStudent,
  addLegacyStudent
} = require('../controllers/teacherController');
const {
  resetSessionPoints,
  addHallOfFameStudent,
  updateHallOfFameStudent,
  deleteHallOfFameStudent
} = require('../controllers/leaderboardController');
const {
  createStudentStory,
  updateStudentStory,
  deleteStudentStory
} = require('../controllers/studentStoryController');
const {
  createPayment,
  getStudentPayments,
  updatePayment,
  reviewPayment,
  deletePayment,
  resetStudentPassword,
} = require('../controllers/paymentController');
const { protect, teacherOnly } = require('../middleware/auth');
const { listSubmissions, zipSubmissions } = require('../controllers/submissionController');

// Import new route modules
const scheduleRoutes = require('./scheduleRoutes');
const materialRoutes = require('./materialRoutes');
const videoRoutes = require('./videoRoutes');
const noteRoutes = require('./noteRoutes');

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
router.delete('/students/:id', deleteStudent);
// Create parent account for a student
router.post('/students/:id/create-parent', createParentAccount);
// Delete a student's parent account, or delete it and create a fresh one
router.delete('/students/:id/parent', deleteParentAccount);
router.post('/students/:id/recreate-parent', recreateParentAccount);
// Add legacy student
router.post('/legacy-students', addLegacyStudent);

// Assignment grading route (using the new gradeAssignment function)
router.put('/assignments/:id/students/:studentId', gradeAssignment);

// Submissions inbox (all of this teacher's assignments) + zip download
router.get('/submissions', listSubmissions);
router.get('/submissions/zip', zipSubmissions);

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

// Notes management routes
router.use('/notes', noteRoutes);

// Session points reset
router.post('/reset-session-points', resetSessionPoints);
router.post('/hall-of-fame', addHallOfFameStudent);
router.put('/hall-of-fame/:id', updateHallOfFameStudent);
router.delete('/hall-of-fame/:id', deleteHallOfFameStudent);
router.post('/stories', createStudentStory);
router.put('/stories/:id', updateStudentStory);
router.delete('/stories/:id', deleteStudentStory);

// Income dashboard: money summary, payment proofs to review, manual income/expense entries, CSV export
const income = require('../controllers/incomeController');
router.get('/income/summary', income.summary);
router.get('/income/proofs', income.proofs);
router.get('/income/entries', income.listEntries);
router.post('/income/entries', income.createEntry);
router.put('/income/entries/:id', income.updateEntry);
router.delete('/income/entries/:id', income.deleteEntry);
router.get('/income/export', income.exportCsv);

// Payment management
router.get('/students/:studentId/payments', getStudentPayments);
router.post('/students/:studentId/payments', createPayment);
router.put('/payments/:paymentId', updatePayment);
router.post('/payments/:paymentId/review', reviewPayment);
router.delete('/payments/:paymentId', deletePayment);

// Force-reset student password
router.post('/students/:studentId/reset-password', resetStudentPassword);

module.exports = router; 