const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  thumbnailFileName: {
    type: String,
    default: null
  },
  thumbnailSize: {
    type: Number,
    default: null
  },
  thumbnailMimeType: {
    type: String,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
materialSchema.index({ type: 1 });
materialSchema.index({ isActive: 1 });
materialSchema.index({ uploadedBy: 1 });

// Method to increment download count
materialSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static method to get materials by type
materialSchema.statics.getByType = async function(type, options = {}) {
  const query = { 
    isActive: true 
  };
  
  if (type) {
    query.type = type;
  }
  
  return await this.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get all active materials for students
materialSchema.statics.getAllActive = async function() {
  return await this.find({ isActive: true })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ type: 1, createdAt: -1 });
};

module.exports = mongoose.model('Material', materialSchema); 