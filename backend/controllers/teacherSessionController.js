const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

/**
 * Get all student sessions for teacher monitoring
 * @route   GET /api/teacher/sessions/students
 * @access  Private (Teacher only)
 */
const getStudentSessions = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only teachers can view student sessions.'
      });
    }

    // Get all students with their active sessions
    const students = await User.find({ 
      role: 'student',
      isActive: true 
    }).select('firstName lastName email registrationStatus lastLogin');

    const studentsWithSessions = [];

    for (const student of students) {
      const activeSessions = await student.getActiveSessions();
      const sessionCount = await student.getActiveSessionCount();
      
      studentsWithSessions.push({
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        registrationStatus: student.registrationStatus,
        lastLogin: student.lastLogin,
        activeSessionCount: sessionCount,
        sessions: activeSessions.map(session => ({
          id: session._id,
          deviceName: session.deviceName,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          location: session.location,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt
        }))
      });
    }

    // Sort by last login (most recent first)
    studentsWithSessions.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

    res.status(200).json({
      status: 'success',
      data: {
        students: studentsWithSessions,
        totalStudents: studentsWithSessions.length,
        studentsWithActiveSessions: studentsWithSessions.filter(s => s.activeSessionCount > 0).length
      }
    });
  } catch (error) {
    console.error('Get student sessions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching student sessions'
    });
  }
};

/**
 * Get session statistics for all students
 * @route   GET /api/teacher/sessions/stats
 * @access  Private (Teacher only)
 */
const getStudentSessionStats = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only teachers can view session statistics.'
      });
    }

    // Get all students
    const students = await User.find({ 
      role: 'student',
      isActive: true 
    });

    let totalActiveSessions = 0;
    let studentsWithSessions = 0;
    let studentsWithoutSessions = 0;

    for (const student of students) {
      const sessionCount = await student.getActiveSessionCount();
      totalActiveSessions += sessionCount;
      
      if (sessionCount > 0) {
        studentsWithSessions++;
      } else {
        studentsWithoutSessions++;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalStudents: students.length,
        totalActiveSessions,
        studentsWithSessions,
        studentsWithoutSessions,
        averageSessionsPerStudent: students.length > 0 ? (totalActiveSessions / students.length).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get student session stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching student session statistics'
    });
  }
};

/**
 * Deactivate a specific student session (teacher can force logout students)
 * @route   DELETE /api/teacher/sessions/students/:studentId/:sessionId
 * @access  Private (Teacher only)
 */
const deactivateStudentSession = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only teachers can deactivate student sessions.'
      });
    }

    const { studentId, sessionId } = req.params;

    // Find the student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Deactivate the session
    const success = await student.deactivateSession(sessionId);
    
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or access denied'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Student session deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate student session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deactivating student session'
    });
  }
};

/**
 * Deactivate all sessions for a specific student
 * @route   DELETE /api/teacher/sessions/students/:studentId/all
 * @access  Private (Teacher only)
 */
const deactivateAllStudentSessions = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only teachers can deactivate student sessions.'
      });
    }

    const { studentId } = req.params;

    // Find the student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Deactivate all sessions
    const deactivatedCount = await student.deactivateAllSessions();
    
    res.status(200).json({
      status: 'success',
      message: `${deactivatedCount} student sessions deactivated successfully`
    });
  } catch (error) {
    console.error('Deactivate all student sessions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deactivating student sessions'
    });
  }
};

module.exports = {
  getStudentSessions,
  getStudentSessionStats,
  deactivateStudentSession,
  deactivateAllStudentSessions
}; 