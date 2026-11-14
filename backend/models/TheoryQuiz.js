const mongoose = require('mongoose');

const { Mixed } = mongoose.Schema.Types;

// A published (or draft) theory quiz: a snapshot of its questions plus how and to whom it is given.
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
  // online = students answer in the portal and it is auto-marked; paper = printed / iPad, the teacher keys marks in
  mode: { type: String, enum: ['online', 'paper'], default: 'online' },
  items: { type: [Mixed], default: [] },
  totalMarks: { type: Number, default: 0 },
  scope: { type: Mixed, default: {} }, // { phases, chapters, topics, blueprint } as chosen in the generator
  settings: {
    durationMin: { type: Number, default: 30, min: 1 },
    opensAt: Date,
    closesAt: Date,
    shuffleQuestions: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
    warnOnLeave: { type: Boolean, default: true },
    blockPaste: { type: Boolean, default: true },
    pledge: { type: Boolean, default: true },
    passMark: { type: Number, default: 50 }
  },
  audience: {
    all: { type: Boolean, default: true },
    groups: { type: [String], default: [] },
    students: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  publishedAt: Date
}, { timestamps: true, minimize: false });

schema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('TheoryQuiz', schema);
