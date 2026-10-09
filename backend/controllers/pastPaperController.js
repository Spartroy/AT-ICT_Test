const PastPaper = require('../models/PastPaper');
const { normalizePastPapers } = require('../validators/pastPapers');

// @desc    All past-paper variants (flat list, newest year first)
// @route   GET /api/pastpapers
// @access  Private
const listPastPapers = async (req, res) => {
  try {
    const query = {};
    if (req.query.paper) query.paper = Number(req.query.paper);
    if (req.query.year) query.year = Number(req.query.year);
    const papers = await PastPaper.find(query).sort({ paper: 1, year: -1, session: 1, variant: 1 }).lean();
    res.status(200).json({ status: 'success', data: { papers } });
  } catch (error) {
    console.error('List past papers error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving past papers' });
  }
};

// @desc    Replace everything stored for one paper + year (Jun and Nov variants)
// @route   PUT /api/teacher/pastpapers
// @access  Private (Teacher)
const savePastPapers = async (req, res) => {
  try {
    const { value, errors } = normalizePastPapers(req.body);
    if (errors.length) return res.status(400).json({ status: 'error', message: errors[0].msg, errors });

    await PastPaper.deleteMany({ paper: value.paper, year: value.year });
    if (value.docs.length) await PastPaper.insertMany(value.docs.map(d => ({ ...d, createdBy: req.user._id })));

    res.status(200).json({
      status: 'success',
      message: value.docs.length ? 'Past papers saved' : 'Past papers cleared',
      data: { paper: value.paper, year: value.year, variants: value.docs.length }
    });
  } catch (error) {
    console.error('Save past papers error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving past papers' });
  }
};

// @desc    Remove one paper + year
// @route   DELETE /api/teacher/pastpapers/:paper/:year
// @access  Private (Teacher)
const deletePastPapers = async (req, res) => {
  try {
    const result = await PastPaper.deleteMany({ paper: Number(req.params.paper), year: Number(req.params.year) });
    res.status(200).json({ status: 'success', message: 'Past papers deleted', data: { deleted: result.deletedCount } });
  } catch (error) {
    console.error('Delete past papers error:', error);
    res.status(500).json({ status: 'error', message: 'Server error deleting past papers' });
  }
};

module.exports = { listPastPapers, savePastPapers, deletePastPapers };
