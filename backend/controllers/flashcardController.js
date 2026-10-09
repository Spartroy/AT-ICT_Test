const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create new flashcard stack
// @route   POST /api/flashcards
// @access  Private (Teacher/Student)
const createFlashcardStack = async (req, res) => {
  try {
    console.log('📝 Received flashcard stack creation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      subject,
      category,
      cards,
      isPublic
    } = req.body;

    // Get user information
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Determine if this is a teacher stack
    const isTeacherStack = user.role === 'teacher';

    // Validate cards array
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one card is required'
      });
    }

    // Process cards array
    const processedCards = cards.map((card, index) => ({
      front: card.front,
      back: card.back,
      order: index
    }));

    // Create flashcard stack
    const flashcardStack = await Flashcard.create({
      title,
      description: description || '',
      subject: subject || 'General',
      category: category || 'other',
      cards: processedCards,
      createdBy: req.user.id,
      creatorName: `${user.firstName} ${user.lastName}`,
      creatorRole: user.role,
      isPublic: isPublic !== false, // Default to true
      isTeacherStack
    });

    console.log('✅ Flashcard stack created successfully:', flashcardStack._id);

    res.status(201).json({
      status: 'success',
      message: 'Flashcard stack created successfully',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error creating flashcard stack:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get all public flashcard stacks
// @route   GET /api/flashcards
// @access  Private
const getFlashcardStacks = async (req, res) => {
  try {
    const { category, subject, creator } = req.query;
    
    let query = { isPublic: true };
    
    // Apply filters
    if (category) {
      query.category = category;
    }
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (creator) {
      query.creatorRole = creator;
    }

    const flashcardStacks = await Flashcard.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ isTeacherStack: -1, createdAt: -1 });

    console.log(`✅ Retrieved ${flashcardStacks.length} flashcard stacks`);

    res.status(200).json({
      status: 'success',
      count: flashcardStacks.length,
      data: flashcardStacks
    });

  } catch (error) {
    console.error('❌ Error fetching flashcard stacks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get single flashcard stack
// @route   GET /api/flashcards/:id
// @access  Private
const getFlashcardStack = async (req, res) => {
  try {
    const flashcardStack = await Flashcard.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Check if user can access this stack
    if (!flashcardStack.isPublic && flashcardStack.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    console.log(`✅ Retrieved flashcard stack: ${flashcardStack._id}`);

    res.status(200).json({
      status: 'success',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error fetching flashcard stack:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update flashcard stack
// @route   PUT /api/flashcards/:id
// @access  Private (Owner only)
const updateFlashcardStack = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Check ownership
    if (flashcardStack.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      subject,
      category,
      cards,
      isPublic
    } = req.body;

    // Update fields
    if (title) flashcardStack.title = title;
    if (description !== undefined) flashcardStack.description = description;
    if (subject) flashcardStack.subject = subject;
    if (category) flashcardStack.category = category;
    if (isPublic !== undefined) flashcardStack.isPublic = isPublic;

    // Update cards if provided
    if (cards && Array.isArray(cards)) {
      if (cards.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one card is required'
        });
      }

      flashcardStack.cards = cards.map((card, index) => ({
        front: card.front,
        back: card.back,
        order: index
      }));
    }

    await flashcardStack.save();

    console.log(`✅ Updated flashcard stack: ${flashcardStack._id}`);

    res.status(200).json({
      status: 'success',
      message: 'Flashcard stack updated successfully',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error updating flashcard stack:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete flashcard stack
// @route   DELETE /api/flashcards/:id
// @access  Private (Teacher only)
const deleteFlashcardStack = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Only teachers can delete flashcard stacks'
      });
    }

    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Teachers can delete any stack (teacher or student stacks)
    await Flashcard.findByIdAndDelete(req.params.id);

    console.log(`✅ Teacher deleted flashcard stack: ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Flashcard stack deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting flashcard stack:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Add card to flashcard stack
// @route   POST /api/flashcards/:id/cards
// @access  Private (Owner only)
const addCard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { front, back } = req.body;

    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Check ownership
    if (flashcardStack.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    await flashcardStack.addCard(front, back);

    console.log(`✅ Added card to flashcard stack: ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Card added successfully',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error adding card:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update card in flashcard stack
// @route   PUT /api/flashcards/:id/cards/:cardIndex
// @access  Private (Owner only)
const updateCard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { front, back } = req.body;
    const cardIndex = parseInt(req.params.cardIndex);

    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Check ownership
    if (flashcardStack.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    await flashcardStack.updateCard(cardIndex, front, back);

    console.log(`✅ Updated card ${cardIndex} in flashcard stack: ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Card updated successfully',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error updating card:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Remove card from flashcard stack
// @route   DELETE /api/flashcards/:id/cards/:cardIndex
// @access  Private (Owner only)
const removeCard = async (req, res) => {
  try {
    const cardIndex = parseInt(req.params.cardIndex);

    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    // Check ownership
    if (flashcardStack.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    await flashcardStack.removeCard(cardIndex);

    console.log(`✅ Removed card ${cardIndex} from flashcard stack: ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Card removed successfully',
      data: flashcardStack
    });

  } catch (error) {
    console.error('❌ Error removing card:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Increment study count for flashcard stack
// @route   POST /api/flashcards/:id/study
// @access  Private
const incrementStudyCount = async (req, res) => {
  try {
    const flashcardStack = await Flashcard.findById(req.params.id);

    if (!flashcardStack) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard stack not found'
      });
    }

    await flashcardStack.incrementStudyCount();

    console.log(`✅ Incremented study count for flashcard stack: ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Study count updated',
      data: { studyCount: flashcardStack.studyCount }
    });

  } catch (error) {
    console.error('❌ Error incrementing study count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get user's own flashcard stacks
// @route   GET /api/flashcards/my-stacks
// @access  Private
const getMyFlashcardStacks = async (req, res) => {
  try {
    const flashcardStacks = await Flashcard.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${flashcardStacks.length} user flashcard stacks`);

    res.status(200).json({
      status: 'success',
      count: flashcardStacks.length,
      data: flashcardStacks
    });

  } catch (error) {
    console.error('❌ Error fetching user flashcard stacks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Import (or refresh) the 13 chapter revision stacks built from the study guide
// @route   POST /api/flashcards/import-chapters
// @access  Private (Teacher)
// Missing stacks are created; existing ones (same title, teacher stack) get the current cards and keep their study count.
const importChapterStacks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const stacks = require('../data/chapterFlashcards.json');
    const existing = await Flashcard.find({ isTeacherStack: true, title: { $in: stacks.map(s => s.title) } });
    const byTitle = new Map(existing.map(s => [s.title, s]));
    const sameCards = (doc, cards) => doc.cards.length === cards.length && doc.cards.every((c, i) => c.front === cards[i].front && c.back === cards[i].back);

    let created = 0;
    let updated = 0;
    for (const stack of stacks) {
      const doc = byTitle.get(stack.title);
      if (!doc) {
        await Flashcard.create({
          title: stack.title,
          description: stack.description,
          subject: stack.subject,
          category: 'technology',
          cards: stack.cards.map((c, order) => ({ front: c.front, back: c.back, order })),
          createdBy: user._id,
          creatorName: `${user.firstName} ${user.lastName}`,
          creatorRole: user.role,
          isPublic: true,
          isTeacherStack: true
        });
        created += 1;
      } else if (!sameCards(doc, stack.cards) || doc.description !== stack.description) {
        doc.cards = stack.cards.map((c, order) => ({ front: c.front, back: c.back, order }));
        doc.description = stack.description;
        await doc.save();
        updated += 1;
      }
    }

    const parts = [created && `${created} added`, updated && `${updated} updated`].filter(Boolean);
    res.status(200).json({
      status: 'success',
      message: parts.length ? `Chapter flashcards: ${parts.join(', ')}` : 'Chapter flashcards are already up to date',
      data: { created, updated, unchanged: stacks.length - created - updated, total: stacks.length }
    });
  } catch (error) {
    console.error('Import chapter flashcards error:', error);
    res.status(500).json({ status: 'error', message: 'Server error importing chapter flashcards' });
  }
};

module.exports = {
  importChapterStacks,
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
}; 