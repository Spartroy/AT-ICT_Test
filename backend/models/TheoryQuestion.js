const mongoose = require('mongoose');

const { Mixed } = mongoose.Schema.Types;

// One question of the theory quiz bank. The Classified ones are seeded from data/theoryBank.json
// (source 'classified'); the teacher can edit, hide, retag them and add their own (source 'teacher').
const schema = new mongoose.Schema({
  srcId: { type: String, index: true, sparse: true },
  source: { type: String, enum: ['classified', 'teacher'], default: 'classified' },
  chapter: { type: Number, required: true },
  chapterKey: { type: String, required: true, index: true }, // '1'…'13', with '6a' / '6b' for the two network parts
  chapterTitle: String,
  qNo: String,
  topic: { type: String, default: '', index: true },
  type: { type: String, enum: ['tf', 'tick', 'fill', 'pick', 'match', 'written', 'multi'], required: true },
  command: { type: String, default: 'state' },
  category: { type: String, index: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
  marks: { type: Number, required: true, min: 1 },
  lead: { type: String, default: '', trim: true },
  context: { type: String, default: '' },
  items: { type: Mixed, default: undefined },
  parts: { type: Mixed, default: undefined },
  columns: { type: [String], default: undefined },
  options: { type: [String], default: undefined },
  n: Number,
  answers: { type: [String], default: undefined },
  terms: { type: [String], default: undefined },
  wordbank: { type: [String], default: undefined },
  model: { type: String, default: '' },
  points: { type: [String], default: [] },
  tip: { type: String, default: '' },
  // Questions that point at a picture/scenario that is not in the text stay out of generated quizzes until one is attached.
  needsContext: { type: Boolean, default: false },
  contextNote: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  dupOf: { type: String, default: null },
  hidden: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, { timestamps: true, minimize: false });

schema.index({ chapterKey: 1, topic: 1, category: 1 });

module.exports = mongoose.model('TheoryQuestion', schema);
