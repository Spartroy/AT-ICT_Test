const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['classified', 'task', 'pastpapers'],
    required: true
  },
  section: {
    type: String,
    enum: ['theory', 'practical'],
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
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
    }
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
assignmentSchema.index({ 'assignedTo.student': 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ type: 1, section: 1 });
assignmentSchema.index({ createdBy: 1 });

// Virtual for overdue status
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Calculate completion statistics
assignmentSchema.methods.getCompletionStats = function() {
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
assignmentSchema.methods.getAverageScore = function() {
  const gradedAssignments = this.assignedTo.filter(a => a.status === 'graded' && a.score !== undefined);
  if (gradedAssignments.length === 0) return 0;
  
  const totalScore = gradedAssignments.reduce((sum, a) => sum + a.score, 0);
  return Math.round((totalScore / gradedAssignments.length) * 100) / 100;
};

module.exports = mongoose.model('Assignment', assignmentSchema); 