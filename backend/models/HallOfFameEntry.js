const mongoose = require('mongoose');

const hallOfFameEntrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [120, 'Student name cannot exceed 120 characters']
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      trim: true,
      maxlength: [20, 'Year cannot exceed 20 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

hallOfFameEntrySchema.index({ createdAt: -1 });

module.exports = mongoose.model('HallOfFameEntry', hallOfFameEntrySchema);
