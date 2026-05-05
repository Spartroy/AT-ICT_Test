const User = require('../models/User');
const HallOfFameEntry = require('../models/HallOfFameEntry');

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
    const entries = await HallOfFameEntry.find({})
      .select('name year createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const hallOfFame = entries.map((entry, idx) => ({
      rank: idx + 1,
      _id: entry._id,
      name: entry.name,
      year: entry.year,
      createdAt: entry.createdAt
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

// @desc    Add Hall of Fame student
// @route   POST /api/teacher/hall-of-fame
// @access  Private (Teacher)
const addHallOfFameStudent = async (req, res) => {
  try {
    const { name, year } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Student name is required'
      });
    }

    if (!year || !year.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Year is required'
      });
    }

    const entry = await HallOfFameEntry.create({
      name: name.trim(),
      year: year.trim(),
      createdBy: req.user.id
    });

    return res.status(201).json({
      status: 'success',
      message: 'Student added to Hall of Fame successfully',
      data: {
        entry
      }
    });
  } catch (error) {
    console.error('Add hall of fame student error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error adding hall of fame student'
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

module.exports = { getLeaderboard, getHallOfFame, addHallOfFameStudent, resetSessionPoints };
