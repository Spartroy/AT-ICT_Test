const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const path = require('path');

// @desc    Create new quiz (Teacher only)
// @route   POST /api/quizzes
// @access  Private (Teacher)
const createQuiz = async (req, res) => {
  try {
    console.log('📝 Received quiz creation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      type,
      section,
      startDate,
      startTime,
      duration,
      maxScore,
      difficulty,
      instructions,
      assignToAll,
      selectedStudents
    } = req.body;

    // Calculate end time based on start time + duration
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(duration) * 60 * 1000));
    const endTime = endDateTime.toTimeString().slice(0, 5); // Format as HH:MM
    
    console.log('⏰ Time calculations:', {
      startDate,
      startTime,
      duration,
      calculatedEndTime: endTime,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    });

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

    // Create quiz
    const quiz = await Quiz.create({
      title,
      description,
      type,
      section,
      startDate: new Date(startDate),
      startTime,
      endTime,
      duration: parseInt(duration),
      maxScore: parseInt(maxScore),
      difficulty,
      instructions,
      attachments,
      createdBy: req.user.id
    });

    // Handle student assignment
    if (assignToAll === true || assignToAll === 'true') {
      // Assign to all approved students
      const students = await User.find({ 
        role: 'student', 
        registrationStatus: 'approved',
        isActive: true 
      }).select('_id');

      quiz.assignedTo = students.map(student => ({
        student: student._id,
        assignedDate: new Date(),
        status: 'assigned'
      }));
    } else if (selectedStudents) {
      // Assign to selected students
      let studentIds = selectedStudents;
      
      // Parse if it's a JSON string (from FormData)
      if (typeof selectedStudents === 'string') {
        try {
          studentIds = JSON.parse(selectedStudents);
        } catch (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid student selection format'
          });
        }
      }

      // Validate that studentIds is an array
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'At least one student must be selected'
        });
      }

      // Verify all selected students exist and are active
      const validStudents = await User.find({
        _id: { $in: studentIds },
        role: 'student',
        registrationStatus: 'approved',
        isActive: true
      }).select('_id');

      if (validStudents.length !== studentIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Some selected students are not valid or active'
        });
      }

      quiz.assignedTo = validStudents.map(student => ({
        student: student._id,
        assignedDate: new Date(),
        status: 'assigned'
      }));
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Please select students to assign this quiz to'
      });
    }

    await quiz.save();
    await quiz.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Quiz created successfully',
      data: {
        quiz
      }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating quiz'
    });
  }
};

// @desc    Get all quizzes (Teacher only)
// @route   GET /api/quizzes
// @access  Private (Teacher)
const getQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, section, difficulty, search, status } = req.query;

    // Build query
    let query = { createdBy: req.user.id };
    
    if (type) query.type = type;
    if (section) query.section = section;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.isActive = status === 'active';
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructions: { $regex: search, $options: 'i' } }
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quiz.countDocuments(query);

    // Add completion stats to each quiz
    const quizzesWithStats = quizzes.map(quiz => {
      const stats = quiz.getCompletionStats();
      const avgScore = quiz.getAverageScore();
      
      return {
        ...quiz.toObject(),
        stats,
        averageScore: avgScore
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        quizzes: quizzesWithStats,
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
    console.error('Get quizzes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving quizzes'
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private (Teacher)
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this quiz'
      });
    }

    const stats = quiz.getCompletionStats();
    const avgScore = quiz.getAverageScore();

    res.status(200).json({
      status: 'success',
      data: {
        quiz: {
          ...quiz.toObject(),
          stats,
          averageScore: avgScore
        }
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving quiz'
    });
  }
};

// @desc    Update quiz (Teacher only)
// @route   PUT /api/quizzes/:id
// @access  Private (Teacher)
const updateQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      section,
      startDate,
      startTime,
      endTime,
      duration,
      maxScore,
      difficulty,
      instructions,
      isActive
    } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this quiz'
      });
    }

    // Update quiz
    Object.assign(quiz, {
      title,
      description,
      type,
      section,
      startDate: startDate ? new Date(startDate) : quiz.startDate,
      startTime,
      endTime,
      duration: duration ? parseInt(duration) : quiz.duration,
      maxScore: maxScore ? parseInt(maxScore) : quiz.maxScore,
      difficulty,
      instructions,
      isActive
    });

    await quiz.save();
    await quiz.populate('createdBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Quiz updated successfully',
      data: {
        quiz
      }
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating quiz'
    });
  }
};

// @desc    Delete quiz (Teacher only)
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this quiz'
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting quiz'
    });
  }
};

// @desc    Assign quiz to specific students
// @route   POST /api/quizzes/:id/assign
// @access  Private (Teacher)
const assignToStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Student IDs are required'
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to assign this quiz'
      });
    }

    // Add new students to quiz
    const newAssignments = studentIds
      .filter(studentId => !quiz.assignedTo.some(a => a.student.toString() === studentId))
      .map(studentId => ({
        student: studentId,
        assignedDate: new Date(),
        status: 'assigned'
      }));

    quiz.assignedTo.push(...newAssignments);
    await quiz.save();

    res.status(200).json({
      status: 'success',
      message: `Quiz assigned to ${newAssignments.length} students`,
      data: {
        assignedCount: newAssignments.length
      }
    });
  } catch (error) {
    console.error('Assign to students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error assigning quiz'
    });
  }
};

// @desc    Download quiz submission file
// @route   GET /api/quizzes/:id/submissions/:studentId/download/:filename
// @access  Private (Teacher)
const downloadSubmissionFile = async (req, res) => {
  try {
    const { id: quizId, studentId, filename } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this quiz'
      });
    }

    // Find the student's submission
    const studentSubmission = quiz.assignedTo.find(
      a => a.student.toString() === studentId
    );

    if (!studentSubmission || !studentSubmission.submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Student submission not found'
      });
    }

    // Find the specific file
    const file = studentSubmission.submission.attachments.find(
      att => att.filename === filename
    );

    if (!file) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    const filePath = path.join(__dirname, '..', file.path);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download submission file error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error downloading file'
    });
  }
};

// @desc    Get quiz submissions for teacher
// @route   GET /api/quizzes/:id/submissions
// @access  Private (Teacher)
const getQuizSubmissions = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId');

    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this quiz'
      });
    }

    // Filter and organize submission data
    const submissions = quiz.assignedTo.map(studentQuiz => ({
      student: studentQuiz.student,
      assignedDate: studentQuiz.assignedDate,
      status: studentQuiz.status,
      submissionDate: studentQuiz.submissionDate,
      isLate: studentQuiz.isLate,
      score: studentQuiz.score,
      feedback: studentQuiz.feedback,
      gradedDate: studentQuiz.gradedDate,
      timeSpent: studentQuiz.timeSpent,
      submission: studentQuiz.submission ? {
        text: studentQuiz.submission.text,
        attachments: studentQuiz.submission.attachments || []
      } : null
    }));

    const stats = quiz.getCompletionStats();

    res.status(200).json({
      status: 'success',
      data: {
        quiz: {
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
          createdBy: quiz.createdBy
        },
        submissions,
        stats
      }
    });
  } catch (error) {
    console.error('Get quiz submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving quiz submissions'
    });
  }
};

// @desc    Grade quiz submission
// @route   PUT /api/teacher/quizzes/:id/students/:studentId
// @access  Private (Teacher)
const gradeQuiz = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const quizId = req.params.id;
    const studentId = req.params.studentId;

    // Validate input
    if (score === undefined || score === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Score is required'
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to grade this quiz'
      });
    }

    // Find the student's quiz
    const studentQuiz = quiz.assignedTo.find(
      a => a.student.toString() === studentId
    );

    if (!studentQuiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Student is not assigned to this quiz'
      });
    }

    // Validate score is within range
    if (score < 0 || score > quiz.maxScore) {
      return res.status(400).json({
        status: 'error',
        message: `Score must be between 0 and ${quiz.maxScore}`
      });
    }

    // Update the grade
    studentQuiz.score = parseInt(score);
    studentQuiz.feedback = feedback || '';
    studentQuiz.status = 'graded';
    studentQuiz.gradedDate = new Date();

    await quiz.save();

    // Return the updated quiz with populated data
    await quiz.populate('assignedTo.student', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      message: 'Quiz graded successfully',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          studentQuiz: {
            student: studentQuiz.student,
            score: studentQuiz.score,
            feedback: studentQuiz.feedback,
            status: studentQuiz.status,
            gradedDate: studentQuiz.gradedDate
          }
        }
      }
    });
  } catch (error) {
    console.error('Grade quiz error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error grading quiz'
    });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  assignToStudents,
  downloadSubmissionFile,
  getQuizSubmissions,
  gradeQuiz
}; 