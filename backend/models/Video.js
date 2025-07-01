const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['theory', 'practical'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  phase: {
    type: Number,
    validate: {
      validator: function(value) {
        return this.type !== 'theory' || (value >= 1 && value <= 3);
      },
      message: 'Theory videos must have phase between 1 and 3'
    }
  },
  chapter: {
    type: Number,
    validate: {
      validator: function(value) {
        if (this.type !== 'theory') return true;
        if (this.phase === 1) return value >= 1 && value <= 4;
        if (this.phase === 2) return value >= 1 && value <= 3;
        if (this.phase === 3) return value >= 1 && value <= 6;
        return false;
      },
      message: 'Invalid chapter number for the specified phase'
    }
  },
  program: {
    type: String,
    enum: ['word', 'powerpoint', 'access', 'excel', 'sharepoint'],
    validate: {
      validator: function(value) {
        return this.type !== 'practical' || value;
      },
      message: 'Practical videos must specify a program'
    }
  },
  contentType: {
    type: String,
    enum: ['guide', 'task'],
    validate: {
      validator: function(value) {
        return this.type !== 'practical' || value;
      },
      message: 'Practical videos must specify content type (guide or task)'
    }
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['all', 'year10', 'year11', 'year12', 'specific'],
    default: 'all'
  },
  specificStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Student'
  }],
  watchHistory: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'Student'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    watchTime: {
      type: Number, // seconds watched
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
videoSchema.index({ type: 1, category: 1, subcategory: 1 });
videoSchema.index({ phase: 1, chapter: 1 });
videoSchema.index({ program: 1, contentType: 1 });
videoSchema.index({ isActive: 1, order: 1 });
videoSchema.index({ uploadedBy: 1 });
videoSchema.index({ 'watchHistory.student': 1 });

// Method to increment view count
videoSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to record watch history
videoSchema.methods.recordWatch = function(studentId, watchTime, completed = false) {
  const existingWatch = this.watchHistory.find(
    w => w.student.toString() === studentId.toString()
  );
  
  if (existingWatch) {
    existingWatch.watchTime = Math.max(existingWatch.watchTime, watchTime);
    existingWatch.completed = completed || existingWatch.completed;
    existingWatch.watchedAt = new Date();
  } else {
    this.watchHistory.push({
      student: studentId,
      watchTime,
      completed,
      watchedAt: new Date()
    });
  }
  
  return this.save();
};

// Static method to get theory videos by phase
videoSchema.statics.getTheoryVideosByPhase = async function(phase) {
  return await this.find({
    type: 'theory',
    phase: phase,
    isActive: true
  })
  .populate('uploadedBy', 'firstName lastName')
  .sort({ chapter: 1, order: 1 });
};

// Static method to get practical videos by program
videoSchema.statics.getPracticalVideosByProgram = async function(program, contentType = null) {
  const query = {
    type: 'practical',
    program: program,
    isActive: true
  };
  
  if (contentType) {
    query.contentType = contentType;
  }
  
  return await this.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort({ contentType: 1, order: 1 });
};

// Static method to get accessible videos for student
videoSchema.statics.getAccessibleVideos = async function(studentId, studentYear) {
  const query = {
    isActive: true,
    $or: [
      { accessLevel: 'all' },
      { accessLevel: `year${studentYear}` },
      { accessLevel: 'specific', specificStudents: studentId }
    ]
  };
  
  return await this.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort({ type: 1, phase: 1, chapter: 1, program: 1, contentType: 1, order: 1 });
};

// Get student's progress on videos
videoSchema.statics.getStudentProgress = async function(studentId) {
  const videos = await this.find({
    'watchHistory.student': studentId,
    isActive: true
  });
  
  const progress = {
    theory: {
      phase1: { total: 4, completed: 0, watched: 0 },
      phase2: { total: 3, completed: 0, watched: 0 },
      phase3: { total: 6, completed: 0, watched: 0 }
    },
    practical: {
      word: { guides: { total: 2, completed: 0, watched: 0 }, tasks: { total: 2, completed: 0, watched: 0 } },
      powerpoint: { guides: { total: 2, completed: 0, watched: 0 }, tasks: { total: 2, completed: 0, watched: 0 } },
      access: { guides: { total: 4, completed: 0, watched: 0 }, tasks: { total: 4, completed: 0, watched: 0 } },
      excel: { guides: { total: 4, completed: 0, watched: 0 }, tasks: { total: 4, completed: 0, watched: 0 } },
      sharepoint: { guides: { total: 5, completed: 0, watched: 0 }, tasks: { total: 5, completed: 0, watched: 0 } }
    }
  };
  
  videos.forEach(video => {
    const watchRecord = video.watchHistory.find(w => w.student.toString() === studentId.toString());
    if (watchRecord) {
      if (video.type === 'theory') {
        const phaseKey = `phase${video.phase}`;
        progress.theory[phaseKey].watched++;
        if (watchRecord.completed) {
          progress.theory[phaseKey].completed++;
        }
      } else if (video.type === 'practical') {
        const programKey = video.program;
        const contentKey = video.contentType === 'guide' ? 'guides' : 'tasks';
        progress.practical[programKey][contentKey].watched++;
        if (watchRecord.completed) {
          progress.practical[programKey][contentKey].completed++;
        }
      }
    }
  });
  
  return progress;
};

module.exports = mongoose.model('Video', videoSchema); 