const Parent = require('../models/Parent');
const Student = require('../models/Student');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Message = require('../models/Message');

// @desc    Get parent dashboard data
// @route   GET /api/parent/dashboard
// @access  Private (Parent)
const getDashboardData = async (req, res) => {
  try {
    // First try the Parent model (legacy)
    const parent = await Parent.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'children.student',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });

    if (parent && (parent.children?.length || 0) > 0) {
      const primaryChild = parent.getPrimaryChild() || parent.children[0];
      const student = primaryChild.student;
      const studentUserId = student?.user?._id || student?.user;

      const assignmentStats = await Assignment.aggregate([
        { $unwind: '$assignedTo' },
        { $match: { 'assignedTo.student': studentUserId } },
        {
          $group: {
            _id: null,
            totalAssignments: { $sum: 1 },
            completedAssignments: {
              $sum: { $cond: [{ $in: ['$assignedTo.status', ['submitted', 'graded']] }, 1, 0] }
            },
            avgScore: { $avg: '$assignedTo.score' }
          }
        }
      ]);

      const quizStats = await Quiz.aggregate([
        { $unwind: '$assignedTo' },
        { $match: { 'assignedTo.student': studentUserId } },
        {
          $group: {
            _id: null,
            totalQuizzes: { $sum: 1 },
            completedQuizzes: { $sum: { $cond: [{ $eq: ['$assignedTo.status', 'completed'] }, 1, 0] } },
            avgScore: { $avg: '$assignedTo.percentage' }
          }
        }
      ]);

      const attendanceSummary = await Attendance.getStudentAttendanceSummary?.(student._id);

      return res.status(200).json({
        status: 'success',
        data: {
          parent,
          primaryChild: { student, relationship: primaryChild.relationship },
          allChildren: parent.children,
          stats: {
            assignments: assignmentStats[0] || { totalAssignments: 0, completedAssignments: 0, avgScore: 0 },
            quizzes: quizStats[0] || { totalQuizzes: 0, completedQuizzes: 0, avgScore: 0 },
            attendance: attendanceSummary?.summary || { present: 0, absent: 0, late: 0, total: 0, percentage: 0 }
          }
        }
      });
    }

    // Fallback: Use parent user (role 'parent') and User model linkage
    const parentUser = await User.findById(req.user.id).select('firstName lastName email parentInfo role');
    if (!parentUser || parentUser.role !== 'parent') {
      return res.status(404).json({ status: 'error', message: 'Parent profile not found' });
    }

    const childLink = parentUser.parentInfo?.children?.find(c => c.isPrimary) || parentUser.parentInfo?.children?.[0];
    if (!childLink) {
      return res.status(404).json({ status: 'error', message: 'No children found for this parent' });
    }

    const studentUser = await User.findById(childLink.studentId).select('firstName lastName email studentInfo');
    if (!studentUser) {
      return res.status(404).json({ status: 'error', message: 'Linked student not found' });
    }

    const assignmentStats = await Assignment.aggregate([
      { $unwind: '$assignedTo' },
      { $match: { 'assignedTo.student': studentUser._id } },
      { $group: { _id: null, totalAssignments: { $sum: 1 }, completedAssignments: { $sum: { $cond: [{ $in: ['$assignedTo.status', ['submitted', 'graded']] }, 1, 0] } }, avgScore: { $avg: '$assignedTo.score' } } }
    ]);

    const quizStats = await Quiz.aggregate([
      { $unwind: '$assignedTo' },
      { $match: { 'assignedTo.student': studentUser._id } },
      { $group: { _id: null, totalQuizzes: { $sum: 1 }, completedQuizzes: { $sum: { $cond: [{ $eq: ['$assignedTo.status', 'completed'] }, 1, 0] } }, avgScore: { $avg: '$assignedTo.percentage' } } }
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        parent: {
          user: { firstName: parentUser.firstName, lastName: parentUser.lastName, email: parentUser.email },
          children: [
            {
              student: {
                user: { firstName: studentUser.firstName, lastName: studentUser.lastName, email: studentUser.email },
                year: studentUser.studentInfo?.year,
                session: studentUser.studentInfo?.session,
                studentId: studentUser.studentInfo?.studentId,
                overallProgress: studentUser.studentInfo?.overallProgress || 0,
                currentGrade: studentUser.studentInfo?.currentGrade || 'N/A',
                targetGrade: studentUser.studentInfo?.targetGrade || 'A*',
                _id: studentUser._id
              },
              relationship: 'guardian',
              isPrimary: true
            }
          ]
        },
        primaryChild: {
          student: {
            user: { firstName: studentUser.firstName, lastName: studentUser.lastName, email: studentUser.email },
            year: studentUser.studentInfo?.year,
            session: studentUser.studentInfo?.session,
            studentId: studentUser.studentInfo?.studentId,
            overallProgress: studentUser.studentInfo?.overallProgress || 0,
            currentGrade: studentUser.studentInfo?.currentGrade || 'N/A',
            targetGrade: studentUser.studentInfo?.targetGrade || 'A*',
            _id: studentUser._id
          },
          relationship: 'guardian'
        },
        allChildren: [
          {
            student: {
              user: { firstName: studentUser.firstName, lastName: studentUser.lastName, email: studentUser.email },
              year: studentUser.studentInfo?.year,
              session: studentUser.studentInfo?.session,
              studentId: studentUser.studentInfo?.studentId,
              overallProgress: studentUser.studentInfo?.overallProgress || 0,
              currentGrade: studentUser.studentInfo?.currentGrade || 'N/A',
              targetGrade: studentUser.studentInfo?.targetGrade || 'A*',
              _id: studentUser._id
            },
            relationship: 'guardian',
            isPrimary: true
          }
        ],
        stats: {
          assignments: assignmentStats[0] || { totalAssignments: 0, completedAssignments: 0, avgScore: 0 },
          quizzes: quizStats[0] || { totalQuizzes: 0, completedQuizzes: 0, avgScore: 0 },
          attendance: { present: 0, absent: 0, late: 0, total: 0, percentage: 0 }
        }
      }
    });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving dashboard data'
    });
  }
};

// @desc    Get child progress details
// @route   GET /api/parent/child/:childId/progress
// @access  Private (Parent)
const getChildProgress = async (req, res) => {
  try {
    // Prefer user-model parent linkage
    const parentUser = await User.findById(req.user.id).select('role parentInfo');
    if (!parentUser || parentUser.role !== 'parent') {
      return res.status(404).json({ status: 'error', message: 'Parent profile not found' });
    }

    const requestedChildId = req.params.childId;
    const allowed = parentUser.parentInfo?.children?.some((c) => String(c.studentId) === String(requestedChildId));
    if (!allowed) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to child data' });
    }

    const studentUser = await User.findById(requestedChildId).select('firstName lastName email studentInfo');
    if (!studentUser) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    // Get all assignments for this student (regardless of status)
    const assignments = await Assignment.find({ 'assignedTo.student': studentUser._id })
      .select('title description dueDate maxScore assignedTo createdAt')
      .sort({ dueDate: -1 });

    // Map to student's row including status, submission, marks, late
    const mappedAssignments = assignments.map(a => {
      const me = a.assignedTo.find(x => String(x.student) === String(studentUser._id)) || {};
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        status: me.status || 'assigned',
        submissionDate: me.submissionDate,
        isLate: !!me.isLate,
        feedback: me.feedback || null,
        score: me.score ?? null
      };
    });

    const quizzes = await Quiz.find({ 'assignedTo.student': studentUser._id })
      .select('title description startDate startTime duration maxScore assignedTo createdAt')
      .sort({ startDate: -1 });

    const mappedQuizzes = quizzes.map(q => {
      const me = q.assignedTo.find(x => String(x.student) === String(studentUser._id)) || {};
      return {
        _id: q._id,
        title: q.title,
        description: q.description,
        startDate: q.startDate,
        startTime: q.startTime,
        duration: q.duration,
        maxScore: q.maxScore,
        status: me.status || 'assigned',
        submissionDate: me.submissionDate,
        isLate: !!me.isLate,
        feedback: me.feedback || null,
        score: me.score ?? null
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        student: {
          _id: studentUser._id,
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          email: studentUser.email,
          year: studentUser.studentInfo?.year,
          session: studentUser.studentInfo?.session
        },
        assignments: mappedAssignments,
        quizzes: mappedQuizzes
      }
    });
  } catch (error) {
    console.error('Get child progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving child progress'
    });
  }
};

// @desc    Get child reports and marks
// @route   GET /api/parent/child/:childId/reports
// @access  Private (Parent)
const getChildReports = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent profile not found'
      });
    }

    // Verify this child belongs to this parent
    const childExists = parent.children.some(
      child => child.student.toString() === req.params.childId
    );

    if (!childExists) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to child data'
      });
    }

    const student = await Student.findById(req.params.childId)
      .populate('user', 'firstName lastName email');

    // Get graded assignments
    const gradedAssignments = await Assignment.find({
      'assignedTo.student': student._id,
      'assignedTo.status': 'graded'
    }).populate('createdBy', 'firstName lastName');

    // Get completed quizzes
    const completedQuizzes = await Quiz.find({
      'assignedTo.student': student._id,
      'assignedTo.status': 'completed'
    }).populate('createdBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      data: {
        student,
        gradedAssignments,
        completedQuizzes,
        reportGeneratedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get child reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving child reports'
    });
  }
};

module.exports = {
  getDashboardData,
  getChildProgress,
  getChildReports
}; 