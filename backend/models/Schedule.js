const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Schedule title is required'],
    default: 'Class Schedule'
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    sessions: [{
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['theory', 'practical', 'revision', 'quiz'],
        required: true,
        default: 'theory'
      },
      topic: {
        type: String,
        required: true,
        trim: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  // New fields for student classification
  targetStudentGroups: {
    type: [{
      groupType: {
        type: String,
        enum: ['9H', '9J', 'custom'],
        required: true
      },
      groupName: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      }
    }],
    default: []
  },
  assignedStudents: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  // Schedule metadata
  scheduleType: {
    type: String,
    enum: ['main', 'special', 'remedial', 'advanced'],
    default: 'main'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
scheduleSchema.index({ createdBy: 1 });
scheduleSchema.index({ isActive: 1 });

// Static method to get the main schedule
scheduleSchema.statics.getMainSchedule = async function() {
  let schedule = await this.findOne({ isActive: true })
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName');
  
  return schedule;
};

// Static method to get all schedules
scheduleSchema.statics.getAllSchedules = async function() {
  return await this.find({ isActive: true })
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName')
    .populate('assignedStudents.student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get schedules by student group
scheduleSchema.statics.getSchedulesByGroup = async function(groupType) {
  return await this.find({ 
    isActive: true,
    'targetStudentGroups.groupType': groupType 
  })
    .populate('createdBy', 'firstName lastName')
    .populate('assignedStudents.student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get students by classification
scheduleSchema.statics.getStudentsByClassification = async function() {
  const User = require('./User');
  
  const students = await User.find({
    role: 'student',
    registrationStatus: 'approved',
    isActive: true
  }).select('firstName lastName email studentInfo');

  const classified = {
    '9H': students.filter(s => s.studentInfo?.royalClass === '9H'),
    '9J': students.filter(s => s.studentInfo?.royalClass === '9J'),
    'custom': students.filter(s => s.studentInfo?.schoolType === 'center'),
    'unclassified': students.filter(s => !s.studentInfo?.schoolType || !s.studentInfo?.royalClass)
  };

  return classified;
};

// Method to get today's schedule
scheduleSchema.methods.getTodaySchedule = function() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = this.schedule.find(s => s.day === today);
  return todaySchedule ? todaySchedule.sessions.filter(session => session.isActive) : [];
};

// Method to get upcoming sessions (next 3 days)
scheduleSchema.methods.getUpcomingSessions = function() {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const upcoming = [];
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayName = days[date.getDay()];
    
    const daySchedule = this.schedule.find(s => s.day === dayName);
    if (daySchedule) {
      daySchedule.sessions.filter(session => session.isActive).forEach(session => {
        upcoming.push({
          ...session.toObject(),
          date: date.toISOString().split('T')[0],
          dayName: dayName
        });
      });
    }
  }
  
  return upcoming;
};

// Method to initialize empty week schedule
scheduleSchema.statics.initializeWeekSchedule = function() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map(day => ({
    day,
    sessions: []
  }));
};

module.exports = mongoose.model('Schedule', scheduleSchema); 