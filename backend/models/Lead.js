const mongoose = require('mongoose');

// Someone who left their name and number to unlock a free sample. One document per phone number.
const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 20, unique: true },
  variant: { type: String, enum: ['A', 'B', 'none'], default: 'none' }, // the opt-in design they saw when they signed up
  visitorId: { type: String, maxlength: 64, index: true },
  samples: [{ sample: { type: mongoose.Schema.ObjectId, ref: 'SampleItem' }, title: String, at: { type: Date, default: Date.now } }],
  contacted: { type: Boolean, default: false },
  note: { type: String, maxlength: 300, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
