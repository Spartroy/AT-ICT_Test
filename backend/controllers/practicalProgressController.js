const PracticalProgress = require('../models/PracticalProgress');

const ID = /^[a-z0-9][a-z0-9._-]{1,79}$/;
const GUIDE = /^(word|powerpoint|access|excel|sharepoint)-(cg|ht)\d{1,2}$/;
const FIELD = { guide: 'guides', skill: 'skills' };
const MAX = 400;

const urlOf = (f) => `/${String(f.path || `uploads/homework/${f.filename}`).replace(/\\/g, '/').replace(/^\/+/, '')}`;
const fileOut = (f) => ({ name: f.originalName || f.filename, size: f.size || 0, url: urlOf(f) });
const submissionOut = (s) => ({ guide: s.guide, note: s.note || '', submittedAt: s.submittedAt, updatedAt: s.updatedAt, files: (s.files || []).map(fileOut) });

/** What the tree needs: finished guides (submitted, or marked before submissions existed), ticked skills, and the submissions. */
function shape(row) {
  const submissions = (row?.submissions || []).map(submissionOut);
  const guides = [...new Set([...(row?.guides || []), ...submissions.map(s => s.guide)])];
  return { guides, skills: row?.skills || [], submissions };
}

// @route GET /api/student/practical-progress
const getPracticalProgress = async (req, res) => {
  try {
    const row = await PracticalProgress.findOne({ student: req.user.id }).lean();
    res.json({ status: 'success', data: shape(row) });
  } catch (err) {
    console.error('Practical progress error:', err);
    res.status(500).json({ status: 'error', message: 'Server error loading your skill tree' });
  }
};

// @route PUT /api/student/practical-progress/:kind/:id   { done: boolean }   kind = skill (guides now come from submissions)
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
    res.json({ status: 'success', data: shape(row) });
  } catch (err) {
    console.error('Practical progress error:', err);
    res.status(500).json({ status: 'error', message: 'Server error saving your progress' });
  }
};

// @route POST /api/student/practical-progress/submit/:guide   multipart: homework (files) + note
const submitGuide = async (req, res) => {
  try {
    const guide = String(req.params.guide || '');
    if (!GUIDE.test(guide)) return res.status(400).json({ status: 'error', message: 'Unknown practical guide' });
    const files = (req.files || []).map(f => ({ filename: f.filename, originalName: f.originalname, path: f.path, size: f.size, mimetype: f.mimetype }));
    const note = String(req.body.note || '').trim().slice(0, 1000);
    const row = (await PracticalProgress.findOne({ student: req.user.id })) || new PracticalProgress({ student: req.user.id });
    const existing = row.submissions.find(s => s.guide === guide);
    if (!files.length && !existing) return res.status(400).json({ status: 'error', message: 'Attach your evidence document or output files to submit this guide' });
    if (existing) {
      // A resubmission replaces the files when new ones are sent, otherwise only the note changes
      if (files.length) existing.files = files;
      existing.note = note;
      existing.updatedAt = new Date();
    } else {
      row.submissions.push({ guide, note, files });
    }
    await row.save();
    res.status(existing ? 200 : 201).json({ status: 'success', data: shape(row.toObject()) });
  } catch (err) {
    console.error('Practical submission error:', err);
    res.status(500).json({ status: 'error', message: 'Server error saving your submission' });
  }
};

// @route GET /api/teacher/practical-submissions?guide=&app=&limit=
const listPracticalSubmissions = async (req, res) => {
  try {
    const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 150));
    const rows = await PracticalProgress.find({ 'submissions.0': { $exists: true } }).populate('student', 'firstName lastName studentInfo.group').lean();
    const out = [];
    rows.forEach(r => {
      if (!r.student) return;
      (r.submissions || []).forEach(s => {
        if (req.query.guide && s.guide !== req.query.guide) return;
        if (req.query.app && !String(s.guide).startsWith(`${req.query.app}-`)) return;
        out.push({
          id: `${r._id}:${s._id}`,
          student: { _id: r.student._id, name: `${r.student.firstName || ''} ${r.student.lastName || ''}`.trim(), group: r.student.studentInfo?.group || null },
          ...submissionOut(s),
          skillsTicked: (r.skills || []).length
        });
      });
    });
    out.sort((a, b) => new Date(b.updatedAt || b.submittedAt) - new Date(a.updatedAt || a.submittedAt));
    res.json({ status: 'success', data: { submissions: out.slice(0, limit), total: out.length } });
  } catch (err) {
    console.error('Practical submissions error:', err);
    res.status(500).json({ status: 'error', message: 'Server error loading practical submissions' });
  }
};

module.exports = { getPracticalProgress, setPracticalProgress, submitGuide, listPracticalSubmissions, shape };
