const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Message = require('../models/Message');

// @desc    Get parent dashboard data
// @route   GET /api/parent/dashboard
// @access  Private (Parent)
const getDashboardData = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'children.student',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });

    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent profile not found'
      });
    }

    // Get primary child or first child
    const primaryChild = parent.getPrimaryChild() || parent.children[0];
    
    if (!primaryChild) {
      return res.status(404).json({
        status: 'error',
        message: 'No children found for this parent'
      });
    }

    const student = primaryChild.student;

    // Get child's stats
    const assignmentStats = await Assignment.aggregate([
      { $unwind: '$assignedTo' },
      { $match: { 'assignedTo.student': student._id } },
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
      { $match: { 'assignedTo.student': student._id } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          completedQuizzes: {
            $sum: { $cond: [{ $eq: ['$assignedTo.status', 'completed'] }, 1, 0] }
          },
          avgScore: { $avg: '$assignedTo.percentage' }
        }
      }
    ]);

    // Get attendance summary
    const attendanceSummary = await Attendance.getStudentAttendanceSummary(student._id);

    res.status(200).json({
      status: 'success',
      data: {
        parent,
        primaryChild: {
          student,
          relationship: primaryChild.relationship
        },
        allChildren: parent.children,
        stats: {
          assignments: assignmentStats[0] || {
            totalAssignments: 0,
            completedAssignments: 0,
            avgScore: 0
          },
          quizzes: quizStats[0] || {
            totalQuizzes: 0,
            completedQuizzes: 0,
            avgScore: 0
          },
          attendance: attendanceSummary?.summary || {
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
            percentage: 0
          }
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

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Get assignments
    const assignments = await Assignment.find({
      'assignedTo.student': student._id
    }).populate('createdBy', 'firstName lastName');

    // Get quizzes
    const quizzes = await Quiz.find({
      'assignedTo.student': student._id
    }).populate('createdBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      data: {
        student,
        assignments,
        quizzes,
        overallProgress: student.overallProgress,
        currentGrade: student.currentGrade,
        targetGrade: student.targetGrade
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