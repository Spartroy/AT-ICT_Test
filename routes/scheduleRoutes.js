const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSchedule,
  createOrUpdateSchedule,
  updateScheduleDay,
  resetSchedule,
  getScheduleForStudent,
  getTodayScheduleForStudent
} = require('../controllers/scheduleController');

// Validation middleware for schedule
const validateSchedule = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('schedule')
    .optional()
    .isArray()
    .withMessage('Schedule must be an array')
    .custom((schedule) => {
      if (schedule && Array.isArray(schedule)) {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (let daySchedule of schedule) {
          if (!validDays.includes(daySchedule.day)) {
            throw new Error(`Invalid day: ${daySchedule.day}`);
          }
          
          if (!Array.isArray(daySchedule.sessions)) {
            throw new Error('Each day must have a sessions array');
          }
        }
      }
      return true;
    })
];

// Validation for updating a specific day
const validateDayUpdate = [
  body('sessions')
    .isArray()
    .withMessage('Sessions must be an array')
];

// Teacher Routes (authentication handled by parent router)
router.get('/', getSchedule);

router.post('/', validateSchedule, createOrUpdateSchedule);

router.put('/:day', validateDayUpdate, updateScheduleDay);

router.delete('/', resetSchedule);

module.exports = router; 