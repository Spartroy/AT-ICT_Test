const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

/**
 * Get all active sessions for the current user
 * @route   GET /api/sessions
 * @access  Private
 */
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await req.user.getActiveSessions();
    
    res.status(200).json({
      status: 'success',
      data: {
        sessions: sessions.map(session => ({
          id: session._id,
          deviceName: session.deviceName,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          location: session.location,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching sessions'
    });
  }
};

/**
 * Deactivate a specific session
 * @route   DELETE /api/sessions/:sessionId
 * @access  Private
 */
const deactivateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const success = await req.user.deactivateSession(sessionId);
    
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found or access denied'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Session deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deactivating session'
    });
  }
};

/**
 * Deactivate all sessions except current one
 * @route   DELETE /api/sessions/all
 * @access  Private
 */
const deactivateAllOtherSessions = async (req, res) => {
  try {
    // Get all active sessions
    const sessions = await req.user.getActiveSessions();
    
    // Deactivate all sessions except the current one
    const sessionsToDeactivate = sessions.filter(
      session => session._id.toString() !== req.session._id.toString()
    );
    
    for (const session of sessionsToDeactivate) {
      await session.deactivate();
    }
    
    res.status(200).json({
      status: 'success',
      message: `${sessionsToDeactivate.length} other sessions deactivated successfully`
    });
  } catch (error) {
    console.error('Deactivate all sessions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deactivating sessions'
    });
  }
};

/**
 * Get session statistics
 * @route   GET /api/sessions/stats
 * @access  Private
 */
const getSessionStats = async (req, res) => {
  try {
    const activeCount = await req.user.getActiveSessionCount();
    
    // Determine max sessions based on user role
    let maxSessions;
    if (req.user.role === 'teacher') {
      maxSessions = 999; // Unlimited for teachers (practical limit)
    } else {
      maxSessions = 1; // Only one session for students and parents
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        activeSessions: activeCount,
        maxSessions,
        remainingSessions: Math.max(0, maxSessions - activeCount),
        userRole: req.user.role
      }
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching session statistics'
    });
  }
};

module.exports = {
  getActiveSessions,
  deactivateSession,
  deactivateAllOtherSessions,
  getSessionStats
}; 