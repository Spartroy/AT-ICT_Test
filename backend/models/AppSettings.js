const mongoose = require('mongoose');

// Teacher-editable configuration. A single document keyed 'global'.
// Exam sessions and Royal College classes live here instead of schema enums,
// so the teacher can change them from the portal without a deploy.

const examSessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Session code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Session code cannot be more than 20 characters']
  },
  label: {
    type: String,
    required: [true, 'Session label is required'],
    trim: true,
    maxlength: [60, 'Session label cannot be more than 60 characters']
  },
  // Open sessions are offered on the registration form. Closed sessions stay
  // valid for existing students and in teacher filters.
  open: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const appSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true,
    immutable: true
  },
  examSessions: {
    type: [examSessionSchema],
    validate: {
      validator: (list) => new Set(list.map(s => s.code)).size === list.length,
      message: 'Session codes must be unique'
    }
  },
  royalClasses: {
    type: [{ type: String, trim: true, uppercase: true, maxlength: 20 }],
    validate: {
      validator: (list) => new Set(list).size === list.length,
      message: 'Royal classes must be unique'
    }
  },
  // Set once the preset Hall of Fame names have been inserted (so deleting them sticks).
  hofSeeded: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

appSettingsSchema.statics.DEFAULTS = Object.freeze({
  examSessions: [
    { code: 'JUN 27', label: 'June 2027', open: true },
    { code: 'NOV 27', label: 'November 2027', open: true },
    // Legacy sessions: existing students keep these values.
    { code: 'NOV 25', label: 'November 2025', open: false },
    { code: 'JUN 26', label: 'June 2026', open: false }
  ],
  royalClasses: ['9H', '9J']
});

// Returns the settings document, creating it with defaults on first use.
appSettingsSchema.statics.getGlobal = async function() {
  return this.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', ...this.DEFAULTS } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
