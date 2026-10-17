const mongoose = require('mongoose');

// Funnel events for the opt-in A/B test: a sample was opened, the form was shown, dismissed or submitted.
const leadEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['open', 'prompt', 'dismiss', 'submit'], required: true },
  variant: { type: String, enum: ['A', 'B', 'none'], default: 'none' },
  visitorId: { type: String, required: true, maxlength: 64 },
  sample: { type: mongoose.Schema.ObjectId, ref: 'SampleItem' }
}, { timestamps: { createdAt: true, updatedAt: false } });

leadEventSchema.index({ variant: 1, type: 1, visitorId: 1 });
leadEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LeadEvent', leadEventSchema);
