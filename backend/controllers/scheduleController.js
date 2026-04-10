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

// @desc    Get schedule for student (their assigned schedule)
// @route   GET /api/student/schedule
// @access  Private (Student)
const getScheduleForStudent = async (req, res) => {
  try {
    // Find the schedule the student is assigned to
    let schedule = await Schedule.findOne({
      isActive: true,
      'assignedStudents.student': req.user.id
    })
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName');

    // Fallback: if student has no assigned schedule, return empty
    if (!schedule) {
      return res.status(200).json({
        status: 'success',
        data: {
          schedule: null,
          todaySchedule: [],
          upcomingSessions: [],
          message: 'No schedule assigned yet. Contact your teacher.'
        }
      });
    }

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

// @desc    Get today's schedule for student (their assigned schedule)
// @route   GET /api/student/schedule/today
// @access  Private (Student)
const getTodayScheduleForStudent = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      isActive: true,
      'assignedStudents.student': req.user.id
    });

    if (!schedule) {
      return res.status(200).json({
        status: 'success',
        data: {
          todaySchedule: [],
          message: 'No schedule assigned yet'
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

// @desc    Get all schedules
// @route   GET /api/teacher/schedules
// @access  Private (Teacher)
const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.getAllSchedules();
    
    res.status(200).json({
      status: 'success',
      data: {
        schedules,
        total: schedules.length
      }
    });
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving schedules'
    });
  }
};

// @desc    Create new schedule
// @route   POST /api/teacher/schedules
// @access  Private (Teacher)
const createSchedule = async (req, res) => {
  try {
    const { title, description, targetStudentGroups, scheduleType, startDate, endDate, notes } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Schedule title is required'
      });
    }

    // Create new schedule
    const schedule = await Schedule.create({
      title,
      description,
      targetStudentGroups: targetStudentGroups || [],
      scheduleType: scheduleType || 'main',
      startDate,
      endDate,
      notes,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id,
      schedule: Schedule.initializeWeekSchedule()
    });

    await schedule.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Schedule created successfully',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating schedule'
    });
  }
};

// @desc    Get students by classification
// @route   GET /api/teacher/schedules/students
// @access  Private (Teacher)
const getStudentsByClassification = async (req, res) => {
  try {
    const classifiedStudents = await Schedule.getStudentsByClassification();
    
    res.status(200).json({
      status: 'success',
      data: {
        students: classifiedStudents,
        summary: {
          '9H': classifiedStudents['9H'].length,
          '9J': classifiedStudents['9J'].length,
          'custom': classifiedStudents['custom'].length,
          'unclassified': classifiedStudents['unclassified'].length
        }
      }
    });
  } catch (error) {
    console.error('Get students by classification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving student classifications'
    });
  }
};

// @desc    Assign students to specific schedule
// @route   POST /api/teacher/schedules/:scheduleId/assign-students
// @access  Private (Teacher)
const assignStudentsToSpecificSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { studentIds, groupType } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Student IDs are required'
      });
    }

    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    // Verify all students exist and are active
    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      registrationStatus: 'approved',
      isActive: true
    }).select('_id firstName lastName email studentInfo');

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Some selected students are not valid or active'
      });
    }

    // Add students to schedule
    const newAssignments = studentIds.map(studentId => ({
      student: studentId,
      assignedAt: new Date(),
      assignedBy: req.user.id
    }));

    // Remove duplicates and add new assignments
    const existingStudentIds = schedule.assignedStudents.map(a => a.student.toString());
    const uniqueNewAssignments = newAssignments.filter(a => !existingStudentIds.includes(a.student.toString()));
    
    schedule.assignedStudents.push(...uniqueNewAssignments);
    schedule.lastUpdatedBy = req.user.id;

    await schedule.save();

    res.status(200).json({
      status: 'success',
      message: `Students assigned to schedule successfully`,
      data: {
        assignedStudents: validStudents,
        totalAssigned: schedule.assignedStudents.length,
        newAssignments: uniqueNewAssignments.length
      }
    });
  } catch (error) {
    console.error('Assign students to specific schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error assigning students to schedule'
    });
  }
};

// @desc    Get specific schedule with assigned students
// @route   GET /api/teacher/schedules/:scheduleId
// @access  Private (Teacher)
const getSpecificSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await Schedule.findById(scheduleId)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .populate('assignedStudents.student', 'firstName lastName email studentInfo')
      .populate('assignedStudents.assignedBy', 'firstName lastName');

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    console.error('Get specific schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving schedule'
    });
  }
};

// @desc    Get combined weekly overview of all schedules with student info
// @route   GET /api/teacher/schedule/weekly-overview
// @access  Private (Teacher)
const getTeacherWeeklyOverview = async (req, res) => {
  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const schedules = await Schedule.find({ isActive: true })
      .populate('assignedStudents.student', 'firstName lastName studentInfo.studentId studentInfo.timezone');

    // Build a map: day -> [ { session, scheduleId, scheduleTitle, students[] } ]
    const weekMap = {};
    days.forEach(d => { weekMap[d] = []; });

    schedules.forEach(sched => {
      const studentList = sched.assignedStudents
        .filter(a => a.student)
        .map(a => ({
          _id: a.student._id,
          name: `${a.student.firstName} ${a.student.lastName}`,
          studentId: a.student.studentInfo?.studentId || null,
          timezone: a.student.studentInfo?.timezone || null
        }));

      (sched.schedule || []).forEach(dayObj => {
        if (!weekMap[dayObj.day]) return;
        (dayObj.sessions || []).filter(s => s.isActive !== false).forEach(session => {
          weekMap[dayObj.day].push({
            scheduleId: sched._id,
            scheduleTitle: sched.title,
            startTime: session.startTime,
            endTime: session.endTime,
            type: session.type,
            topic: session.topic,
            students: studentList
          });
        });
      });
    });

    // Sort each day's sessions by startTime
    days.forEach(d => {
      weekMap[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    const overview = days.map(day => ({ day, sessions: weekMap[day] }));

    res.status(200).json({
      status: 'success',
      data: {
        overview,
        totalSchedules: schedules.length
      }
    });
  } catch (error) {
    console.error('getTeacherWeeklyOverview error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving weekly overview' });
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/teacher/schedules/:scheduleId
// @access  Private (Teacher)
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' });
    }
    await Schedule.findByIdAndDelete(scheduleId);
    res.status(200).json({ status: 'success', message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('deleteSchedule error:', error);
    res.status(500).json({ status: 'error', message: 'Server error deleting schedule' });
  }
};

// @desc    Update sessions for a specific schedule
// @route   PUT /api/teacher/schedules/:scheduleId
// @access  Private (Teacher)
const updateSpecificSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { title, notes, schedule: weekSchedule } = req.body;

    const sched = await Schedule.findById(scheduleId);
    if (!sched) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' });
    }

    if (title !== undefined) sched.title = title;
    if (notes !== undefined) sched.notes = notes;
    if (weekSchedule !== undefined) sched.schedule = weekSchedule;
    sched.lastUpdatedBy = req.user.id;

    await sched.save();
    await sched.populate('createdBy', 'firstName lastName');
    await sched.populate('lastUpdatedBy', 'firstName lastName');
    await sched.populate('assignedStudents.student', 'firstName lastName studentInfo');

    res.status(200).json({
      status: 'success',
      message: 'Schedule updated successfully',
      data: { schedule: sched }
    });
  } catch (error) {
    console.error('updateSpecificSchedule error:', error);
    res.status(500).json({ status: 'error', message: 'Server error updating schedule' });
  }
};

// @desc    Remove student from specific schedule
// @route   DELETE /api/teacher/schedules/:scheduleId/students/:studentId
// @access  Private (Teacher)
const removeStudentFromSpecificSchedule = async (req, res) => {
  try {
    const { scheduleId, studentId } = req.params;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' });
    }
    schedule.assignedStudents = schedule.assignedStudents.filter(
      a => a.student.toString() !== studentId
    );
    await schedule.save();
    res.status(200).json({ status: 'success', message: 'Student removed from schedule' });
  } catch (error) {
    console.error('removeStudentFromSpecificSchedule error:', error);
    res.status(500).json({ status: 'error', message: 'Server error removing student' });
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
  removeStudentFromSchedule,
  getAllSchedules,
  createSchedule,
  getStudentsByClassification,
  assignStudentsToSpecificSchedule,
  getSpecificSchedule,
  getTeacherWeeklyOverview,
  deleteSchedule,
  updateSpecificSchedule,
  removeStudentFromSpecificSchedule
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
