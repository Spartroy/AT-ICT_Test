const express = require('express');
const { body } = require('express-validator');
const {
  createFlashcardStack,
  getFlashcardStacks,
  getFlashcardStack,
  updateFlashcardStack,
  deleteFlashcardStack,
  addCard,
  updateCard,
  removeCard,
  incrementStudyCount,
  getMyFlashcardStacks
} = require('../controllers/flashcardController');
const { protect, teacherOnly, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Flashcard stack validation
const flashcardStackValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('subject').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Subject must be between 2 and 100 characters'),
  body('category').optional().isIn(['math', 'science', 'history', 'language', 'art', 'music', 'technology', 'other']).withMessage('Invalid category'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('cards').isArray({ min: 1 }).withMessage('At least one card is required'),
  body('cards.*.front').trim().isLength({ min: 1, max: 1000 }).withMessage('Card front must be between 1 and 1000 characters'),
  body('cards.*.back').trim().isLength({ min: 1, max: 1000 }).withMessage('Card back must be between 1 and 1000 characters')
];

// Card validation
const cardValidation = [
  body('front').trim().isLength({ min: 1, max: 1000 }).withMessage('Card front must be between 1 and 1000 characters'),
  body('back').trim().isLength({ min: 1, max: 1000 }).withMessage('Card back must be between 1 and 1000 characters')
];

// Update validation (all fields optional)
const updateFlashcardStackValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('subject').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Subject must be between 2 and 100 characters'),
  body('category').optional().isIn(['math', 'science', 'history', 'language', 'art', 'music', 'technology', 'other']).withMessage('Invalid category'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('cards').optional().isArray({ min: 1 }).withMessage('At least one card is required'),
  body('cards.*.front').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Card front must be between 1 and 1000 characters'),
  body('cards.*.back').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Card back must be between 1 and 1000 characters')
];

// All routes require authentication
router.use(protect);

// Public routes (accessible to all authenticated users)
router.get('/', getFlashcardStacks);
router.get('/my-stacks', getMyFlashcardStacks);
router.get('/:id', getFlashcardStack);
router.post('/:id/study', incrementStudyCount);

// Create flashcard stack (Teachers and Students)
router.post('/', flashcardStackValidation, createFlashcardStack);

// Update routes (Owner only)
router.put('/:id', updateFlashcardStackValidation, updateFlashcardStack);

// Delete route (Teacher only)
router.delete('/:id', teacherOnly, deleteFlashcardStack);

// Card management routes (Owner only)
router.post('/:id/cards', cardValidation, addCard);
router.put('/:id/cards/:cardIndex', cardValidation, updateCard);
router.delete('/:id/cards/:cardIndex', removeCard);

module.exports = router; 