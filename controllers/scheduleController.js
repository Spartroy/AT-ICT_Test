const Schedule = require('../models/Schedule');
const { validationResult } = require('express-validator');

// @desc    Get the main schedule for teacher
// @route   GET /api/teacher/schedule
// @access  Private (Teacher)
const getSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.getMainSchedule();
    
    // If no schedule exists, create a default one
    if (!schedule) {
      schedule = await Schedule.create({
        title: 'Class Schedule',
        schedule: Schedule.initializeWeekSchedule(),
        createdBy: req.user.id,
        isActive: true
      });
      
      await schedule.populate('createdBy', 'firstName lastName');
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

      await existingSchedule.save();
      await existingSchedule.populate('createdBy', 'firstName lastName');
      await existingSchedule.populate('lastUpdatedBy', 'firstName lastName');

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

module.exports = {
  getSchedule,
  createOrUpdateSchedule,
  updateScheduleDay,
  resetSchedule,
  getScheduleForStudent,
  getTodayScheduleForStudent
}; 