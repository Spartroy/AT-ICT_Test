const mongoose = require('mongoose');

// A free sample card on the public website. The teacher edits these (Library > Free samples).
const sampleItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  kind: { type: String, enum: ['notes', 'video', 'file'], default: 'notes' },
  url: { type: String, trim: true, maxlength: 800, default: '' }, // Prezi / YouTube / Drive / any link that can sit in an iframe
  description: { type: String, trim: true, maxlength: 400, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SampleItem', sampleItemSchema);
