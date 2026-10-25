const mongoose = require('mongoose');

// One online class: the teacher schedules or starts it, students join through the portal (which records their entry).
const liveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  topic: { type: String, trim: true, maxlength: 200, default: '' },
  type: { type: String, enum: ['theory', 'practical', 'revision', 'quiz'], default: 'theory' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' }, // what the lesson covers, shown in the popup
  meetingUrl: { type: String, required: true, trim: true, maxlength: 600 },
  startsAt: { type: Date, required: true },
  durationMin: { type: Number, min: 10, max: 480, default: 90 },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled', index: true },
  startedAt: Date,
  endedAt: Date,
  // The timetable slot this class belongs to (copied, so it survives schedule edits)
  slot: {
    schedule: { type: mongoose.Schema.ObjectId, ref: 'Schedule' },
    scheduleTitle: String,
    day: String,
    startTime: String,
    topic: String
  },
  students: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // empty (and no groups) = every approved student
  groups: { type: [String], default: [] }, // only these teaching groups (empty = not limited by group)
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  attendance: [{
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    firstJoinedAt: { type: Date, default: Date.now },
    lastJoinedAt: { type: Date, default: Date.now },
    joins: { type: Number, default: 1 }
  }]
}, { timestamps: true });

liveSessionSchema.index({ startsAt: -1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
