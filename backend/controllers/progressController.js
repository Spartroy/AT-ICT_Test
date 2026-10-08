const mongoose = require('mongoose');
const LearningProgress = require('../models/LearningProgress');
const Video = require('../models/Video');
const Note = require('../models/Note');

const MODELS = { video: Video, note: Note };

// @desc    Ids of the videos and notes the student has completed
// @route   GET /api/student/progress
// @access  Private (Student)
const getProgress = async (req, res) => {
  try {
    const rows = await LearningProgress.find({ student: req.user.id }).select('kind item').lean();
    res.status(200).json({
      status: 'success',
      data: {
        videos: rows.filter(r => r.kind === 'video').map(r => String(r.item)),
        notes: rows.filter(r => r.kind === 'note').map(r => String(r.item))
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving progress' });
  }
};

// @desc    Mark a video watched / a note read (done: true) or undo it (done: false)
// @route   PUT /api/student/progress/:kind/:itemId
// @access  Private (Student)
const setProgress = async (req, res) => {
  try {
    const { kind, itemId } = req.params;
    const done = req.body?.done !== false;
    const Model = MODELS[kind];
    if (!Model) {
      return res.status(400).json({ status: 'error', message: 'Kind must be video or note' });
    }
    if (!mongoose.isValidObjectId(itemId) || !(await Model.exists({ _id: itemId, isActive: true }))) {
      return res.status(404).json({ status: 'error', message: `${kind === 'video' ? 'Video' : 'Note'} not found` });
    }

    const key = { student: req.user.id, kind, item: itemId };
    if (done) {
      await LearningProgress.updateOne(key, { $setOnInsert: { ...key, completedAt: new Date() } }, { upsert: true });
    } else {
      await LearningProgress.deleteOne(key);
    }
    res.status(200).json({ status: 'success', data: { kind, item: itemId, done } });
  } catch (error) {
    console.error('Set progress error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving progress' });
  }
};

module.exports = { getProgress, setProgress };
