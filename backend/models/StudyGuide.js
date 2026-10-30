const mongoose = require('mongoose');

// The revision study guide shown in the student Labs tab. A single document keyed 'main'.
// `published` is what students read; `draft` is the teacher's work in progress.
// When `published` is empty students see the guide that ships with the app (data/studyGuideDefault.json).

const studyGuideSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'main',
    unique: true,
    immutable: true
  },
  published: { type: mongoose.Schema.Types.Mixed, default: null },
  publishedAt: { type: Date, default: null },
  publishedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  draft: { type: mongoose.Schema.Types.Mixed, default: null },
  draftSavedAt: { type: Date, default: null }
}, { timestamps: true, minimize: false });

studyGuideSchema.statics.getMain = function getMain() {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { new: true, upsert: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('StudyGuide', studyGuideSchema);
