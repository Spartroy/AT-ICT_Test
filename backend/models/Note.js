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
  linkUrl: {
    type: String,
    required: [true, 'Prezi link is required']
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


