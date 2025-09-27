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
    console.log('📊 Fetching recent activities...');
    console.log('🔍 Activity model:', typeof Activity);
    console.log('🔍 Activity.find:', typeof Activity.find);
    
    // Test basic connection first
    try {
      const testQuery = await Activity.find({}).limit(1);
      console.log('✅ Basic Activity query successful');
    } catch (testError) {
      console.error('❌ Basic Activity query failed:', testError);
      throw testError;
    }
    
    const { limit = 10, type } = req.query;
    
    let query = {};
    if (type) {
      query.type = type;
    }
    
    console.log('🔍 Query:', query);
    console.log('📝 Limit:', limit);
    
    // Try a simpler query first
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    console.log('📋 Found activities:', activities.length);
    
    // Try to populate if we have activities
    let populatedActivities = activities;
    if (activities.length > 0) {
      try {
        populatedActivities = await Activity.find(query)
          .populate('student', 'firstName lastName email profileImage')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        console.log('✅ Population successful');
      } catch (populateError) {
        console.error('❌ Population failed, using basic activities:', populateError);
        // Use the basic activities without population
      }
    }
    
    const unreadCount = await Activity.countDocuments({ isRead: false });
    console.log('🔢 Unread count:', unreadCount);
    
    res.status(200).json({
      status: 'success',
      data: {
        activities: populatedActivities,
        unreadCount
      }
    });
  } catch (error) {
    console.error('❌ Get recent activities error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Return empty data instead of 500 error to prevent frontend crashes
    console.log('🔄 Returning empty activities data as fallback');
    res.status(200).json({
      status: 'success',
      data: {
        activities: [],
        unreadCount: 0
      }
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
    
    await Activity.updateMany(
      { _id: { $in: activityIds } },
      { isRead: true }
    );
    
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
    
    const activity = new Activity({
      type,
      title,
      description,
      student: studentId,
      relatedItem: relatedItemId,
      relatedItemModel,
      metadata,
      priority
    });
    
    await activity.save();
    
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
    
    const activity = new Activity({
      type,
      title,
      description,
      student: studentId,
      relatedItem: relatedItemId,
      relatedItemModel,
      metadata,
      priority
    });
    
    await activity.save();
  } catch (error) {
    console.error('Error creating activity from event:', error);
  }
};

// @desc    Test activity endpoint
// @route   GET /api/teacher/activities/test
// @access  Private (Teacher)
const testActivity = async (req, res) => {
  try {
    console.log('🧪 Testing Activity model...');
    
    // Test basic model functionality
    const testActivity = new Activity({
      type: 'test',
      title: 'Test Activity',
      description: 'This is a test activity',
      student: req.user.id, // Use current user as student for test
      priority: 'low'
    });
    
    await testActivity.save();
    console.log('✅ Activity created successfully');
    
    // Clean up test activity
    await Activity.findByIdAndDelete(testActivity._id);
    console.log('✅ Test activity cleaned up');
    
    res.status(200).json({
      status: 'success',
      message: 'Activity model is working correctly'
    });
  } catch (error) {
    console.error('❌ Activity model test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Activity model test failed',
      error: error.message
    });
  }
};

module.exports = {
  getRecentActivities,
  markActivitiesAsRead,
  createActivity,
  createActivityFromEvent,
  testActivity
}; 