const User = require('../models/User');
const TheoryAttempt = require('../models/TheoryAttempt');

// @route GET /api/parent/child/:childId/quiz-reports  (the simple reports the teacher sent for this child)
const forChild = async (req, res) => {
  try {
    const parent = await User.findById(req.user.id).select('role parentInfo');
    const allowed = parent && parent.parentInfo && (parent.parentInfo.children || []).some(c => String(c.studentId) === String(req.params.childId));
    if (!allowed) return res.status(403).json({ status: 'error', message: 'Unauthorized access to child data' });
    const attempts = await TheoryAttempt.find({ student: req.params.childId, 'parentReport.sentAt': { $exists: true } })
      .select('parentReport').sort({ 'parentReport.sentAt': -1 }).limit(50).lean();
    return res.json({ status: 'success', data: { reports: attempts.map(a => ({ _id: a._id, ...a.parentReport })) } });
  } catch (err) {
    console.error('Theory quiz (parent) error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error loading quiz reports' });
  }
};

module.exports = { forChild };
