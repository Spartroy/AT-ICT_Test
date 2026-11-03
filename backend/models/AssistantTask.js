/**
 * @fileoverview Assistant task
 * @description A to-do the teacher leaves for assistants ("call back these parents' chats", "check Group B attendance").
 * `assignee` empty means any assistant of that teacher can pick it up and tick it off.
 */

const mongoose = require('mongoose');

const assistantTaskSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
  assignee: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  dueDate: { type: Date, default: null },
  done: { type: Boolean, default: false },
  doneBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  doneAt: { type: Date, default: null }
}, { timestamps: true });

assistantTaskSchema.index({ teacher: 1, done: 1, dueDate: 1 });

module.exports = mongoose.models.AssistantTask || mongoose.model('AssistantTask', assistantTaskSchema);
