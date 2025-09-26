const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  registration: {
    type: mongoose.Schema.ObjectId,
    ref: 'Registration',
    required: true
  },
  year: {
    type: String,
    required: true,
    enum: ['10', '11', '12']
  },
  nationality: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  session: {
    type: String,
    required: true,
    enum: ['NOV 25', 'JUN 26']
  },
  isRetaker: {
    type: Boolean,
    default: false
  },
  contactNumber: {
    type: String,
    required: true
  },
  parentNumber: {
    type: String,
    required: true
  },
  techKnowledge: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  otherSubjects: {
    type: String
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Parent'
  },
  // Academic Progress
  currentGrade: {
    type: String,
    enum: ['F', 'E', 'D', 'C', 'B', 'A', 'A*'],
    default: null
  },
  targetGrade: {
    type: String,
    enum: ['F', 'E', 'D', 'C', 'B', 'A', 'A*'],
    default: 'A*'
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Fees
  totalFees: {
    type: Number,
    required: true,
    default: 0
  },
  paidFees: {
    type: Number,
    default: 0
  },
  pendingFees: {
    type: Number,
    default: 0
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'overdue'],
    default: 'pending'
  },
  // Performance Metrics
  assignmentsCompleted: {
    type: Number,
    default: 0
  },
  assignmentsTotal: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
studentSchema.index({ user: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ session: 1, year: 1 });
studentSchema.index({ isActive: 1 });

// Calculate pending fees before saving
studentSchema.pre('save', function(next) {
  this.pendingFees = this.totalFees - this.paidFees;
  
  // Update fee status
  if (this.paidFees >= this.totalFees) {
    this.feeStatus = 'paid';
  } else if (this.paidFees > 0) {
    this.feeStatus = 'partial';
  } else {
    this.feeStatus = 'pending';
  }
  
  
  next();
});

// Virtual for completion rate
studentSchema.virtual('completionRate').get(function() {
  if (this.assignmentsTotal === 0) return 0;
  return Math.round((this.assignmentsCompleted / this.assignmentsTotal) * 100);
});

// Virtual for performance status
studentSchema.virtual('performanceStatus').get(function() {
  if (this.averageScore >= 80) return 'excellent';
  if (this.averageScore >= 60) return 'good';
  if (this.averageScore >= 40) return 'average';
  return 'needs_improvement';
});


module.exports = mongoose.model('Student', studentSchema); 