const mongoose = require('mongoose');

const studentStorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [80, 'Country cannot exceed 80 characters']
    },
    text: {
      type: String,
      required: [true, 'Story text is required'],
      trim: true,
      maxlength: [2000, 'Story text cannot exceed 2000 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

studentStorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudentStory', studentStorySchema);
