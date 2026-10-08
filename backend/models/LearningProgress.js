const mongoose = require('mongoose');

// One row per item a student has finished: a video lesson watched or a notes chapter read.
// Powers the Learn maps (current node = first unfinished item) and the notes orbit read-state.
const learningProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  kind: {
    type: String,
    enum: ['video', 'note'],
    required: true
  },
  item: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

learningProgressSchema.index({ student: 1, kind: 1, item: 1 }, { unique: true });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
