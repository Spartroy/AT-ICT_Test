/**
 * @fileoverview Assistant audit log
 * @description One row per write an assistant makes (or is refused) so the teacher can see who did what.
 * Request bodies are never stored, only the method and path, so no student data is copied here.
 */

const mongoose = require('mongoose');

const assistantAuditSchema = new mongoose.Schema({
  assistant: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
  teacher: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  area: { type: String, default: '' },
  level: { type: String, default: '' },
  status: { type: Number },
  allowed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 180 }
});

assistantAuditSchema.index({ teacher: 1, createdAt: -1 });

module.exports = mongoose.models.AssistantAudit || mongoose.model('AssistantAudit', assistantAuditSchema);
