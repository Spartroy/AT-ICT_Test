const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'assignment', 'exam', 'holiday', 'deadline', 'meeting', 'important'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'parents', 'specific'],
    default: 'all'
  },
  specificTargets: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ type: 1, priority: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ scheduledFor: 1 });
announcementSchema.index({ isPinned: 1, createdAt: -1 });
announcementSchema.index({ tags: 1 });

// Update metadata before saving
announcementSchema.pre('save', function(next) {
  this.metadata.totalLikes = this.likes.length;
  this.metadata.totalComments = this.comments.length;
  next();
});

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Virtual for like count
announcementSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
announcementSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Check if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Check if announcement is scheduled
announcementSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && new Date() < this.scheduledFor;
});

// Mark as read by user
announcementSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    this.metadata.views += 1;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Add like from user
announcementSchema.methods.addLike = function(userId) {
  const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
  
  if (!alreadyLiked) {
    this.likes.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Remove like from user
announcementSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Add comment
announcementSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Get announcements for specific user based on target audience
announcementSchema.statics.getForUser = async function(userId, userRole, options = {}) {
  const limit = options.limit || 20;
  const skip = options.skip || 0;
  
  const query = {
    isPublished: true,
    scheduledFor: { $lte: new Date() },
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userRole },
      { specificTargets: userId }
    ]
  };
  
  // Exclude expired announcements unless specified
  if (!options.includeExpired) {
    query.$and = [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ];
  }
  
  return await this.find(query)
    .populate('createdBy', 'firstName lastName profileImage')
    .populate('comments.user', 'firstName lastName profileImage')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Announcement', announcementSchema); 