const mongoose = require('mongoose');
const LearningProgress = require('../models/LearningProgress');
const PastPaperProgress = require('../models/PastPaperProgress');
const Video = require('../models/Video');
const Note = require('../models/Note');
const User = require('../models/User');
const { awardEffort } = require('../utils/pointsHelper');
const { RULES } = require('../utils/pointsRules');

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
    let points = 0;
    if (done) {
      await LearningProgress.updateOne(key, { $setOnInsert: { ...key, completedAt: new Date() } }, { upsert: true });
      const doc = await Model.findById(itemId).select('title').lean();
      points = await awardEffort(req.user.id, kind, { id: itemId }, `${kind === 'video' ? 'Watched' : 'Read'}: ${doc?.title || kind}`);
    } else {
      await LearningProgress.deleteOne(key);
    }
    res.status(200).json({ status: 'success', data: { kind, item: itemId, done, points } });
  } catch (error) {
    console.error('Set progress error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving progress' });
  }
};

// "paper-year-session-variant", e.g. 2-2024-jun-1
const PAPER_KEY = /^[1-3]-(20\d{2})-(jun|nov)-[1-9]$/;

// @desc    Keys of the past-paper variants the student has marked as practised
// @route   GET /api/student/pastpaper-progress
// @access  Private (Student)
const getPastPaperProgress = async (req, res) => {
  try {
    const rows = await PastPaperProgress.find({ student: req.user.id }).select('key').lean();
    res.status(200).json({ status: 'success', data: { keys: rows.map(r => r.key) } });
  } catch (error) {
    console.error('Get past paper progress error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving progress' });
  }
};

// @desc    Mark a past-paper variant as practised (done: true) or undo it (done: false)
// @route   PUT /api/student/pastpaper-progress/:key
// @access  Private (Student)
const setPastPaperProgress = async (req, res) => {
  try {
    const { key } = req.params;
    const done = req.body?.done !== false;
    if (!PAPER_KEY.test(key)) {
      return res.status(400).json({ status: 'error', message: 'Not a valid past paper' });
    }
    const row = { student: req.user.id, key };
    let points = 0;
    if (done) {
      await PastPaperProgress.updateOne(row, { $setOnInsert: { ...row, completedAt: new Date() } }, { upsert: true });
      const [paper, year, session, variant] = key.split('-');
      points = await awardEffort(req.user.id, 'pastpaper', { key }, `Past paper: Paper ${paper} ${session === 'jun' ? 'Jun' : 'Nov'} ${year} V${variant}`);
    } else {
      await PastPaperProgress.deleteOne(row);
    }
    res.status(200).json({ status: 'success', data: { key, done, points } });
  } catch (error) {
    console.error('Set past paper progress error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving progress' });
  }
};

// @desc    The points rules plus the student's own totals and recent history
// @route   GET /api/student/points
// @access  Private (Student)
const getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('studentInfo.points').lean();
    const p = user?.studentInfo?.points || {};
    const history = [...(p.history || [])]
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .slice(0, 30)
      .map(h => ({ source: h.source, title: h.title, total: h.total, bonusPoints: h.bonusPoints || 0, awardedAt: h.awardedAt }));
    res.status(200).json({
      status: 'success',
      data: { rules: RULES, total: p.total || 0, currentSession: p.currentSession || 0, sessionLabel: p.sessionLabel || '', history }
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving points' });
  }
};

module.exports = { getProgress, setProgress, getPastPaperProgress, setPastPaperProgress, getPoints, PAPER_KEY };
