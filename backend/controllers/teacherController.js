const mongoose = require('mongoose');
const AppSettings = require('../models/AppSettings');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const User = require('../models/User');
const crypto = require('crypto');
const DeviceSession = require('../models/DeviceSession');
const { freeParentEmail } = require('../utils/parentAccount');
const { normalizePhone, isUsablePhone, escapeRegex } = require('../utils/phone');
const groupsSvc = require('../services/groups');
const { calculateAssignmentPoints, calculateQuizPoints, awardPoints } = require('../utils/pointsHelper');

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
    const { all, search, session, year, status, schoolType, royalClass, unclassified, group } = req.query;

    // Support for fetching all students without pagination (for dropdowns, selectors, etc.)
    const page = all === 'true' ? 1 : parseInt(req.query.page) || 1;
    // Capped so one request can't pull the whole collection
    const limit = Math.min(all === 'true' ? 2000 : parseInt(req.query.limit) || 10, all === 'true' ? 2000 : 500);
    const skip = (page - 1) * limit;

    let query = {
      role: 'student',
      isActive: true
    };

    // Filter by registration status if provided
    if (status) query.registrationStatus = status;

    // Filter by session and year from studentInfo
    if (session) query['studentInfo.session'] = session;
    if (year) query['studentInfo.year'] = year;

    // Filter by school type
    if (schoolType) query['studentInfo.schoolType'] = schoolType;

    // Filter by royal class (only for Royal College students)
    if (royalClass) query['studentInfo.royalClass'] = royalClass;

    // Filter by teaching group ('none' = students not in a group yet)
    if (group === 'none') query['studentInfo.group'] = { $in: [null, ''] };
    else if (group) query['studentInfo.group'] = String(group).toUpperCase();

    // Build search conditions
    let searchConditions = [];
    if (search) {
      const rx = { $regex: escapeRegex(String(search).slice(0, 100)), $options: 'i' };
      searchConditions.push(
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { 'studentInfo.studentId': rx },
        { 'studentInfo.school': rx }
      );
    }

    // Filter for unclassified students (no schoolType set)
    if (unclassified === 'true') {
      searchConditions.push(
        { 'studentInfo.schoolType': { $exists: false } },
        { 'studentInfo.schoolType': null },
        { 'studentInfo.schoolType': '' }
      );
    }

    // Apply search conditions if any
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
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
    const childCount = new Map(); // parent email -> number of linked students
    parents.forEach(p => {
      childCount.set(p.email, (p.parentInfo?.children || []).length);
      (p.parentInfo?.children || []).forEach(ch => {
        const sid = String(ch.studentId);
        if (!studentIdToParent.has(sid)) {
          studentIdToParent.set(sid, p.email);
        }
      });
    });

    // Students on this page that share a parent number are siblings of one parent
    const byNumber = new Map();
    students.forEach(st => {
      const n = isUsablePhone(st.studentInfo?.parentContactNumber) ? normalizePhone(st.studentInfo.parentContactNumber) : '';
      if (n) byNumber.set(n, [...(byNumber.get(n) || []), `${st.firstName} ${st.lastName}`]);
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
      schoolType: student.studentInfo?.schoolType || null,
      royalClass: student.studentInfo?.royalClass || null,
      group: student.studentInfo?.group || null,
      registrationStatus: student.registrationStatus,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      enrolledDate: student.studentInfo?.enrolledDate || student.createdAt,
      overallProgress: student.studentInfo?.overallProgress || 0,
      currentGrade: student.studentInfo?.currentGrade || 'N/A',
      avatar: student.avatar,
      hasParent: studentIdToParent.has(String(student._id)),
      parentEmail: studentIdToParent.get(String(student._id)) || null,
      parentChildren: childCount.get(studentIdToParent.get(String(student._id))) || 0,
      // Hidden from assistants unless the teacher grants 'parentNumbers'
      parentNumber: student.studentInfo?.parentContactNumber || '',
      siblings: (byNumber.get(normalizePhone(student.studentInfo?.parentContactNumber)) || []).filter(n => n !== `${student.firstName} ${student.lastName}`)
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

    // Get parent information
    let parentInfo = null;
    try {
      const parent = await User.findOne({
        role: 'parent',
        'parentInfo.children.studentId': student._id
      }).select('firstName lastName email contactNumber parentInfo.children.studentId');

      if (parent) {
        const kids = await childrenOf(parent);
        parentInfo = {
          hasAccount: true,
          name: `${parent.firstName} ${parent.lastName}`,
          email: parent.email,
          phone: parent.contactNumber || student.studentInfo?.parentContactNumber || 'N/A',
          // Every student this parent follows, this one included
          children: kids,
          otherChildren: kids.filter(k => String(k._id) !== String(student._id))
        };
      } else {
        // If no parent account exists, use info from student record
        parentInfo = {
          hasAccount: false,
          name: 'Not set up',
          email: 'No parent account',
          phone: student.studentInfo?.parentContactNumber || 'N/A',
          children: [],
          otherChildren: [],
          // Students with the same parent number whose parent account could be shared
          siblings: (await studentsSharingParentNumber(student)).map(x => ({ _id: x._id, name: `${x.firstName} ${x.lastName}` }))
        };
      }
    } catch (parentError) {
      console.log('Error fetching parent info:', parentError.message);
      parentInfo = {
        hasAccount: false,
        name: 'Not available',
        email: 'Not available',
        phone: student.studentInfo?.parentContactNumber || 'N/A'
      };
    }

    // Get attendance summary (placeholder for now - full attendance tracking not in scope)
    const attendanceSummary = {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0
    };

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
      schoolType: student.studentInfo?.schoolType || 'N/A',
      royalClass: student.studentInfo?.royalClass || 'N/A',
      nationality: student.studentInfo?.nationality || 'N/A',
      isRetaker: student.studentInfo?.isRetaker || false,
      techKnowledge: student.studentInfo?.techKnowledge || 'N/A',
      otherSubjects: student.studentInfo?.otherSubjects || 'N/A',
      parentContactNumber: student.studentInfo?.parentContactNumber || 'N/A',
      currentGrade: student.studentInfo?.currentGrade || 'N/A',
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
        parentInfo,
        attendanceSummary,
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
      overallProgress,
      isActive,
      notes,
      group,
      year,
      session,
      royalClass
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
    if (overallProgress !== undefined) {
      student.studentInfo.overallProgress = overallProgress;
    }
    if (isActive !== undefined) {
      student.isActive = isActive;
      student.studentInfo.isActive = isActive;
    }

    // Where the student sits: year / exam session (centre students), class (Royal College) and teaching group
    const settings = (year !== undefined || session !== undefined || royalClass !== undefined) ? await AppSettings.getGlobal() : null;
    if (year !== undefined) {
      if (![10, 11, 12].includes(Number(year))) return res.status(400).json({ status: 'error', message: 'Year must be 10, 11 or 12' });
      student.studentInfo.year = Number(year);
    }
    if (session !== undefined) {
      const code = String(session).trim().toUpperCase();
      if (!(settings.examSessions || []).some(x => String(x.code).toUpperCase() === code)) {
        return res.status(400).json({ status: 'error', message: `Unknown exam session: ${code}` });
      }
      student.studentInfo.session = code;
    }
    if (royalClass !== undefined) {
      if (!(settings.royalClasses || []).includes(royalClass)) return res.status(400).json({ status: 'error', message: `Unknown class: ${royalClass}` });
      student.studentInfo.royalClass = royalClass;
    }
    let newGroup;
    if (group !== undefined) {
      newGroup = group ? String(group).trim().toUpperCase() : null;
      if (newGroup) {
        const config = await groupsSvc.getConfig();
        if (!config.groups.some(g => g.code === newGroup)) return res.status(400).json({ status: 'error', message: `Unknown group: ${newGroup}` });
      }
      student.studentInfo.group = newGroup;
    }

    await student.save();
    // Moving into a group also hands the student that group's upcoming homework and quizzes
    if (newGroup && student.isActive) await groupsSvc.addManyToGroupContent([student._id], newGroup);

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
          group: student.studentInfo?.group || null,
          year: student.studentInfo?.year,
          session: student.studentInfo?.session,
          royalClass: student.studentInfo?.royalClass,
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

    // Award points to the student
    try {
      const studentEntry = assignment.assignedTo[studentAssignmentIndex];
      const pts = calculateAssignmentPoints(
        score,
        assignment.maxScore,
        studentEntry.submissionDate || new Date(),
        assignment.dueDate
      );

      await awardPoints(studentId, {
        source: 'assignment',
        sourceId: assignment._id,
        title: assignment.title,
        basePoints: pts.base,
        bonusPoints: pts.bonusPoints,
        total: pts.total,
        onTime: pts.onTime
      });

      // Notify the student via Socket.IO if available
      if (req.io) {
        req.io.to(`user_${studentId}`).emit('points_awarded', {
          type: 'assignment',
          title: assignment.title,
          basePoints: pts.base,
          bonusPoints: pts.bonusPoints,
          total: pts.total
        });
      }
    } catch (pointsErr) {
      console.warn('Non-fatal: points award failed for assignment:', pointsErr.message);
    }

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

    // If a score is provided in the body, apply it and mark as graded
    const { score: quizScore } = req.body;
    if (quizScore !== undefined) {
      quiz.assignedTo[studentQuizIndex].score = quizScore;
      quiz.assignedTo[studentQuizIndex].status = 'graded';
      quiz.assignedTo[studentQuizIndex].gradedDate = new Date();
    }

    await quiz.save();

    // Award points if a score was provided or already exists
    const scoreToUse = quizScore !== undefined
      ? quizScore
      : quiz.assignedTo[studentQuizIndex].score;

    if (scoreToUse != null) {
      try {
        const pts = calculateQuizPoints(scoreToUse, quiz.maxScore);

        await awardPoints(studentId, {
          source: 'quiz',
          sourceId: quiz._id,
          title: quiz.title,
          basePoints: pts.base,
          bonusPoints: 0,
          total: pts.total
        });

        // Notify the student via Socket.IO if available
        if (req.io) {
          req.io.to(`user_${studentId}`).emit('points_awarded', {
            type: 'quiz',
            title: quiz.title,
            basePoints: pts.base,
            bonusPoints: 0,
            total: pts.total
          });
        }
      } catch (pointsErr) {
        console.warn('Non-fatal: points award failed for quiz:', pointsErr.message);
      }
    }

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

// @desc    Delete student
// @route   DELETE /api/teacher/students/:id
// @access  Private (Teacher)
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Delete related data
    await Promise.all([
      // Delete assignments where student is assigned
      Assignment.updateMany(
        { 'assignedTo.student': student._id },
        { $pull: { assignedTo: { student: student._id } } }
      ),
      // Delete quizzes where student is assigned
      Quiz.updateMany(
        { 'assignedTo.student': student._id },
        { $pull: { assignedTo: { student: student._id } } }
      ),
      // Delete messages
      Message.deleteMany({
        $or: [
          { sender: student._id },
          { recipient: student._id }
        ]
      }),
      // Delete student from parent accounts
      User.updateMany(
        { 'parentInfo.children.studentId': student._id },
        { $pull: { 'parentInfo.children': { studentId: student._id } } }
      )
    ]);

    // Delete the student
    await student.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Student removed successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error removing student'
    });
  }
};

// @desc    Classify existing student to Royal College
// @route   POST /api/teacher/legacy-students
// @access  Private (Teacher)
const addLegacyStudent = async (req, res) => {
  try {
    const { studentId, royalClass } = req.body;

    // Validate required fields
    if (!studentId || !royalClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID and Royal class are required'
      });
    }

    // Validate royal class against the teacher-editable list
    const { royalClasses } = await AppSettings.getGlobal();
    if (!royalClasses.includes(String(royalClass).toUpperCase())) {
      return res.status(400).json({
        status: 'error',
        message: `Royal class must be one of: ${royalClasses.join(', ')}`
      });
    }

    // Find the existing student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Check if student is already classified
    if (student.studentInfo?.schoolType) {
      return res.status(400).json({
        status: 'error',
        message: 'Student is already classified'
      });
    }

    // Update student info to classify as Royal College
    student.studentInfo = {
      ...student.studentInfo,
      schoolType: 'royal',
      royalClass,
      royalNationality: student.studentInfo?.nationality || 'Unknown',
      school: 'The Royal College School',
      year: student.studentInfo?.year || '11',
      session: student.studentInfo?.session || 'NOV 25'
    };

    await student.save();

    res.status(200).json({
      status: 'success',
      message: 'Student classified successfully',
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          schoolType: 'royal',
          royalClass,
          studentId: student.studentInfo?.studentId
        }
      }
    });
  } catch (error) {
    console.error('Classify student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error classifying student'
    });
  }
};

/** The parent user linked to a student, if any. */
const findParentOf = (student) => User.findOne({ role: 'parent', 'parentInfo.children.studentId': student._id });

const genParentPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
  let pwd = '';
  for (let i = 0; i < 16; i += 1) pwd += chars[crypto.randomInt(0, chars.length)];
  // Ensure at least one of each class
  if (!/[A-Z]/.test(pwd)) pwd = 'A' + pwd.slice(1);
  if (!/[a-z]/.test(pwd)) pwd = pwd.slice(0, 1) + 'a' + pwd.slice(2);
  if (!/\d/.test(pwd)) pwd = pwd.slice(0, 2) + '5' + pwd.slice(3);
  if (!/[!@#$%^&*()\-_=+\[\]{}]/.test(pwd)) pwd = pwd.slice(0, 3) + '!' + pwd.slice(4);
  return pwd;
};

/** Other students whose parent number is the same person's (brothers and sisters share one). */
async function studentsSharingParentNumber(student) {
  const mine = student.studentInfo?.parentContactNumber;
  if (!isUsablePhone(mine)) return [];
  const want = normalizePhone(mine);
  const others = await User.find({ role: 'student', _id: { $ne: student._id }, 'studentInfo.parentContactNumber': { $exists: true, $ne: '' } })
    .select('firstName lastName studentInfo.parentContactNumber').lean();
  return others.filter(o => normalizePhone(o.studentInfo?.parentContactNumber) === want);
}

/** The existing parent account of a sibling (same parent number), if there is one. */
async function parentOfSibling(student) {
  const sibs = await studentsSharingParentNumber(student);
  if (!sibs.length) return null;
  return User.findOne({ role: 'parent', 'parentInfo.children.studentId': { $in: sibs.map(x => x._id) } });
}

/** Adds `student` to an existing parent account (User link plus the legacy Parent/Student documents, best effort). */
async function linkStudentToParent(student, parentUser) {
  const already = (parentUser.parentInfo?.children || []).some(c => String(c.studentId) === String(student._id));
  if (!already) {
    parentUser.parentInfo.children.push({ studentId: student._id, relationship: 'guardian', isPrimary: !(parentUser.parentInfo.children || []).length });
    await parentUser.save();
  }
  try {
    const studentDoc = await Student.findOne({ user: student._id });
    const ParentModel = require('../models/Parent');
    const parentDoc = await ParentModel.findOne({ user: parentUser._id });
    if (studentDoc && parentDoc) {
      if (!parentDoc.children.some(c => String(c.student) === String(studentDoc._id))) {
        parentDoc.children.push({ student: studentDoc._id, relationship: 'guardian', isPrimary: false });
        await parentDoc.save();
      }
      studentDoc.parent = parentDoc._id;
      await studentDoc.save();
    }
  } catch (linkErr) {
    console.warn('Non-fatal: Legacy Parent/Student link setup failed:', linkErr.message);
  }
  return parentUser;
}

const childrenOf = async (parentUser) => {
  const ids = (parentUser.parentInfo?.children || []).map(c => c.studentId);
  const kids = await User.find({ _id: { $in: ids } }).select('firstName lastName').lean();
  return kids.map(k => ({ _id: k._id, name: `${k.firstName} ${k.lastName}` }));
};

/** Creates the parent user (plus the legacy Parent/Student links, best effort) and returns it with the plain password. */
async function makeParentFor(student) {
  const first = String(student.firstName || '').trim().split(/\s+/)[0] || 'Student';
  const email = await freeParentEmail(first, async (e) => !!(await User.exists({ email: e.toLowerCase() })));
  const rawPassword = genParentPassword();
  const phone = String(student.studentInfo?.parentContactNumber || '').replace(/[\s\-\(\)]/g, '');

  const parentUser = await User.create({
    firstName: `${first}`,
    lastName: 'Parent',
    email,
    password: rawPassword,
    role: 'parent',
    contactNumber: /^[\+]?[1-9][\d]{0,15}$/.test(phone) ? student.studentInfo.parentContactNumber : '1000000000',
    parentInfo: { children: [{ studentId: student._id, relationship: 'guardian', isPrimary: true }] },
    registrationStatus: 'approved',
    isActive: true
  });

  try {
    const studentDoc = await Student.findOne({ user: student._id });
    if (studentDoc) {
      const ParentModel = require('../models/Parent');
      let parentDoc = await ParentModel.findOne({ user: parentUser._id });
      if (!parentDoc) {
        parentDoc = await ParentModel.create({
          user: parentUser._id,
          children: [{ student: studentDoc._id, relationship: 'guardian', isPrimary: true }],
          contactNumber: parentUser.contactNumber || '0000000000',
          isActive: true
        });
      }
      studentDoc.parent = parentDoc._id;
      await studentDoc.save();
    }
  } catch (linkErr) {
    console.warn('Non-fatal: Legacy Parent/Student link setup failed:', linkErr.message);
  }
  return { parentUser, rawPassword };
}

/**
 * Removes the parent's link to this student. A parent with no other children is deleted outright
 * (account, legacy Parent document, sessions); one who also has other children just loses this link.
 */
async function dropParentOf(student, parent) {
  const others = (parent.parentInfo?.children || []).filter(c => String(c.studentId) !== String(student._id));
  const ParentModel = require('../models/Parent');
  const studentDoc = await Student.findOne({ user: student._id });

  if (others.length) {
    parent.parentInfo.children = others;
    await parent.save();
    await ParentModel.updateOne({ user: parent._id }, { $pull: { children: { student: studentDoc?._id } } });
  } else {
    await ParentModel.deleteOne({ user: parent._id });
    await DeviceSession.deleteMany({ userId: parent._id }).catch(() => {});
    await parent.deleteOne();
  }
  if (studentDoc?.parent) {
    studentDoc.parent = undefined;
    await studentDoc.save();
  }
}

module.exports = {
  getDashboardStats,
  getStudents,
  getStudentDetails,
  updateStudent,
  updateAssignmentFeedback,
  updateQuizFeedback,
  deleteStudent,
  addLegacyStudent,
  /**
   * Create a parent account for a given student and return credentials
   */
  createParentAccount: async (req, res) => {
    try {
      const student = await User.findById(req.params.id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }

      const existingParent = await findParentOf(student);
      if (existingParent) {
        return res.status(409).json({
          status: 'error',
          message: 'A parent account is already linked to this student',
          data: { email: existingParent.email }
        });
      }

      // A sibling already has a parent account for this number: link to it instead of making a second login
      const sibParent = req.body?.forceNew ? null : await parentOfSibling(student);
      if (sibParent) {
        await linkStudentToParent(student, sibParent);
        return res.status(200).json({
          status: 'success',
          message: 'Linked to the existing parent account',
          data: { linked: true, parent: { id: sibParent._id, email: sibParent.email, children: await childrenOf(sibParent) } }
        });
      }

      const { parentUser, rawPassword } = await makeParentFor(student);
      return res.status(201).json({
        status: 'success',
        message: 'Parent account created',
        data: {
          parent: { id: parentUser._id, firstName: parentUser.firstName, lastName: parentUser.lastName, email: parentUser.email, savedEmail: parentUser.email },
          credentials: { email: parentUser.email, password: rawPassword }
        }
      });
    } catch (error) {
      console.error('Create parent account error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ status: 'error', message: 'Server error creating parent account' });
      }
      return; // headers already sent
    }
  },

  /**
   * Link a student to an existing parent account, so one parent can follow several children.
   */
  linkParentAccount: async (req, res) => {
    try {
      const student = await User.findById(req.params.id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }
      if (!mongoose.isValidObjectId(req.body?.parentId)) {
        return res.status(400).json({ status: 'error', message: 'Choose a parent account to link' });
      }
      const parent = await User.findOne({ _id: req.body.parentId, role: 'parent' });
      if (!parent) return res.status(404).json({ status: 'error', message: 'Parent account not found' });
      if (await findParentOf(student)) {
        return res.status(409).json({ status: 'error', message: 'This student already has a parent account. Delete it first to link a different one.' });
      }
      await linkStudentToParent(student, parent);
      return res.status(200).json({ status: 'success', message: 'Linked', data: { parent: { id: parent._id, email: parent.email, children: await childrenOf(parent) } } });
    } catch (error) {
      console.error('Link parent account error:', error);
      return res.status(500).json({ status: 'error', message: 'Server error linking parent account' });
    }
  },

  /**
   * Search parent accounts (for linking a student to one). Returns their children's names.
   */
  listParents: async (req, res) => {
    try {
      const q = { role: 'parent', isActive: true };
      const search = String(req.query.search || '').trim().slice(0, 100);
      if (search) q.email = { $regex: escapeRegex(search), $options: 'i' };
      const parents = await User.find(q).select('email parentInfo.children.studentId').sort({ createdAt: -1 }).limit(20);
      const out = [];
      for (const p of parents) out.push({ _id: p._id, email: p.email, children: await childrenOf(p) });
      return res.status(200).json({ status: 'success', data: { parents: out } });
    } catch (error) {
      console.error('List parents error:', error);
      return res.status(500).json({ status: 'error', message: 'Server error retrieving parents' });
    }
  },

  /**
   * Delete the parent account linked to a student (the student keeps everything else).
   */
  deleteParentAccount: async (req, res) => {
    try {
      const student = await User.findById(req.params.id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }
      const parent = await findParentOf(student);
      if (!parent) {
        return res.status(404).json({ status: 'error', message: 'This student has no parent account' });
      }
      await dropParentOf(student, parent);
      return res.status(200).json({ status: 'success', message: 'Parent account deleted' });
    } catch (error) {
      console.error('Delete parent account error:', error);
      return res.status(500).json({ status: 'error', message: 'Server error deleting parent account' });
    }
  },

  /**
   * Delete the current parent account (if any) and create a fresh one with new credentials.
   */
  recreateParentAccount: async (req, res) => {
    try {
      const student = await User.findById(req.params.id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }
      const parent = await findParentOf(student);
      if (parent) await dropParentOf(student, parent);

      const { parentUser, rawPassword } = await makeParentFor(student);
      return res.status(201).json({
        status: 'success',
        message: 'Parent account recreated',
        data: {
          parent: { id: parentUser._id, firstName: parentUser.firstName, lastName: parentUser.lastName, email: parentUser.email, savedEmail: parentUser.email },
          credentials: { email: parentUser.email, password: rawPassword }
        }
      });
    } catch (error) {
      console.error('Recreate parent account error:', error);
      return res.status(500).json({ status: 'error', message: 'Server error recreating parent account' });
    }
  }
};
