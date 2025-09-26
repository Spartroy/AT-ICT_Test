const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// @desc    Get the main schedule for teacher
// @route   GET /api/teacher/schedule
// @access  Private (Teacher)
const getSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.findOne({ isActive: true });
    
    // If no schedule exists, create a default one
    if (!schedule) {
      schedule = await Schedule.create({
        title: 'Class Schedule',
        schedule: Schedule.initializeWeekSchedule(),
        createdBy: req.user.id,
        lastUpdatedBy: req.user.id,
        isActive: true
      });
      
      await schedule.populate('createdBy', 'firstName lastName');
      await schedule.populate('lastUpdatedBy', 'firstName lastName');
    } else {
      // Fix createdBy if it's null or points to non-existent user
      if (!schedule.createdBy) {
        schedule.createdBy = req.user.id;
        await schedule.save();
      }

      // Safely populate fields with error handling
      try {
        await schedule.populate('createdBy', 'firstName lastName');
      } catch (populateError) {
        console.warn('Failed to populate createdBy, fixing reference:', populateError.message);
        schedule.createdBy = req.user.id;
        await schedule.save();
        await schedule.populate('createdBy', 'firstName lastName');
      }
      
      try {
        await schedule.populate('lastUpdatedBy', 'firstName lastName');
      } catch (populateError) {
        console.warn('Failed to populate lastUpdatedBy:', populateError.message);
        // Continue without lastUpdatedBy population if it fails
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving schedule'
    });
  }
};

// @desc    Create or update the main schedule
// @route   POST /api/teacher/schedule
// @access  Private (Teacher)
const createOrUpdateSchedule = async (req, res) => {
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
      schedule,
      notes
    } = req.body;

    // Check if schedule already exists
    let existingSchedule = await Schedule.findOne({ isActive: true });

    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.title = title || existingSchedule.title;
      existingSchedule.schedule = schedule || existingSchedule.schedule;
      existingSchedule.notes = notes || existingSchedule.notes;
      existingSchedule.lastUpdatedBy = req.user.id;

      // Fix createdBy if it's null or points to non-existent user
      if (!existingSchedule.createdBy) {
        existingSchedule.createdBy = req.user.id;
      }

      await existingSchedule.save();
      
      // Safely populate fields with error handling
      try {
        await existingSchedule.populate('createdBy', 'firstName lastName');
      } catch (populateError) {
        console.warn('Failed to populate createdBy, fixing reference:', populateError.message);
        existingSchedule.createdBy = req.user.id;
        await existingSchedule.save();
        await existingSchedule.populate('createdBy', 'firstName lastName');
      }
      
      try {
        await existingSchedule.populate('lastUpdatedBy', 'firstName lastName');
      } catch (populateError) {
        console.warn('Failed to populate lastUpdatedBy:', populateError.message);
        // lastUpdatedBy should be valid since it's the current user
      }

      res.status(200).json({
        status: 'success',
        message: 'Schedule updated successfully',
        data: {
          schedule: existingSchedule
        }
      });
    } else {
      // Create new schedule
      const newSchedule = await Schedule.create({
        title: title || 'Class Schedule',
        schedule: schedule || Schedule.initializeWeekSchedule(),
        notes,
        createdBy: req.user.id,
        lastUpdatedBy: req.user.id
      });

      await newSchedule.populate('createdBy', 'firstName lastName');
      await newSchedule.populate('lastUpdatedBy', 'firstName lastName');

      res.status(201).json({
        status: 'success',
        message: 'Schedule created successfully',
        data: {
          schedule: newSchedule
        }
      });
    }
  } catch (error) {
    console.error('Create/Update schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating/updating schedule'
    });
  }
};

// @desc    Update specific day in the schedule
// @route   PUT /api/teacher/schedule/:day
// @access  Private (Teacher)
const updateScheduleDay = async (req, res) => {
  try {
    const { day } = req.params;
    const { sessions } = req.body;

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid day specified'
      });
    }

    let schedule = await Schedule.findOne({ isActive: true });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    // Find the day in the schedule and update it
    const dayIndex = schedule.schedule.findIndex(d => d.day === day);
    if (dayIndex !== -1) {
      schedule.schedule[dayIndex].sessions = sessions;
    } else {
      // Add new day if it doesn't exist
      schedule.schedule.push({ day, sessions });
    }

    schedule.lastUpdatedBy = req.user.id;
    await schedule.save();
    await schedule.populate('createdBy', 'firstName lastName');
    await schedule.populate('lastUpdatedBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: `${day} schedule updated successfully`,
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Update schedule day error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating schedule day'
    });
  }
};

// @desc    Reset schedule to empty
// @route   DELETE /api/teacher/schedule
// @access  Private (Teacher)
const resetSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.findOne({ isActive: true });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    schedule.schedule = Schedule.initializeWeekSchedule();
    schedule.lastUpdatedBy = req.user.id;
    await schedule.save();

    res.status(200).json({
      status: 'success',
      message: 'Schedule reset successfully',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Reset schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error resetting schedule'
    });
  }
};

// @desc    Get schedule for student
// @route   GET /api/student/schedule
// @access  Private (Student)
const getScheduleForStudent = async (req, res) => {
  try {
    const schedule = await Schedule.getMainSchedule();

    if (!schedule) {
      return res.status(200).json({
        status: 'success',
        data: {
          schedule: null,
          message: 'No schedule available yet'
        }
      });
    }

    // Get today's sessions and upcoming sessions
    const todaySchedule = schedule.getTodaySchedule();
    const upcomingSessions = schedule.getUpcomingSessions();

    res.status(200).json({
      status: 'success',
      data: {
        schedule,
        todaySchedule,
        upcomingSessions
      }
    });
  } catch (error) {
    console.error('Get schedule for student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving schedule'
    });
  }
};

// @desc    Get today's schedule for student
// @route   GET /api/student/schedule/today
// @access  Private (Student)
const getTodayScheduleForStudent = async (req, res) => {
  try {
    const schedule = await Schedule.getMainSchedule();

    if (!schedule) {
      return res.status(200).json({
        status: 'success',
        data: {
          todaySchedule: [],
          message: 'No schedule available yet'
        }
      });
    }

    const todaySchedule = schedule.getTodaySchedule();

    res.status(200).json({
      status: 'success',
      data: {
        todaySchedule,
        today: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      }
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving today\'s schedule'
    });
  }
};

// @desc    Assign students to schedule
// @route   POST /api/teacher/schedule/assign-students
// @access  Private (Teacher)
const assignStudentsToSchedule = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Student IDs are required'
      });
    }

    // Get the active schedule
    const schedule = await Schedule.findOne({ isActive: true });
    
    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'No active schedule found'
      });
    }

    // Verify all students exist and are active
    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      registrationStatus: 'approved',
      isActive: true
    }).select('_id firstName lastName email');

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Some selected students are not valid or active'
      });
    }

    // Clear existing assignments and add new ones
    schedule.assignedStudents = studentIds.map(studentId => ({
      student: studentId,
      assignedAt: new Date()
    }));

    await schedule.save();

    res.status(200).json({
      status: 'success',
      message: `Schedule assigned to ${validStudents.length} students`,
      data: {
        assignedStudents: validStudents,
        totalAssigned: schedule.assignedStudents.length
      }
    });
  } catch (error) {
    console.error('Assign students to schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error assigning students to schedule'
    });
  }
};

// @desc    Get students assigned to schedule
// @route   GET /api/teacher/schedule/assigned-students
// @access  Private (Teacher)
const getAssignedStudents = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ isActive: true })
      .populate('assignedStudents.student', 'firstName lastName email studentInfo.studentId');

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'No active schedule found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        assignedStudents: schedule.assignedStudents,
        totalAssigned: schedule.assignedStudents.length
      }
    });
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving assigned students'
    });
  }
};

// @desc    Remove student from schedule
// @route   DELETE /api/teacher/schedule/students/:studentId
// @access  Private (Teacher)
const removeStudentFromSchedule = async (req, res) => {
  try {
    const { studentId } = req.params;

    const schedule = await Schedule.findOne({ isActive: true });
    
    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'No active schedule found'
      });
    }

    // Remove student from assigned students
    schedule.assignedStudents = schedule.assignedStudents.filter(
      assignment => assignment.student.toString() !== studentId
    );

    await schedule.save();

    res.status(200).json({
      status: 'success',
      message: 'Student removed from schedule',
      data: {
        totalAssigned: schedule.assignedStudents.length
      }
    });
  } catch (error) {
    console.error('Remove student from schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error removing student from schedule'
    });
  }
};

module.exports = {
  getSchedule,
  createOrUpdateSchedule,
  updateScheduleDay,
  resetSchedule,
  getScheduleForStudent,
  getTodayScheduleForStudent,
  assignStudentsToSchedule,
  getAssignedStudents,
  removeStudentFromSchedule
}; 

// --- Attendance via QR ---
// @desc Generate a signed QR token for a schedule session
// @route GET /api/teacher/schedule/qr?day=Tuesday&start=09:00&end=10:30
// @access Private (Teacher)
module.exports.getSessionQr = async (req, res) => {
  try {
    const { day, start: startTime, end: endTime } = req.query;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ status: 'error', message: 'Missing day/start/end' });
    }
    // sign minimal info; expiry 2 hours
    const token = jwt.sign(
      {
        t: 'att',
        day,
        startTime,
        endTime,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret_for_development',
      { expiresIn: '2h' }
    );
    res.status(200).json({ status: 'success', data: { token } });
  } catch (e) {
    console.error('getSessionQr error:', e);
    res.status(500).json({ status: 'error', message: 'Server error issuing QR' });
  }
};
