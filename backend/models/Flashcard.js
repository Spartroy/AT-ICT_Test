const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  // Stack information
  title: {
    type: String,
    required: [true, 'Flashcard stack title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot be more than 100 characters'],
    default: 'General'
  },
  category: {
    type: String,
    enum: ['math', 'science', 'history', 'language', 'art', 'music', 'technology', 'other'],
    default: 'other'
  },
  
  // Creator information
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  creatorRole: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  
  // Stack settings
  isPublic: {
    type: Boolean,
    default: true
  },
  isTeacherStack: {
    type: Boolean,
    default: false
  },
  
  // Cards array
  cards: [{
    front: {
      type: String,
      required: [true, 'Card front content is required'],
      trim: true,
      maxlength: [1000, 'Card front content cannot exceed 1000 characters']
    },
    back: {
      type: String,
      required: [true, 'Card back content is required'],
      trim: true,
      maxlength: [1000, 'Card back content cannot exceed 1000 characters']
    },
    order: {
      type: Number,
      required: true
    }
  }],
  
  // Statistics
  totalCards: {
    type: Number,
    default: 0
  },
  studyCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
flashcardSchema.index({ createdBy: 1, createdAt: -1 });
flashcardSchema.index({ isPublic: 1, isTeacherStack: 1 });
flashcardSchema.index({ subject: 1, category: 1 });

// Pre-save middleware to update totalCards
flashcardSchema.pre('save', function(next) {
  this.totalCards = this.cards.length;
  this.updatedAt = new Date();
  next();
});

// Virtual for full creator name
flashcardSchema.virtual('creatorFullName').get(function() {
  return this.creatorName;
});

// Method to add a card
flashcardSchema.methods.addCard = function(front, back) {
  const newOrder = this.cards.length;
  this.cards.push({
    front,
    back,
    order: newOrder
  });
  return this.save();
};

// Method to remove a card
flashcardSchema.methods.removeCard = function(cardIndex) {
  if (cardIndex >= 0 && cardIndex < this.cards.length) {
    this.cards.splice(cardIndex, 1);
    // Reorder remaining cards
    this.cards.forEach((card, index) => {
      card.order = index;
    });
    return this.save();
  }
  throw new Error('Invalid card index');
};

// Method to update card
flashcardSchema.methods.updateCard = function(cardIndex, front, back) {
  if (cardIndex >= 0 && cardIndex < this.cards.length) {
    this.cards[cardIndex].front = front;
    this.cards[cardIndex].back = back;
    return this.save();
  }
  throw new Error('Invalid card index');
};

// Method to increment study count
flashcardSchema.methods.incrementStudyCount = function() {
  this.studyCount += 1;
  return this.save();
};

// Static method to get all public stacks
flashcardSchema.statics.getPublicStacks = function() {
  return this.find({ isPublic: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ isTeacherStack: -1, createdAt: -1 });
};

// Static method to get teacher stacks
flashcardSchema.statics.getTeacherStacks = function() {
  return this.find({ isTeacherStack: true, isPublic: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get student stacks
flashcardSchema.statics.getStudentStacks = function() {
  return this.find({ 
    isTeacherStack: false, 
    isPublic: true 
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Flashcard', flashcardSchema); 