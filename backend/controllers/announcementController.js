const Announcement = require('../models/Announcement');
const { validationResult } = require('express-validator');

// @desc    Create new announcement (Teacher only)
// @route   POST /api/announcements
// @access  Private (Teacher)
const createAnnouncement = async (req, res) => {
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
      content,
      type,
      priority,
      targetAudience,
      specificTargets,
      scheduledFor,
      expiresAt,
      isPinned,
      tags
    } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      type,
      priority,
      targetAudience,
      specificTargets,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isPinned,
      tags,
      createdBy: req.user.id
    });

    await announcement.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Announcement created successfully',
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating announcement'
    });
  }
};

// @desc    Get all announcements (Teacher only)
// @route   GET /api/announcements/all
// @access  Private (Teacher)
const getAllAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, priority, targetAudience, search } = req.query;

    // Build query
    let query = {};
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (targetAudience) query.targetAudience = targetAudience;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('specificTargets', 'firstName lastName email')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    // Get summary statistics
    const stats = await Announcement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        announcements,
        stats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving announcements'
    });
  }
};

// @desc    Get announcements for current user
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { includeExpired = false } = req.query;

    const announcements = await Announcement.getForUser(
      req.user.id,
      req.user.role,
      {
        limit,
        skip: (page - 1) * limit,
        includeExpired: includeExpired === 'true'
      }
    );

    // Mark announcements as read
    const unreadAnnouncements = announcements.filter(
      ann => !ann.readBy.some(read => read.user.toString() === req.user.id)
    );

    if (unreadAnnouncements.length > 0) {
      await Promise.all(
        unreadAnnouncements.map(ann => ann.markAsRead(req.user.id))
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        announcements
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving announcements'
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName profileImage')
      .populate('specificTargets', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName profileImage');

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: 'Announcement not found'
      });
    }

    // Mark as read
    await announcement.markAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving announcement'
    });
  }
};

// @desc    Update announcement (Teacher only)
// @route   PUT /api/announcements/:id
// @access  Private (Teacher)
const updateAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      specificTargets,
      scheduledFor,
      expiresAt,
      isPinned,
      tags,
      isPublished
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: 'Announcement not found'
      });
    }

    // Check if user created this announcement
    if (announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this announcement'
      });
    }

    // Update announcement
    Object.assign(announcement, {
      title,
      content,
      type,
      priority,
      targetAudience,
      specificTargets,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : announcement.scheduledFor,
      expiresAt: expiresAt ? new Date(expiresAt) : announcement.expiresAt,
      isPinned,
      tags,
      isPublished
    });

    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Announcement updated successfully',
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating announcement'
    });
  }
};

// @desc    Delete announcement (Teacher only)
// @route   DELETE /api/announcements/:id
// @access  Private (Teacher)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: 'Announcement not found'
      });
    }

    // Check if user created this announcement
    if (announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this announcement'
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting announcement'
    });
  }
};

// @desc    Like/Unlike announcement
// @route   PUT /api/announcements/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: 'Announcement not found'
      });
    }

    const hasLiked = announcement.likes.some(
      like => like.user.toString() === req.user.id
    );

    if (hasLiked) {
      await announcement.removeLike(req.user.id);
    } else {
      await announcement.addLike(req.user.id);
    }

    res.status(200).json({
      status: 'success',
      message: hasLiked ? 'Like removed' : 'Like added',
      data: {
        likeCount: announcement.likes.length,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error toggling like'
    });
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        message: 'Announcement not found'
      });
    }

    await announcement.addComment(req.user.id, content);
    await announcement.populate('comments.user', 'firstName lastName profileImage');

    const newComment = announcement.comments[announcement.comments.length - 1];

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: {
        comment: newComment
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error adding comment'
    });
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike,
  addComment
}; 