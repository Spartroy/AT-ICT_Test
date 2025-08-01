const Activity = require('../models/Activity');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Message = require('../models/Message');

// @desc    Get recent activities for teacher dashboard
// @route   GET /api/teacher/activities
// @access  Private (Teacher)
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10, type } = req.query;
    
    let query = {};
    if (type) {
      query.type = type;
    }
    
    const activities = await Activity.find(query)
      .populate('student', 'firstName lastName email profileImage')
      .populate('relatedItem')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const unreadCount = await Activity.getUnreadCount();
    
    res.status(200).json({
      status: 'success',
      data: {
        activities,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving activities'
    });
  }
};

// @desc    Mark activities as read
// @route   PUT /api/teacher/activities/mark-read
// @access  Private (Teacher)
const markActivitiesAsRead = async (req, res) => {
  try {
    const { activityIds } = req.body;
    
    if (!Array.isArray(activityIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Activity IDs array is required'
      });
    }
    
    await Activity.markAsRead(activityIds);
    
    res.status(200).json({
      status: 'success',
      message: 'Activities marked as read'
    });
  } catch (error) {
    console.error('Mark activities as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error marking activities as read'
    });
  }
};

// @desc    Create activity (internal use)
// @route   POST /api/teacher/activities
// @access  Private (Teacher)
const createActivity = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      studentId,
      relatedItemId,
      relatedItemModel,
      metadata = {},
      priority = 'medium'
    } = req.body;
    
    // Validate student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }
    
    const activity = await Activity.createActivity({
      type,
      title,
      description,
      student: studentId,
      relatedItem: relatedItemId,
      relatedItemModel,
      metadata,
      priority
    });
    
    await activity.populate('student', 'firstName lastName email profileImage');
    
    res.status(201).json({
      status: 'success',
      data: { activity }
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating activity'
    });
  }
};

// Helper function to create activities from various events
const createActivityFromEvent = async (eventData) => {
  try {
    const {
      type,
      title,
      description,
      studentId,
      relatedItemId,
      relatedItemModel,
      metadata = {},
      priority = 'medium'
    } = eventData;
    
    await Activity.createActivity({
      type,
      title,
      description,
      student: studentId,
      relatedItem: relatedItemId,
      relatedItemModel,
      metadata,
      priority
    });
  } catch (error) {
    console.error('Error creating activity from event:', error);
  }
};

module.exports = {
  getRecentActivities,
  markActivitiesAsRead,
  createActivity,
  createActivityFromEvent
}; 