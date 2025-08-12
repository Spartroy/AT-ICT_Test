const mongoose = require('mongoose');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const UserAttendance = require('../models/UserAttendance');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const User = require('../models/User');
const crypto = require('crypto');

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

    // Map parent accounts linked to these students
    const studentIds = students.map(s => s._id);
    const parents = await User.find({
      role: 'parent',
      'parentInfo.children.studentId': { $in: studentIds }
    }).select('email parentInfo.children.studentId');
    const studentIdToParent = new Map();
    parents.forEach(p => {
      (p.parentInfo?.children || []).forEach(ch => {
        const sid = String(ch.studentId);
        if (!studentIdToParent.has(sid)) {
          studentIdToParent.set(sid, p.email);
        }
      });
    });

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
      avatar: student.avatar,
      hasParent: studentIdToParent.has(String(student._id)),
      parentEmail: studentIdToParent.get(String(student._id)) || null
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
  updateQuizFeedback,
  // Attendance summary for a student
  getStudentAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      // Ensure student exists
      const student = await User.findById(id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }
      const todayStart = new Date(new Date().toDateString());
      const records = await UserAttendance.find({ user: id }).sort({ date: -1, createdAt: -1 }).limit(200);
      const summary = {
        total: records.length,
        present: records.filter(r => r.status === 'present').length,
        latestDate: records[0]?.date || null
      };
      return res.status(200).json({ status: 'success', data: { summary, records } });
    } catch (e) {
      console.error('Get student attendance error:', e);
      return res.status(500).json({ status: 'error', message: 'Server error retrieving attendance' });
    }
  },
  /**
   * Create a parent account for a given student and return credentials
   */
  createParentAccount: async (req, res) => {
    try {
      const studentId = req.params.id;
      // Accept both empty and JSON bodies; no required fields in body

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }

      // Avoid duplicate parent for the same student
      const existingParent = await User.findOne({
        role: 'parent',
        'parentInfo.children.studentId': student._id
      });
      if (existingParent) {
        return res.status(409).json({
          status: 'error',
          message: 'A parent account is already linked to this student',
          data: { email: existingParent.email }
        });
      }

      // Format email as Last_FirstParent@atict.com
      const formatName = (s) => (s || '').trim().replace(/\s+/g, ' ').split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      const first = formatName(student.firstName).split(' ')[0] || 'Student';
      const last = formatName(student.lastName).split(' ')[0] || 'Parent';
      const desiredEmailDisplay = `${last}_${first}Parent@atict.com`;
      const baseLocal = `${last}_${first}Parent`;
      const domain = 'atict.com';

      // Ensure unique email, try suffixes if needed
      let emailToSave = `${baseLocal}@${domain}`;
      let attempt = 0;
      // Because schema lowercases, comparison should be lowercase
      // Loop with reasonable cap
      while (attempt < 5) {
        const exists = await User.findOne({ email: emailToSave.toLowerCase() });
        if (!exists) break;
        attempt += 1;
        emailToSave = `${baseLocal}${attempt}@${domain}`;
      }

      // Generate strong password (16 chars, mixed)
      const genPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
        let pwd = '';
        for (let i = 0; i < 16; i += 1) {
          const idx = crypto.randomInt(0, chars.length);
          pwd += chars[idx];
        }
        // Ensure at least one of each class
        if (!/[A-Z]/.test(pwd)) pwd = 'A' + pwd.slice(1);
        if (!/[a-z]/.test(pwd)) pwd = pwd.slice(0, 1) + 'a' + pwd.slice(2);
        if (!/\d/.test(pwd)) pwd = pwd.slice(0, 2) + '5' + pwd.slice(3);
        if (!/[!@#$%^&*()\-_=+\[\]{}]/.test(pwd)) pwd = pwd.slice(0, 3) + '!' + pwd.slice(4);
        return pwd;
      };
      const rawPassword = genPassword();

      // Create parent user (primary link via User.parentInfo)
      const parentUser = await User.create({
        firstName: last, // e.g., Tarek
        lastName: `${first} Parent`, // e.g., Omar Parent
        email: emailToSave,
        password: rawPassword,
        role: 'parent',
        contactNumber: (student.studentInfo?.parentContactNumber && /^[\+]?[1-9][\d]{0,15}$/.test(String(student.studentInfo.parentContactNumber).replace(/[\s\-\(\)]/g, ''))
          ? student.studentInfo.parentContactNumber
          : '1000000000'),
        parentInfo: {
          children: [
            {
              studentId: student._id,
              relationship: 'guardian',
              isPrimary: true
            }
          ]
        },
        registrationStatus: 'approved',
        isActive: true
      });

      // Secondary link for legacy Parent/Student models (best-effort)
      try {
        const studentDoc = await Student.findOne({ user: student._id });
        if (studentDoc) {
          // Create Parent document if not exists for this parent user
          const ParentModel = require('../models/Parent');
          let parentDoc = await ParentModel.findOne({ user: parentUser._id });
          if (!parentDoc) {
            parentDoc = await ParentModel.create({
              user: parentUser._id,
              children: [{ student: studentDoc._id, relationship: 'guardian', isPrimary: true }],
              contactNumber: parentUser.contactNumber || '0000000000',
              isActive: true
            });
          } else {
            // Ensure child exists on parent doc
            const exists = parentDoc.children.some(c => String(c.student) === String(studentDoc._id));
            if (!exists) {
              parentDoc.children.push({ student: studentDoc._id, relationship: 'guardian', isPrimary: true });
              // make only one primary
              parentDoc.children = parentDoc.children.map((c, idx) => ({ ...c.toObject?.() || c, isPrimary: idx === parentDoc.children.length - 1 }));
              await parentDoc.save();
            }
          }
          // Link back on student document
          if (!studentDoc.parent) {
            studentDoc.parent = parentDoc._id;
            await studentDoc.save();
          }
        }
      } catch (linkErr) {
        console.warn('Non-fatal: Legacy Parent/Student link setup failed:', linkErr.message);
      }

      // Return credentials for display
      return res.status(201).json({
        status: 'success',
        message: 'Parent account created',
        data: {
          parent: {
            id: parentUser._id,
            firstName: parentUser.firstName,
            lastName: parentUser.lastName,
            email: parentUser.email,
            savedEmail: parentUser.email
          },
          credentials: {
            email: parentUser.email,
            password: rawPassword
          }
        }
      });
    } catch (error) {
      console.error('Create parent account error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ status: 'error', message: 'Server error creating parent account' });
      }
      return; // headers already sent
    }
  }
}; 