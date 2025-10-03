const express = require('express');
const router = express.Router();
const { protect, teacherOnly } = require('../middleware/auth');
const { getAllNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');

// All routes require teacher authentication
router.use(protect);
router.use(teacherOnly);

router.get('/', getAllNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;


