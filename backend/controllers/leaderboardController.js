const User = require('../models/User');

// @desc    Get top-3 students by currentSession points, filtered by session
// @route   GET /api/leaderboard?session=NOV+25
// @access  Private (student, teacher, parent)
const getLeaderboard = async (req, res) => {
  try {
    const { session } = req.query;

    const matchStage = {
      role: 'student',
      isActive: true,
      registrationStatus: 'approved'
    };

    if (session) {
      matchStage['studentInfo.session'] = session;
    }

    const top3 = await User.find(matchStage)
      .select('firstName lastName avatar studentInfo.points studentInfo.session')
      .sort({ 'studentInfo.points.currentSession': -1 })
      .limit(3)
      .lean();

    const leaderboard = top3.map((student, idx) => ({
      rank: idx + 1,
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      avatar: student.avatar || null,
      points: student.studentInfo?.points?.currentSession || 0,
      totalPoints: student.studentInfo?.points?.total || 0,
      sessionLabel: student.studentInfo?.points?.sessionLabel || student.studentInfo?.session || ''
    }));

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard,
        session: session || 'all',
        count: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving leaderboard'
    });
  }
};

// @desc    Get top students by all-time points (for Hall of Fame)
// @route   GET /api/leaderboard/hall-of-fame
// @access  Public
const getHallOfFame = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const topStudents = await User.find({
      role: 'student',
      isActive: true,
      registrationStatus: 'approved',
      'studentInfo.points.total': { $gt: 0 }
    })
      .select('firstName lastName avatar studentInfo.points studentInfo.session')
      .sort({ 'studentInfo.points.total': -1 })
      .limit(limit)
      .lean();

    const hallOfFame = topStudents.map((student, idx) => ({
      rank: idx + 1,
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName} ${student.lastName}`,
      avatar: student.avatar || null,
      totalPoints: student.studentInfo?.points?.total || 0,
      session: student.studentInfo?.session || ''
    }));

    res.status(200).json({
      status: 'success',
      data: {
        hallOfFame,
        count: hallOfFame.length
      }
    });
  } catch (error) {
    console.error('Get hall of fame error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving hall of fame'
    });
  }
};

// @desc    Reset currentSession points for all students and set new session label
// @route   POST /api/teacher/reset-session-points
// @access  Private (Teacher)
const resetSessionPoints = async (req, res) => {
  try {
    const { newSessionLabel } = req.body;

    if (!newSessionLabel || typeof newSessionLabel !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'newSessionLabel is required (e.g. "NOV 26")'
      });
    }

    const result = await User.updateMany(
      { role: 'student', isActive: true },
      {
        $set: {
          'studentInfo.points.currentSession': 0,
          'studentInfo.points.sessionLabel': newSessionLabel.trim()
        }
      }
    );

    res.status(200).json({
      status: 'success',
      message: `Session reset to "${newSessionLabel}" for ${result.modifiedCount} student(s)`,
      data: {
        newSessionLabel: newSessionLabel.trim(),
        studentsReset: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Reset session points error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error resetting session points'
    });
  }
};

module.exports = { getLeaderboard, getHallOfFame, resetSessionPoints };
