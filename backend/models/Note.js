const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  phase: {
    type: Number,
    required: true,
    min: [1, 'Phase must be between 1 and 3'],
    max: [3, 'Phase must be between 1 and 3']
  },
  // Chapter number (e.g. 6 for "CH 6 Networks"). Optional: older notes only carry it in the title.
  chapter: {
    type: Number,
    min: [1, 'Chapter must be a positive number']
  },
  // Prezi link. Optional so a chapter can be listed before its notes are ready ("No link yet").
  linkUrl: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

noteSchema.index({ phase: 1, order: 1, isActive: 1 });

module.exports = mongoose.model('Note', noteSchema);


