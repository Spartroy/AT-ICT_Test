const mongoose = require('mongoose');

/**
 * A reusable message the teacher (or an assistant with parent-number access) sends to parents.
 * The body may contain {parent}, {student}, {group} and {teacher}, filled in per student when it is used.
 */
const messageTemplateSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  body: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
