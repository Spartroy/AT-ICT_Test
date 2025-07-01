const mongoose = require('mongoose');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get teacher dashboard stats
// @route   GET /api/teacher/dashboard
// @access  Private (Teacher)
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ 
      role: 'student', 
      isActive: true,
      registrationStatus: 'approved'  
    });
    
    const pendingRegistrations = await User.countDocuments({
      role: 'student',
      registrationStatus: 'pending'
    });
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const newStudentsThisWeek = await User.countDocuments({
      role: 'student',
      createdAt: { $gte: weekAgo }
    });
    
    // Get performance stats from User studentInfo
    const performanceStats = await User.aggregate([
      { 
        $match: { 
          role: 'student', 
          isActive: true,
          registrationStatus: 'approved'
        } 
      },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$studentInfo.overallProgress' },
          totalStudents: { $sum: 1 }
        }
      }
    ]);
    
    // Get session distribution
    const sessionStats = await User.aggregate([
      { 
        $match: { 
          role: 'student', 
          registrationStatus: 'approved'
        } 
      },
      {
        $group: {
          _id: '$studentInfo.session',
          count: { $sum: 1 }
        }
      }
    ]);

    const sessionDistribution = {};
    sessionStats.forEach(stat => {
      sessionDistribution[stat._id || 'Unknown'] = stat.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalStudents,
          pendingRegistrations,
          newStudentsThisWeek,
          activeAnnouncements: await Announcement.countDocuments({ 
            isPublished: true 
          })
        },
        performance: performanceStats[0] || { avgProgress: 0, totalStudents: 0 },
        sessionDistribution
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving dashboard stats'
    });
  }
};

// @desc    Get all students
// @route   GET /api/teacher/students
// @access  Private (Teacher)
const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, session, year, status } = req.query;

    let query = { 
      role: 'student',
      isActive: true 
    };
    
    // Filter by registration status if provided
    if (status) query.registrationStatus = status;
    
    // Filter by session and year from studentInfo
    if (session) query['studentInfo.session'] = session;
    if (year) query['studentInfo.year'] = year;
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentInfo.studentId': { $regex: search, $options: 'i' } },
        { 'studentInfo.school': { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('firstName lastName email contactNumber studentInfo registrationStatus lastLogin createdAt avatar isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Transform data for frontend
    const transformedStudents = students.map(student => ({
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      contactNumber: student.contactNumber,
      studentId: student.studentInfo?.studentId || 'Not assigned',
      year: student.studentInfo?.year || 'N/A',
      session: student.studentInfo?.session || 'N/A',
      school: student.studentInfo?.school || 'N/A',
      nationality: student.studentInfo?.nationality || 'N/A',
      registrationStatus: student.registrationStatus,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      enrolledDate: student.studentInfo?.enrolledDate || student.createdAt,
      overallProgress: student.studentInfo?.overallProgress || 0,
      currentGrade: student.studentInfo?.currentGrade || 'N/A',
      targetGrade: student.studentInfo?.targetGrade || 'A*',
      avatar: student.avatar
    }));

    res.status(200).json({
      status: 'success',
      data: {
        students: transformedStudents,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving students'
    });
  }
};

// @desc    Get single student details
// @route   GET /api/teacher/students/:id
// @access  Private (Teacher)
const getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('firstName lastName email contactNumber studentInfo parentInfo registrationStatus lastLogin createdAt avatar isActive address role');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Get student's assignments (assuming assignments are linked to user ID)
    const assignments = await Assignment.find({
      $or: [
        { 'assignedTo.student': student._id },
        { 'assignedTo.user': student._id }
      ]
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

    // Get student's quizzes
    const quizzes = await Quiz.find({
      $or: [
        { 'assignedTo.student': student._id },
        { 'assignedTo.user': student._id }
      ]
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

    // Calculate assignment stats
    const assignmentStats = {
      total: assignments.length,
      completed: assignments.filter(a => {
        const studentAssignment = a.assignedTo.find(at => 
          at.student?.toString() === student._id.toString() || 
          at.user?.toString() === student._id.toString()
        );
        return studentAssignment && ['submitted', 'graded'].includes(studentAssignment.status);
      }).length,
      pending: assignments.filter(a => {
        const studentAssignment = a.assignedTo.find(at => 
          at.student?.toString() === student._id.toString() || 
          at.user?.toString() === student._id.toString()
        );
        return studentAssignment && ['assigned', 'in_progress'].includes(studentAssignment.status);
      }).length
    };

    // Calculate quiz stats
    const quizStats = {
      total: quizzes.length,
      completed: quizzes.filter(q => {
        const studentQuiz = q.assignedTo.find(at => 
          at.student?.toString() === student._id.toString() || 
          at.user?.toString() === student._id.toString()
        );
        return studentQuiz && studentQuiz.status === 'completed';
      }).length,
      pending: quizzes.filter(q => {
        const studentQuiz = q.assignedTo.find(at => 
          at.student?.toString() === student._id.toString() || 
          at.user?.toString() === student._id.toString()
        );
        return studentQuiz && studentQuiz.status === 'assigned';
      }).length
    };

    // Get recent messages (if Message model supports it)
    let recentMessages = [];
    try {
      recentMessages = await Message.find({
        $or: [
          { sender: student._id },
          { recipient: student._id }
        ]
      })
      .populate('sender', 'firstName lastName')
      .populate('recipient', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);
    } catch (messageError) {
      console.log('Message retrieval not implemented:', messageError.message);
    }

    // Transform student data
    const studentDetails = {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      contactNumber: student.contactNumber,
      studentId: student.studentInfo?.studentId || 'Not assigned',
      year: student.studentInfo?.year || 'N/A',
      session: student.studentInfo?.session || 'N/A',
      school: student.studentInfo?.school || 'N/A',
      nationality: student.studentInfo?.nationality || 'N/A',
      isRetaker: student.studentInfo?.isRetaker || false,
      techKnowledge: student.studentInfo?.techKnowledge || 'N/A',
      otherSubjects: student.studentInfo?.otherSubjects || 'N/A',
      parentContactNumber: student.studentInfo?.parentContactNumber || 'N/A',
      currentGrade: student.studentInfo?.currentGrade || 'N/A',
      targetGrade: student.studentInfo?.targetGrade || 'A*',
      overallProgress: student.studentInfo?.overallProgress || 0,
      registrationStatus: student.registrationStatus,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      enrolledDate: student.studentInfo?.enrolledDate || student.createdAt,
      createdAt: student.createdAt,
      avatar: student.avatar,
      address: student.address
    };

    res.status(200).json({
      status: 'success',
      data: {
        student: studentDetails,
        assignments,
        quizzes,
        stats: {
          assignments: assignmentStats,
          quizzes: quizStats
        },
        recentMessages
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving student details'
    });
  }
};

// @desc    Update student information
// @route   PUT /api/teacher/students/:id
// @access  Private (Teacher)
const updateStudent = async (req, res) => {
  try {
    const {
      currentGrade,
      targetGrade,
      overallProgress,
      isActive,
      notes
    } = req.body;

    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Update studentInfo fields
    if (currentGrade !== undefined) {
      student.studentInfo.currentGrade = currentGrade;
    }
    if (targetGrade !== undefined) {
      student.studentInfo.targetGrade = targetGrade;
    }
    if (overallProgress !== undefined) {
      student.studentInfo.overallProgress = overallProgress;
    }
    if (isActive !== undefined) {
      student.isActive = isActive;
      student.studentInfo.isActive = isActive;
    }

    await student.save();

    res.status(200).json({
      status: 'success',
      message: 'Student updated successfully',
      data: { 
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          currentGrade: student.studentInfo?.currentGrade,
          targetGrade: student.studentInfo?.targetGrade,
          overallProgress: student.studentInfo?.overallProgress,
          isActive: student.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating student'
    });
  }
};

// @desc    Update assignment feedback and grade
// @route   PUT /api/teacher/assignments/:assignmentId/students/:studentId
// @access  Private (Teacher)
const updateAssignmentFeedback = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { score, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Find the student's assignment entry
    const studentAssignmentIndex = assignment.assignedTo.findIndex(
      at => at.student?.toString() === studentId || at.user?.toString() === studentId
    );

    if (studentAssignmentIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Student assignment not found'
      });
    }

    // Update the assignment
    assignment.assignedTo[studentAssignmentIndex].score = score;
    assignment.assignedTo[studentAssignmentIndex].feedback = feedback;
    assignment.assignedTo[studentAssignmentIndex].status = 'graded';
    assignment.assignedTo[studentAssignmentIndex].gradedDate = new Date();

    await assignment.save();

    res.status(200).json({
      status: 'success',
      message: 'Assignment feedback updated successfully',
      data: {
        assignment: assignment.assignedTo[studentAssignmentIndex]
      }
    });
  } catch (error) {
    console.error('Update assignment feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating assignment feedback'
    });
  }
};

// @desc    Update quiz feedback
// @route   PUT /api/teacher/quizzes/:quizId/students/:studentId
// @access  Private (Teacher)
const updateQuizFeedback = async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    const { feedback } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Find the student's quiz entry
    const studentQuizIndex = quiz.assignedTo.findIndex(
      at => at.student?.toString() === studentId || at.user?.toString() === studentId
    );

    if (studentQuizIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Student quiz not found'
      });
    }

    // Update the quiz feedback
    quiz.assignedTo[studentQuizIndex].feedback = feedback;

    await quiz.save();

    res.status(200).json({
      status: 'success',
      message: 'Quiz feedback updated successfully',
      data: {
        quiz: quiz.assignedTo[studentQuizIndex]
      }
    });
  } catch (error) {
    console.error('Update quiz feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating quiz feedback'
    });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  getStudentDetails,
  updateStudent,
  updateAssignmentFeedback,
  updateQuizFeedback
}; 