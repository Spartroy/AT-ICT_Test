const mongoose = require('mongoose');

// One variant of one past paper: e.g. Paper 2, 2024, June, V1 with its question paper, source files and mark scheme links.
// Paper 1 is theory (QP + MS); papers 2 and 3 are practical (QP + SRC + MS).
const pastPaperSchema = new mongoose.Schema({
  paper: { type: Number, enum: [1, 2, 3], required: true },
  year: { type: Number, min: 2018, max: 2026, required: true },
  session: { type: String, enum: ['jun', 'nov'], required: true },
  variant: { type: Number, min: 1, max: 9, required: true },
  qp: { type: String, default: '' },
  src: { type: String, default: '' },
  ms: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, { timestamps: true });

pastPaperSchema.index({ paper: 1, year: -1, session: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model('PastPaper', pastPaperSchema);
