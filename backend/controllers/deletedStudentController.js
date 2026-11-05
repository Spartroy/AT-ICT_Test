const mongoose = require('mongoose');
const DeletedStudent = require('../models/DeletedStudent');
const { restoreStudent } = require('../services/deletedStudents');

const mine = (req, id) => DeletedStudent.findOne({ _id: id, teacher: req.user._id });

// @route GET /api/teacher/deleted-students
const listDeleted = async (req, res) => {
  try {
    const students = await DeletedStudent.find({ teacher: req.user._id })
      .select('-snapshot').sort({ deletedAt: -1 }).limit(500);
    res.status(200).json({ status: 'success', data: { students } });
  } catch (error) {
    console.error('List deleted students error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving deleted students' });
  }
};

// @route POST /api/teacher/deleted-students/:id/restore
const restoreDeleted = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: 'error', message: 'Deleted student not found' });
    const archive = await mine(req, req.params.id);
    if (!archive) return res.status(404).json({ status: 'error', message: 'Deleted student not found' });
    const result = await restoreStudent(archive);
    res.status(200).json({
      status: 'success',
      message: `${archive.fullName || 'Student'} restored`,
      data: { studentId: archive.originalId, skipped: result.skipped }
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    console.error('Restore student error:', error);
    res.status(500).json({ status: 'error', message: 'Server error restoring student' });
  }
};

// @route DELETE /api/teacher/deleted-students/:id  (forget the student for good)
const purgeDeleted = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: 'error', message: 'Deleted student not found' });
    const gone = await DeletedStudent.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!gone) return res.status(404).json({ status: 'error', message: 'Deleted student not found' });
    res.status(200).json({ status: 'success', message: 'Permanently deleted' });
  } catch (error) {
    console.error('Purge deleted student error:', error);
    res.status(500).json({ status: 'error', message: 'Server error deleting permanently' });
  }
};

module.exports = { listDeleted, restoreDeleted, purgeDeleted };
