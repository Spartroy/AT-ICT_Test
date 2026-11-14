const express = require('express');
const { protect, studentOnly } = require('../middleware/auth');
const t = require('../controllers/theoryQuizTeacherController');
const s = require('../controllers/theoryQuizStudentController');

const router = express.Router();
router.use(protect);

// Teacher (and assistants with the Quizzes permission): question bank, generator, quiz library, marking
const teacher = express.Router();
teacher.use((req, res, next) => (req.user.role === 'student' || req.user.role === 'parent'
  ? res.status(403).json({ status: 'error', message: 'Not authorized to access this route' })
  : next()));
teacher.get('/meta', t.getMeta);
teacher.get('/bank', t.listBank);
teacher.post('/bank', t.createQuestion);
teacher.put('/bank/:id', t.updateQuestion);
teacher.delete('/bank/:id', t.deleteQuestion);
teacher.post('/scope', t.scopeAvailability);
teacher.post('/generate', t.generateItems);
teacher.post('/swap', t.swapItem);
teacher.post('/item', t.itemFromBank);
teacher.get('/radar', t.radar);
teacher.get('/quizzes', t.listQuizzes);
teacher.post('/quizzes', t.createQuiz);
teacher.get('/quizzes/:id', t.getQuiz);
teacher.put('/quizzes/:id', t.updateQuiz);
teacher.delete('/quizzes/:id', t.deleteQuiz);
teacher.post('/quizzes/:id/publish', t.publishQuiz);
teacher.get('/quizzes/:id/attempts', t.listAttempts);
teacher.get('/quizzes/:id/attempts/:aid', t.getAttempt);
teacher.put('/quizzes/:id/attempts/:aid/review', t.reviewAttempt);
teacher.post('/quizzes/:id/attempts/:aid/ai', t.remarkWithAi);
teacher.post('/quizzes/:id/confirm-all', t.confirmAll);
teacher.put('/quizzes/:id/paper', t.savePaperMarks);
teacher.get('/quizzes/:id/report', t.quizReport);
teacher.post('/quizzes/:id/send-parents', t.sendToParents);
router.use('/teacher', teacher);

// Students
const student = express.Router();
student.use(studentOnly);
student.get('/quizzes', s.listQuizzes);
student.post('/quizzes/:id/start', s.startQuiz);
student.put('/attempts/:id/save', s.saveProgress);
student.post('/attempts/:id/submit', s.submitQuiz);
student.get('/attempts/:id/result', s.getResult);
router.use('/student', student);

module.exports = router;
