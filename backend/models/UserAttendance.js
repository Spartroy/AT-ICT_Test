const mongoose = require('mongoose');

// Embed a strict sub-schema for session details to avoid cast issues
const sessionSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, default: 'theory' },
    topic: { type: String, default: '' }
  },
  { _id: false }
);

const userAttendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    session: { type: sessionSchema, required: true },
    status: { type: String, enum: ['present'], default: 'present' },
    markedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

userAttendanceSchema.index(
  { user: 1, date: 1, 'session.day': 1, 'session.startTime': 1, 'session.endTime': 1 },
  { unique: true }
);

module.exports = mongoose.model('UserAttendance', userAttendanceSchema);

