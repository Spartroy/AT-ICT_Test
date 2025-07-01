const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const path = require('path');

// @desc    Create new assignment (Teacher only)
// @route   POST /api/assignments
// @access  Private (Teacher)
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      dueDate,
      maxScore,
      difficulty,
      instructions,
      assignToAll,
      selectedStudents
    } = req.body;

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

    // Create assignment
    const assignment = await Assignment.create({
      title,
      description,
      type,
      section,
      dueDate: new Date(dueDate),
      maxScore: parseInt(maxScore),
      difficulty,
      instructions,
      attachments,
      createdBy: req.user.id,
      publishDate: new Date()
    });

    // Handle student assignment
    if (assignToAll === true || assignToAll === 'true') {
      // Assign to all approved students
      const students = await User.find({ 
        role: 'student', 
        registrationStatus: 'approved',
        isActive: true 
      }).select('_id');

      assignment.assignedTo = students.map(student => ({
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

      assignment.assignedTo = validStudents.map(student => ({
        student: student._id,
        assignedDate: new Date(),
        status: 'assigned'
      }));
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Please select students to assign this assignment to'
      });
    }

    await assignment.save();

    await assignment.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Assignment created successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating assignment'
    });
  }
};

// @desc    Get all assignments (Teacher only)
// @route   GET /api/assignments
// @access  Private (Teacher)
const getAssignments = async (req, res) => {
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

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Assignment.countDocuments(query);

    // Add completion stats to each assignment
    const assignmentsWithStats = assignments.map(assignment => {
      const stats = assignment.getCompletionStats();
      const avgScore = assignment.getAverageScore();
      
      return {
        ...assignment.toObject(),
        stats,
        averageScore: avgScore
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        assignments: assignmentsWithStats,
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
    console.error('Get assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving assignments'
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private (Teacher)
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId');

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this assignment'
      });
    }

    const stats = assignment.getCompletionStats();
    const avgScore = assignment.getAverageScore();

    res.status(200).json({
      status: 'success',
      data: {
        assignment: {
          ...assignment.toObject(),
          stats,
          averageScore: avgScore
        }
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving assignment'
    });
  }
};

// @desc    Update assignment (Teacher only)
// @route   PUT /api/assignments/:id
// @access  Private (Teacher)
const updateAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      section,
      dueDate,
      maxScore,
      difficulty,
      instructions,
      isActive
    } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this assignment'
      });
    }

    // Update assignment
    Object.assign(assignment, {
      title,
      description,
      type,
      section,
      dueDate: dueDate ? new Date(dueDate) : assignment.dueDate,
      maxScore: maxScore ? parseInt(maxScore) : assignment.maxScore,
      difficulty,
      instructions,
      isActive
    });

    await assignment.save();
    await assignment.populate('createdBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Assignment updated successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating assignment'
    });
  }
};

// @desc    Delete assignment (Teacher only)
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this assignment'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting assignment'
    });
  }
};

// @desc    Assign assignment to specific students
// @route   POST /api/assignments/:id/assign
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

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to assign this assignment'
      });
    }

    // Add new students to assignment
    const newAssignments = studentIds
      .filter(studentId => !assignment.assignedTo.some(a => a.student.toString() === studentId))
      .map(studentId => ({
        student: studentId,
        assignedDate: new Date(),
        status: 'assigned'
      }));

    assignment.assignedTo.push(...newAssignments);
    await assignment.save();

    res.status(200).json({
      status: 'success',
      message: `Assignment assigned to ${newAssignments.length} students`,
      data: {
        assignedCount: newAssignments.length
      }
    });
  } catch (error) {
    console.error('Assign to students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error assigning assignment'
    });
  }
};

// @desc    Download student submission file
// @route   GET /api/assignments/:id/submissions/:studentId/download/:filename
// @access  Private (Teacher)
const downloadSubmissionFile = async (req, res) => {
  try {
    const { id: assignmentId, studentId, filename } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this assignment'
      });
    }

    // Find the student's submission
    const studentSubmission = assignment.assignedTo.find(
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

// @desc    Get assignment submissions for teacher
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher)
const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo.student', 'firstName lastName email studentInfo.studentId');

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this assignment'
      });
    }

    // Filter and organize submission data
    const submissions = assignment.assignedTo.map(studentAssignment => ({
      student: studentAssignment.student,
      assignedDate: studentAssignment.assignedDate,
      status: studentAssignment.status,
      submissionDate: studentAssignment.submissionDate,
      isLate: studentAssignment.isLate,
      score: studentAssignment.score,
      feedback: studentAssignment.feedback,
      gradedDate: studentAssignment.gradedDate,
      submission: studentAssignment.submission ? {
        text: studentAssignment.submission.text,
        attachments: studentAssignment.submission.attachments || []
      } : null
    }));

    const stats = assignment.getCompletionStats();

    res.status(200).json({
      status: 'success',
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          type: assignment.type,
          section: assignment.section,
          dueDate: assignment.dueDate,
          maxScore: assignment.maxScore,
          difficulty: assignment.difficulty,
          instructions: assignment.instructions,
          createdBy: assignment.createdBy
        },
        submissions,
        stats
      }
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving assignment submissions'
    });
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/teacher/assignments/:id/students/:studentId
// @access  Private (Teacher)
const gradeAssignment = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const assignmentId = req.params.id;
    const studentId = req.params.studentId;

    // Validate input
    if (score === undefined || score === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Score is required'
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check if user created this assignment
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to grade this assignment'
      });
    }

    // Find the student's assignment
    const studentAssignment = assignment.assignedTo.find(
      a => a.student.toString() === studentId
    );

    if (!studentAssignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Student is not assigned to this assignment'
      });
    }

    // Validate score is within range
    if (score < 0 || score > assignment.maxScore) {
      return res.status(400).json({
        status: 'error',
        message: `Score must be between 0 and ${assignment.maxScore}`
      });
    }

    // Update the grade
    studentAssignment.score = parseInt(score);
    studentAssignment.feedback = feedback || '';
    studentAssignment.status = 'graded';
    studentAssignment.gradedDate = new Date();

    await assignment.save();

    // Return the updated assignment with populated data
    await assignment.populate('assignedTo.student', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      message: 'Assignment graded successfully',
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          studentAssignment: {
            student: studentAssignment.student,
            score: studentAssignment.score,
            feedback: studentAssignment.feedback,
            status: studentAssignment.status,
            gradedDate: studentAssignment.gradedDate
          }
        }
      }
    });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error grading assignment'
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  assignToStudents,
  downloadSubmissionFile,
  getAssignmentSubmissions,
  gradeAssignment
}; 