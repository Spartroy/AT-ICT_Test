const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  children: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'Student',
      required: true
    },
    relationship: {
      type: String,
      enum: ['mother', 'father', 'guardian'],
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  alternativeNumber: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  notificationPreferences: {
    email: {
      grades: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      fees: { type: Boolean, default: true }
    },
    sms: {
      grades: { type: Boolean, default: false },
      attendance: { type: Boolean, default: true },
      assignments: { type: Boolean, default: false },
      announcements: { type: Boolean, default: false },
      fees: { type: Boolean, default: true }
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
parentSchema.index({ user: 1 });
parentSchema.index({ 'children.student': 1 });
parentSchema.index({ contactNumber: 1 });

// Method to add a child
parentSchema.methods.addChild = function(studentId, relationship, isPrimary = false) {
  // Check if child already exists
  const existingChild = this.children.find(
    child => child.student.toString() === studentId.toString()
  );
  
  if (existingChild) {
    throw new Error('Child already linked to this parent');
  }
  
  // If this is set as primary, make sure no other child is primary
  if (isPrimary) {
    this.children.forEach(child => {
      child.isPrimary = false;
    });
  }
  
  this.children.push({
    student: studentId,
    relationship,
    isPrimary
  });
  
  return this.save();
};

// Method to remove a child
parentSchema.methods.removeChild = function(studentId) {
  this.children = this.children.filter(
    child => child.student.toString() !== studentId.toString()
  );
  return this.save();
};

// Method to get primary child
parentSchema.methods.getPrimaryChild = function() {
  return this.children.find(child => child.isPrimary);
};

// Method to update notification preferences
parentSchema.methods.updateNotificationPreferences = function(preferences) {
  this.notificationPreferences = {
    ...this.notificationPreferences,
    ...preferences
  };
  return this.save();
};

// Static method to find parent by child
parentSchema.statics.findByChild = async function(studentId) {
  return await this.findOne({
    'children.student': studentId
  }).populate('user', 'firstName lastName email')
    .populate('children.student');
};

// Static method to get parents for multiple children
parentSchema.statics.findByChildren = async function(studentIds) {
  return await this.find({
    'children.student': { $in: studentIds }
  }).populate('user', 'firstName lastName email')
    .populate('children.student');
};

// Virtual for number of children
parentSchema.virtual('numberOfChildren').get(function() {
  return this.children.length;
});

module.exports = mongoose.model('Parent', parentSchema); 