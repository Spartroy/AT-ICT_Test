const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Material = require('../models/Material');
const Video = require('../models/Video');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');

// @desc    Get student dashboard stats
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getDashboardStats = async (req, res) => {
  try {
    const student = await User.findById(req.user.id)
      .select('firstName lastName email studentInfo parentInfo registrationStatus');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    // Get assignments stats - using User ID instead of Student ID
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
          pendingAssignments: {
            $sum: { $cond: [{ $in: ['$assignedTo.status', ['assigned', 'in_progress']] }, 1, 0] }
          },
          avgScore: { $avg: '$assignedTo.score' }
        }
      }
    ]);

    // Get quiz stats - using User ID instead of Student ID
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
          pendingQuizzes: {
            $sum: { $cond: [{ $eq: ['$assignedTo.status', 'assigned'] }, 1, 0] }
          },
          avgScore: { $avg: '$assignedTo.percentage' }
        }
      }
    ]);

    // Get announcement stats
    const announcements = await Announcement.getForUser(student._id, 'student', { includeExpired: false });
    const unreadAnnouncements = announcements.filter(
      ann => !ann.readBy.some(read => read.user.toString() === student._id.toString())
    );

    const announcementStats = {
      totalAnnouncements: announcements.length,
      unreadAnnouncements: unreadAnnouncements.length,
      urgentAnnouncements: announcements.filter(ann => ann.priority === 'urgent').length,
      pinnedAnnouncements: announcements.filter(ann => ann.isPinned).length
    };

    // Get unread messages count
    const unreadMessages = await Message.countDocuments({
      recipient: student._id,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        student,
        stats: {
          assignments: assignmentStats[0] || {
            totalAssignments: 0,
            completedAssignments: 0,
            pendingAssignments: 0,
            avgScore: 0
          },
          quizzes: quizStats[0] || {
            totalQuizzes: 0,
            completedQuizzes: 0,
            pendingQuizzes: 0,
            avgScore: 0
          },
          announcements: announcementStats,
          unreadMessages: unreadMessages || 0,
          overallProgress: student.studentInfo?.currentGrade || 'Not Set'
        }
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

// @desc    Get student assignments
// @route   GET /api/student/assignments
// @access  Private (Student)
const getAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const assignments = await Assignment.find({
      'assignedTo.student': student._id,
      isActive: true
    })
    .populate('createdBy', 'firstName lastName')
    .populate('assignedTo.student', 'firstName lastName email')
    .sort({ dueDate: 1 });

    // Transform assignments to include current student's specific data
    const transformedAssignments = assignments.map(assignment => {
      // Find current student's data in the assignedTo array
      const studentData = assignment.assignedTo.find(
        a => a.student._id.toString() === student._id.toString()
      );

      // Return assignment with flattened student-specific data
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        section: assignment.section,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        difficulty: assignment.difficulty,
        instructions: assignment.instructions,
        attachments: assignment.attachments,
        resources: assignment.resources,
        createdBy: assignment.createdBy,
        publishDate: assignment.publishDate,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        
        // Student-specific data (flattened from assignedTo array)
        studentData: {
          assignedDate: studentData?.assignedDate,
          status: studentData?.status || 'assigned',
          submissionDate: studentData?.submissionDate,
          submission: studentData?.submission,
          score: studentData?.score,
          feedback: studentData?.feedback,
          gradedDate: studentData?.gradedDate,
          isLate: studentData?.isLate || false
        }
      };
    });

    console.log('📚 Transformed assignments for student:', student.firstName, student.lastName);
    console.log('📊 Assignments with scores:', transformedAssignments.map(a => ({
      title: a.title,
      score: a.studentData.score,
      feedback: a.studentData.feedback,
      status: a.studentData.status
    })));

    res.status(200).json({
      status: 'success',
      data: { assignments: transformedAssignments }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving assignments'
    });
  }
};

// @desc    Get student quizzes
// @route   GET /api/student/quizzes
// @access  Private (Student)
const getQuizzes = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const quizzes = await Quiz.find({
      'assignedTo.student': student._id,
      isActive: true
    })
    .populate('createdBy', 'firstName lastName')
    .populate('assignedTo.student', 'firstName lastName email')
    .sort({ startDate: 1 });

    // Transform quizzes to include current student's specific data
    const transformedQuizzes = quizzes.map(quiz => {
      // Find current student's data in the assignedTo array
      const studentData = quiz.assignedTo.find(
        a => a.student._id.toString() === student._id.toString()
      );

      // Return quiz with flattened student-specific data
      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        type: quiz.type,
        section: quiz.section,
        startDate: quiz.startDate,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        maxScore: quiz.maxScore,
        difficulty: quiz.difficulty,
        instructions: quiz.instructions,
        attachments: quiz.attachments,
        resources: quiz.resources,
        createdBy: quiz.createdBy,
        publishDate: quiz.publishDate,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        
        // Student-specific data (flattened from assignedTo array)
        studentData: {
          assignedDate: studentData?.assignedDate,
          status: studentData?.status || 'assigned',
          startTime: studentData?.startTime,
          submissionDate: studentData?.submissionDate,
          submission: studentData?.submission,
          score: studentData?.score,
          feedback: studentData?.feedback,
          gradedDate: studentData?.gradedDate,
          isLate: studentData?.isLate || false,
          timeSpent: studentData?.timeSpent
        }
      };
    });

    console.log('📚 Transformed quizzes for student:', student.firstName, student.lastName);
    console.log('📊 Quizzes with scores:', transformedQuizzes.map(q => ({
      title: q.title,
      score: q.studentData.score,
      feedback: q.studentData.feedback,
      status: q.studentData.status
    })));

    res.status(200).json({
      status: 'success',
      data: { quizzes: transformedQuizzes }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving quizzes'
    });
  }
};

// @desc    Get materials
// @route   GET /api/student/materials
// @access  Private (Student)
const getMaterials = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    // For now, return empty materials as this feature is not implemented yet
    res.status(200).json({
      status: 'success',
      data: { 
        materials: {
          theory: [],
          practical: []
        }
      }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving materials'
    });
  }
};

// @desc    Get videos
// @route   GET /api/student/videos
// @access  Private (Student)
const getVideos = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    // For now, return empty videos as this feature is not implemented yet
    res.status(200).json({
      status: 'success',
      data: {
        videos: {
          theory: { phase1: [], phase2: [], phase3: [] },
          practical: {
            word: { guides: [], tasks: [] },
            powerpoint: { guides: [], tasks: [] },
            access: { guides: [], tasks: [] },
            excel: { guides: [], tasks: [] },
            sharepoint: { guides: [], tasks: [] }
          }
        },
        progress: {}
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving videos'
    });
  }
};

// @desc    Submit assignment
// @route   POST /api/student/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if student is assigned to this assignment
    const studentAssignment = assignment.assignedTo.find(
      a => a.student.toString() === student._id.toString()
    );

    if (!studentAssignment) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this assignment'
      });
    }

    // Check if already submitted
    if (studentAssignment.status === 'submitted' || studentAssignment.status === 'graded') {
      return res.status(400).json({
        status: 'error',
        message: 'Assignment has already been submitted'
      });
    }

    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    // Update assignment submission
    const submissionDate = new Date();
    const isLate = submissionDate > assignment.dueDate;

    studentAssignment.status = 'submitted';
    studentAssignment.submissionDate = submissionDate;
    studentAssignment.isLate = isLate;
    studentAssignment.submission = {
      text: req.body.text || '',
      attachments: attachments
    };

    await assignment.save();

    res.status(200).json({
      status: 'success',
      message: isLate ? 'Assignment submitted successfully (late submission)' : 'Assignment submitted successfully',
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          submissionDate: submissionDate,
          isLate: isLate,
          attachments: attachments
        }
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error submitting assignment'
    });
  }
};

// @desc    Submit quiz
// @route   POST /api/student/quizzes/:id/submit
// @access  Private (Student)
const submitQuiz = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if student is assigned to this quiz
    const studentQuiz = quiz.assignedTo.find(
      a => a.student.toString() === student._id.toString()
    );

    if (!studentQuiz) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this quiz'
      });
    }

    // Check if already submitted
    if (studentQuiz.status === 'submitted' || studentQuiz.status === 'graded') {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz has already been submitted'
      });
    }

    // Check if quiz is available
    const now = new Date();
    const startDateTime = new Date(`${quiz.startDate.toISOString().split('T')[0]}T${quiz.startTime}`);
    const endDateTime = new Date(`${quiz.startDate.toISOString().split('T')[0]}T${quiz.endTime}`);

    if (now < startDateTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz has not started yet'
      });
    }

    if (now > endDateTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz submission time has ended'
      });
    }

    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    // Update quiz submission
    const submissionDate = new Date();
    const isLate = submissionDate > endDateTime;
    
    // Calculate time spent if start time was recorded
    let timeSpent = 0;
    if (studentQuiz.startTime) {
      timeSpent = Math.round((submissionDate - studentQuiz.startTime) / (1000 * 60)); // in minutes
    }

    studentQuiz.status = 'submitted';
    studentQuiz.submissionDate = submissionDate;
    studentQuiz.isLate = isLate;
    studentQuiz.timeSpent = timeSpent;
    studentQuiz.submission = {
      text: req.body.text || '',
      attachments: attachments
    };

    await quiz.save();

    res.status(200).json({
      status: 'success',
      message: isLate ? 'Quiz submitted successfully (late submission)' : 'Quiz submitted successfully',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          submissionDate: submissionDate,
          isLate: isLate,
          timeSpent: timeSpent,
          attachments: attachments
        }
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error submitting quiz'
    });
  }
};

// @desc    Start quiz
// @route   POST /api/student/quizzes/:id/start
// @access  Private (Student)
const startQuiz = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if student is assigned to this quiz
    const studentQuiz = quiz.assignedTo.find(
      a => a.student.toString() === student._id.toString()
    );

    if (!studentQuiz) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this quiz'
      });
    }

    // Check if quiz is available
    const now = new Date();
    const startDateTime = new Date(`${quiz.startDate.toISOString().split('T')[0]}T${quiz.startTime}`);
    const endDateTime = new Date(`${quiz.startDate.toISOString().split('T')[0]}T${quiz.endTime}`);

    if (now < startDateTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz has not started yet'
      });
    }

    if (now > endDateTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz time has ended'
      });
    }

    // Check if already started or submitted
    if (studentQuiz.status !== 'assigned') {
      return res.status(400).json({
        status: 'error',
        message: 'Quiz has already been started or submitted'
      });
    }

    // Start the quiz
    studentQuiz.status = 'in_progress';
    studentQuiz.startTime = new Date();

    await quiz.save();

    res.status(200).json({
      status: 'success',
      message: 'Quiz started successfully',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          startTime: studentQuiz.startTime,
          duration: quiz.duration,
          maxScore: quiz.maxScore
        }
      }
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error starting quiz'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAssignments,
  getQuizzes,
  getMaterials,
  getVideos,
  submitAssignment,
  submitQuiz,
  startQuiz
}; 