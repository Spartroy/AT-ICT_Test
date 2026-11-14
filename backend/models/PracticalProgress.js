const mongoose = require('mongoose');

// A student's progress on the practical skill tree:
//  - submissions: the evidence they handed in for each practical guide (a guide counts as done once it has one),
//  - skills: the skills they ticked off after submitting,
//  - guides: guides marked done before submissions existed (kept so nobody loses progress).
// Ids come from the client's catalogue (e.g. "word-cg1", "word.font.bold").
const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  guide: { type: String, required: true },
  note: { type: String, default: '', maxlength: 1000 },
  files: { type: [fileSchema], default: [] },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
  guides: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  submissions: { type: [submissionSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('PracticalProgress', schema);
