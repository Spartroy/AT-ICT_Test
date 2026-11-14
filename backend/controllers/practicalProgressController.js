const PracticalProgress = require('../models/PracticalProgress');

const ID = /^[a-z0-9][a-z0-9._-]{1,79}$/;
const FIELD = { guide: 'guides', skill: 'skills' };
const MAX = 400;

// @route GET /api/student/practical-progress
const getPracticalProgress = async (req, res) => {
  try {
    const row = await PracticalProgress.findOne({ student: req.user.id }).lean();
    res.json({ status: 'success', data: { guides: row?.guides || [], skills: row?.skills || [] } });
  } catch (err) {
    console.error('Practical progress error:', err);
    res.status(500).json({ status: 'error', message: 'Server error loading your skill tree' });
  }
};

// @route PUT /api/student/practical-progress/:kind/:id   { done: boolean }   kind = guide | skill
const setPracticalProgress = async (req, res) => {
  try {
    const field = FIELD[req.params.kind];
    const id = String(req.params.id || '');
    if (!field || !ID.test(id)) return res.status(400).json({ status: 'error', message: 'Unknown skill or guide' });
    const done = req.body.done !== false;
    if (done) {
      const have = await PracticalProgress.findOne({ student: req.user.id }).select(field).lean();
      if ((have?.[field] || []).length >= MAX && !(have[field] || []).includes(id)) return res.status(400).json({ status: 'error', message: 'Too many items' });
    }
    const row = await PracticalProgress.findOneAndUpdate(
      { student: req.user.id },
      done ? { $addToSet: { [field]: id } } : { $pull: { [field]: id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ status: 'success', data: { guides: row.guides, skills: row.skills } });
  } catch (err) {
    console.error('Practical progress error:', err);
    res.status(500).json({ status: 'error', message: 'Server error saving your progress' });
  }
};

module.exports = { getPracticalProgress, setPracticalProgress };
