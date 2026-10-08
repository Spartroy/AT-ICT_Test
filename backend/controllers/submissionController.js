const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { flattenSubmissions, filterSubmissions, statusCounts, studentCounts } = require('../utils/submissions');

const FILTER_KEYS = ['status', 'section', 'phase', 'chapter', 'program', 'student', 'assignment', 'q'];
const pickFilters = (query) => Object.fromEntries(FILTER_KEYS.filter(k => query[k]).map(k => [k, String(query[k])]));

// All submission rows for assignments this teacher created (grading is creator-only too).
async function loadRows(teacherId) {
  const assignments = await Assignment.find({ createdBy: teacherId, isActive: true })
    .select('title type section maxScore dueDate lesson assignedTo')
    .lean();
  const ids = new Set();
  assignments.forEach(a => (a.assignedTo || []).forEach(e => ids.add(String(e.student))));
  const users = await User.find({ _id: { $in: [...ids] } }).select('firstName lastName email').lean();
  const students = new Map(users.map(u => [String(u._id), { name: `${u.firstName} ${u.lastName}`, email: u.email }]));
  return { rows: flattenSubmissions(assignments, students), assignments };
}

// @desc    Submissions inbox: filterable, paginated list across all of the teacher's assignments
// @route   GET /api/teacher/submissions?status=&section=&phase=&chapter=&program=&student=&assignment=&q=&page=&limit=
// @access  Private (Teacher)
const listSubmissions = async (req, res) => {
  try {
    const filters = pickFilters(req.query);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const { rows } = await loadRows(req.user.id);
    const matched = filterSubmissions(rows, filters);
    res.status(200).json({
      status: 'success',
      data: {
        submissions: matched.slice((page - 1) * limit, page * limit),
        counts: statusCounts(rows, filters),
        students: studentCounts(rows, filters),
        pagination: { page, limit, total: matched.length, pages: Math.max(1, Math.ceil(matched.length / limit)) }
      }
    });
  } catch (error) {
    console.error('List submissions error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving submissions' });
  }
};

const safe = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'file';

// @desc    Download submissions as one zip (selected ids, or everything matching the filters)
// @route   GET /api/teacher/submissions/zip?ids=<assignmentId:studentId,...>  (or the list filters)
// @access  Private (Teacher)
const zipSubmissions = async (req, res) => {
  try {
    const { rows } = await loadRows(req.user.id);
    const ids = req.query.ids ? new Set(String(req.query.ids).split(',').filter(Boolean)) : null;
    const chosen = ids ? rows.filter(r => ids.has(r.id)) : filterSubmissions(rows, pickFilters(req.query));
    const assignments = await Assignment.find({ _id: { $in: [...new Set(chosen.map(r => r.assignmentId))] } })
      .select('assignedTo.student assignedTo.submission')
      .lean();

    const files = [];
    for (const r of chosen) {
      const a = assignments.find(x => String(x._id) === r.assignmentId);
      const entry = a?.assignedTo.find(e => String(e.student) === r.studentId);
      for (const f of entry?.submission?.attachments || []) {
        const filePath = path.join(__dirname, '..', f.path || '');
        if (f.path && fs.existsSync(filePath)) {
          files.push({ filePath, name: `${safe(r.student.name)}/${safe(r.assignment.title)} - ${safe(f.originalName || f.filename)}` });
        }
      }
    }
    if (!files.length) {
      return res.status(404).json({ status: 'error', message: 'No submission files found for this selection' });
    }

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${stamp}.zip"`);
    const zip = archiver('zip', { zlib: { level: 6 } });
    zip.on('error', (err) => {
      console.error('Zip error:', err);
      res.destroy(err);
    });
    zip.pipe(res);
    const used = new Set();
    files.forEach(({ filePath, name }) => {
      let n = name;
      for (let i = 2; used.has(n); i++) n = name.replace(/(\.[^./]*)?$/, ` (${i})$1`);
      used.add(n);
      zip.file(filePath, { name: n });
    });
    await zip.finalize();
  } catch (error) {
    console.error('Zip submissions error:', error);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'Server error preparing the zip' });
  }
};

module.exports = { listSubmissions, zipSubmissions };
