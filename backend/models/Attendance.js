const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student',
    required: true
  },
  session: {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    subject: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['lecture', 'practical', 'tutorial', 'exam', 'workshop'],
      default: 'lecture'
    },
    duration: {
      type: Number, // in minutes
      required: true
    }
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  checkInTime: Date,
  checkOutTime: Date,
  lateMinutes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  excuse: {
    reason: String,
    document: String, // path to uploaded document
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ 'session.subject': 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ date: 1 });

// Calculate if student was late
attendanceSchema.pre('save', function(next) {
  if (this.status === 'late' && this.checkInTime) {
    // Assuming session starts at a specific time, calculate late minutes
    // This would need to be configured based on actual session start times
    const sessionStart = new Date(this.date);
    sessionStart.setHours(9, 0, 0, 0); // Default 9 AM start time
    
    if (this.checkInTime > sessionStart) {
      this.lateMinutes = Math.round((this.checkInTime - sessionStart) / (1000 * 60));
    }
  }
  next();
});

// Static method to get attendance summary for a student
attendanceSchema.statics.getStudentAttendanceSummary = async function(studentId, dateRange = {}) {
  const query = { student: studentId };
  
  if (dateRange.from || dateRange.to) {
    query.date = {};
    if (dateRange.from) query.date.$gte = new Date(dateRange.from);
    if (dateRange.to) query.date.$lte = new Date(dateRange.to);
  }
  
  const attendanceRecords = await this.find(query).sort({ date: -1 });
  
  const summary = {
    total: attendanceRecords.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
    lateTotal: 0
  };
  
  attendanceRecords.forEach(record => {
    summary[record.status]++;
    if (record.status === 'late') {
      summary.lateTotal += record.lateMinutes;
    }
  });
  
  summary.percentage = summary.total > 0 ? 
    Math.round(((summary.present + summary.late + summary.excused) / summary.total) * 100) : 0;
  
  return {
    summary,
    records: attendanceRecords
  };
};

// Static method to get attendance by subject
attendanceSchema.statics.getAttendanceBySubject = async function(studentId, subject) {
  return await this.find({
    student: studentId,
    'session.subject': subject
  }).sort({ date: -1 });
};

module.exports = mongoose.model('Attendance', attendanceSchema); 