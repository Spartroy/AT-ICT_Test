const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['theory', 'practical'],
    required: true
  },
  section: {
    type: String,
    enum: ['theory', 'practical'],
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    // Will be calculated automatically from startTime + duration
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Quiz duration is required'],
    min: 1
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  instructions: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['video', 'document', 'link', 'image']
    }
  }],
  assignedTo: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'graded', 'late'],
      default: 'assigned'
    },
    startTime: Date,
    submissionDate: Date,
    submission: {
      text: String,
      attachments: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String
      }]
    },
    score: {
      type: Number,
      min: 0
    },
    feedback: String,
    gradedDate: Date,
    isLate: {
      type: Boolean,
      default: false
    },
    timeSpent: Number // in minutes
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
quizSchema.index({ 'assignedTo.student': 1 });
quizSchema.index({ startDate: 1 });
quizSchema.index({ type: 1, section: 1 });
quizSchema.index({ createdBy: 1 });

// Virtual for quiz availability status
quizSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toISOString().split('T')[0]}T${this.startTime}`);
  const endDateTime = new Date(`${this.startDate.toISOString().split('T')[0]}T${this.endTime}`);
  return now >= startDateTime && now <= endDateTime;
});

// Virtual for time until start
quizSchema.virtual('timeUntilStart').get(function() {
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toISOString().split('T')[0]}T${this.startTime}`);
  return Math.max(0, startDateTime - now);
});

// Virtual for time remaining
quizSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const endDateTime = new Date(`${this.startDate.toISOString().split('T')[0]}T${this.endTime}`);
  return Math.max(0, endDateTime - now);
});

// Calculate completion statistics
quizSchema.methods.getCompletionStats = function() {
  const total = this.assignedTo.length;
  const submitted = this.assignedTo.filter(a => a.status === 'submitted' || a.status === 'graded').length;
  const graded = this.assignedTo.filter(a => a.status === 'graded').length;
  const late = this.assignedTo.filter(a => a.isLate).length;
  
  return {
    total,
    submitted,
    graded,
    late,
    pending: total - submitted,
    submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    gradingRate: total > 0 ? Math.round((graded / total) * 100) : 0
  };
};

// Get average score
quizSchema.methods.getAverageScore = function() {
  const gradedQuizzes = this.assignedTo.filter(a => a.status === 'graded' && a.score !== undefined);
  if (gradedQuizzes.length === 0) return 0;
  
  const totalScore = gradedQuizzes.reduce((sum, a) => sum + a.score, 0);
  return Math.round((totalScore / gradedQuizzes.length) * 100) / 100;
};

// Get student's quiz attempt
quizSchema.methods.getStudentAttempt = function(studentId) {
  return this.assignedTo.find(a => a.student.toString() === studentId.toString());
};

module.exports = mongoose.model('Quiz', quizSchema); 