const mongoose = require('mongoose');

/**
 * One student's weekly performance report (the paper "Weekly Performance Report"): per-lesson homework and quiz
 * marks, communication ratings and a comment. Homework and quiz rows are pre-filled from the site's own
 * assignments and quizzes (see controllers/reportController.js) and can be corrected by hand before publishing.
 */
const markSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 200, default: '' },
  refId: { type: mongoose.Schema.ObjectId },              // Assignment / Quiz it came from (null when typed by hand)
  state: { type: String, enum: ['none', 'done', 'late', 'missed'], default: 'none' }, // none = nothing set for this lesson
  mark: { type: Number, min: 0, default: null },
  max: { type: Number, min: 0, default: null }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  number: { type: Number, required: true, min: 1 },
  hw: { type: markSchema, default: () => ({}) },
  quiz: { type: markSchema, default: () => ({}) },
  contribution: { type: Number, min: 0, max: 5, default: 0 } // session contribution, 0 = not rated
}, { _id: false });

const weeklyReportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, required: true },               // Monday 00:00 UTC of the week
  weekNumber: { type: Number, required: true, min: 1 },
  session: { type: String, trim: true, maxlength: 40, default: '' },
  lessons: { type: [lessonSchema], default: [] },
  attitude: {
    type: [new mongoose.Schema({
      label: { type: String, trim: true, maxlength: 60, required: true },
      rating: { type: Number, min: 0, max: 5, default: 0 }
    }, { _id: false })],
    default: []
  },
  comments: { type: String, trim: true, maxlength: 1500, default: '' },
  // Stored so lists and history can show the week without re-adding every row
  gained: { type: Number, default: 0 },
  possible: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, { timestamps: true });

weeklyReportSchema.index({ student: 1, weekStart: 1 }, { unique: true });
weeklyReportSchema.index({ weekStart: 1, status: 1 });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
