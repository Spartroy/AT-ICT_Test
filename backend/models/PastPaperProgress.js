const mongoose = require('mongoose');

// One row per past-paper variant a student has marked as practised. Keyed by "paper-year-session-variant"
// (e.g. "2-2024-jun-1"), not by PastPaper id: the teacher's save replaces a year's documents, so ids don't last.
const pastPaperProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  completedAt: { type: Date, default: Date.now }
});

pastPaperProgressSchema.index({ student: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('PastPaperProgress', pastPaperProgressSchema);
