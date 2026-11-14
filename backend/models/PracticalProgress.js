const mongoose = require('mongoose');

// A student's progress on the practical skill tree: the practical guides they finished and the skills they ticked
// off in the skill checker. Ids come from the client's catalogue (e.g. "word-cg1", "word.font.bold").
const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
  guides: { type: [String], default: [] },
  skills: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('PracticalProgress', schema);
