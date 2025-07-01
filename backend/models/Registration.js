const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['10', '11', '12']
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  school: {
    type: String,
    required: [true, 'School is required'],
    trim: true
  },
  session: {
    type: String,
    required: [true, 'Session is required'],
    enum: ['NOV 25', 'JUN 26']
  },
  isRetaker: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  parentNumber: {
    type: String,
    required: [true, 'Parent number is required'],
    trim: true
  },
  techKnowledge: {
    type: Number,
    required: [true, 'Tech knowledge level is required'],
    min: 1,
    max: 10
  },
  otherSubjects: {
    type: String,
    trim: true,
    maxlength: [500, 'Other subjects cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  studentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Hash password before saving
registrationSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Index for efficient queries
registrationSchema.index({ status: 1, createdAt: -1 });
registrationSchema.index({ email: 1 });

// Virtual for full name
registrationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Generate unique student ID when approved
registrationSchema.methods.generateStudentId = function() {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AT${year}${month}${random}`;
};

module.exports = mongoose.model('Registration', registrationSchema); 