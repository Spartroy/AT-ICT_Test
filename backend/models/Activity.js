const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['registration', 'assignment_submission', 'quiz_submission', 'message', 'payment', 'attendance', 'grade_update'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  relatedItem: {
    type: mongoose.Schema.ObjectId,
    refPath: 'relatedItemModel',
    required: false
  },
  relatedItemModel: {
    type: String,
    enum: ['Assignment', 'Quiz', 'Message', 'Registration'],
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ student: 1, createdAt: -1 });
activitySchema.index({ isRead: 1, createdAt: -1 });

// Static method to create activity
activitySchema.statics.createActivity = async function(data) {
  const activity = new this(data);
  await activity.save();
  return activity;
};

// Static method to get recent activities for teachers
activitySchema.statics.getRecentActivities = async function(limit = 10) {
  return await this.find()
    .populate('student', 'firstName lastName email profileImage')
    .populate('relatedItem')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark activities as read
activitySchema.statics.markAsRead = async function(activityIds) {
  return await this.updateMany(
    { _id: { $in: activityIds } },
    { isRead: true }
  );
};

// Static method to get unread count
activitySchema.statics.getUnreadCount = async function() {
  return await this.countDocuments({ isRead: false });
};

module.exports = mongoose.model('Activity', activitySchema); 