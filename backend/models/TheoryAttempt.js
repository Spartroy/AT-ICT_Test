const mongoose = require('mongoose');

const { Mixed } = mongoose.Schema.Types;

// One student's go at a theory quiz (one attempt each). Online attempts keep the answers and the integrity events;
// paper attempts only keep the marks the teacher keyed in.
const schema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.ObjectId, ref: 'TheoryQuiz', required: true },
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['online', 'paper'], default: 'online' },
  status: { type: String, enum: ['in_progress', 'submitted', 'graded'], default: 'in_progress' },
  seed: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endsAt: Date,
  submittedAt: Date,
  autoSubmitted: { type: Boolean, default: false },
  lastSavedAt: Date,
  answers: { type: Mixed, default: {} },
  events: { type: [Mixed], default: [] },
  grades: { type: [Mixed], default: [] }, // one per quiz item: { uid, max, final, kind, rows | parts }
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  aiMarked: { type: Boolean, default: false },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  integrity: { type: Mixed, default: null },
  pledgeAt: Date
}, { timestamps: true, minimize: false });

schema.index({ quiz: 1, student: 1 }, { unique: true });
schema.index({ student: 1, status: 1 });

module.exports = mongoose.model('TheoryAttempt', schema);
