const mongoose = require('mongoose');

/**
 * A student the teacher removed, kept so the account can be brought back.
 * `snapshot` holds the raw records exactly as they were (user, work entries, messages, parent links),
 * so restoring puts back the same _id, password hash and history.
 */
const deletedStudentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.ObjectId, ref: 'User', index: true },
  originalId: { type: mongoose.Schema.ObjectId, required: true, index: true },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  studentId: { type: String, default: '' },
  year: { type: Number },
  session: { type: String, default: '' },
  deletedAt: { type: Date, default: Date.now, index: true },
  snapshot: {
    user: { type: mongoose.Schema.Types.Mixed, required: true },
    assignments: { type: [mongoose.Schema.Types.Mixed], default: [] }, // { id, entry }
    quizzes: { type: [mongoose.Schema.Types.Mixed], default: [] },     // { id, entry }
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    parentLinks: { type: [mongoose.Schema.Types.Mixed], default: [] }  // { parentId, link }
  }
}, { minimize: false });

module.exports = mongoose.model('DeletedStudent', deletedStudentSchema);
