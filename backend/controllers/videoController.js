const Video = require('../models/Video');
const User = require('../models/User');

// @desc    Get all videos for teacher management
// @route   GET /api/teacher/videos
// @access  Private (Teacher)
const getAllVideos = async (req, res) => {
  try {
    const { type, program, contentType, phase, search, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by type (theory/practical)
    if (type) query.type = type;
    
    // Filter by program (for practical videos)
    if (program) query.program = program;
    
    // Filter by content type (guide/task for practical videos)
    if (contentType) query.contentType = contentType;
    
    // Filter by phase (for theory videos)
    if (phase) query.phase = parseInt(phase);
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Video.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        videos,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: skip + videos.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving videos'
    });
  }
};

// @desc    Get video by ID
// @route   GET /api/teacher/videos/:id
// @access  Private (Teacher)
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName')
      .populate('specificStudents', 'firstName lastName');
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { video }
    });
  } catch (error) {
    console.error('Get video by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving video'
    });
  }
};

// @desc    Create new video
// @route   POST /api/teacher/videos
// @access  Private (Teacher)
const createVideo = async (req, res) => {
  try {
    console.log('Received video creation request:', req.body);
    
    const {
      title,
      description,
      type,
      videoUrl,
      phase,
      chapter,
      program,
      contentType,
      order,
      accessLevel
    } = req.body;
    
    // Validate required fields based on video type
    if (type === 'theory') {
      if (!phase || !chapter) {
        return res.status(400).json({
          status: 'error',
          message: 'Phase and chapter are required for theory videos'
        });
      }
    } else if (type === 'practical') {
      if (!program || !contentType) {
        return res.status(400).json({
          status: 'error',
          message: 'Program and content type are required for practical videos'
        });
      }
    }
    
    // Validate Google Drive URL format
    if (!videoUrl.includes('drive.google.com')) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid Google Drive video URL'
      });
    }
    
    // Convert Google Drive URL to embed format
    const embedUrl = videoUrl.replace('/view', '/preview');
    
    const videoData = {
      title,
      description,
      type,
      videoUrl: embedUrl,
      phase: phase ? parseInt(phase) : undefined,
      chapter: chapter ? parseInt(chapter) : undefined,
      order: order ? parseInt(order) : 0,
      accessLevel: accessLevel || 'all',
      uploadedBy: req.user.id
    };

    // Only add program and contentType if they have values
    if (program && program.trim() !== '') {
      videoData.program = program;
    }
    if (contentType && contentType.trim() !== '') {
      videoData.contentType = contentType;
    }

    const video = new Video(videoData);
    
    await video.save();
    
    const populatedVideo = await Video.findById(video._id)
      .populate('uploadedBy', 'firstName lastName');
    
    res.status(201).json({
      status: 'success',
      message: 'Video created successfully',
      data: { video: populatedVideo }
    });
  } catch (error) {
    console.error('Create video error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Server error creating video'
    });
  }
};

// @desc    Update video
// @route   PUT /api/teacher/videos/:id
// @access  Private (Teacher)
const updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check if teacher is the uploader or has admin rights
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this video'
      });
    }
    
    const {
      title,
      description,
      type,
      category,
      subcategory,
      videoUrl,
      thumbnailUrl,
      duration,
      phase,
      chapter,
      program,
      contentType,
      order,
      tags,
      accessLevel,
      specificStudents,
      isActive
    } = req.body;
    
    // Validate required fields based on video type
    if (type === 'theory') {
      if (!phase || !chapter) {
        return res.status(400).json({
          status: 'error',
          message: 'Phase and chapter are required for theory videos'
        });
      }
    } else if (type === 'practical') {
      if (!program || !contentType) {
        return res.status(400).json({
          status: 'error',
          message: 'Program and content type are required for practical videos'
        });
      }
    }
    
    // Convert Google Drive URL to embed format if provided
    let processedVideoUrl = videoUrl;
    if (videoUrl && videoUrl.includes('drive.google.com')) {
      processedVideoUrl = videoUrl.replace('/view', '/preview');
    }
    
    const updateData = {
      title,
      description,
      type,
      videoUrl: processedVideoUrl,
      phase: phase ? parseInt(phase) : undefined,
      chapter: chapter ? parseInt(chapter) : undefined,
      order: order ? parseInt(order) : 0,
      accessLevel,
      isActive
    };

    // Only add program and contentType if they have values
    if (program && program.trim() !== '') {
      updateData.program = program;
    }
    if (contentType && contentType.trim() !== '') {
      updateData.contentType = contentType;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'firstName lastName');
    
    res.status(200).json({
      status: 'success',
      message: 'Video updated successfully',
      data: { video: updatedVideo }
    });
  } catch (error) {
    console.error('Update video error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Server error updating video'
    });
  }
};

// @desc    Delete video
// @route   DELETE /api/teacher/videos/:id
// @access  Private (Teacher)
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Check if teacher is the uploader or has admin rights
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this video'
      });
    }
    
    await Video.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting video'
    });
  }
};

// @desc    Get next order number for practical videos
// @route   GET /api/teacher/videos/next-order
// @access  Private (Teacher)
const getNextOrder = async (req, res) => {
  try {
    const { program, contentType } = req.query;
    
    if (!program || !contentType) {
      return res.status(400).json({
        status: 'error',
        message: 'Program and content type are required'
      });
    }
    
    // Find the highest order number for the given program and content type
    const highestOrder = await Video.findOne({
      type: 'practical',
      program: program,
      contentType: contentType
    }).sort({ order: -1 }).select('order');
    
    const nextOrder = (highestOrder?.order || 0) + 1;
    
    res.status(200).json({
      status: 'success',
      data: { nextOrder }
    });
  } catch (error) {
    console.error('Get next order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting next order'
    });
  }
};

// @desc    Get video statistics
// @route   GET /api/teacher/videos/stats
// @access  Private (Teacher)
const getVideoStats = async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    const theoryVideos = await Video.countDocuments({ type: 'theory' });
    const practicalVideos = await Video.countDocuments({ type: 'practical' });
    const activeVideos = await Video.countDocuments({ isActive: true });
    
    // Get videos by program
    const programStats = await Video.aggregate([
      { $match: { type: 'practical' } },
      { $group: { _id: '$program', count: { $sum: 1 } } }
    ]);
    
    // Get videos by phase
    const phaseStats = await Video.aggregate([
      { $match: { type: 'theory' } },
      { $group: { _id: '$phase', count: { $sum: 1 } } }
    ]);
    
    // Get most viewed videos
    const mostViewed = await Video.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .populate('uploadedBy', 'firstName lastName');
    
    res.status(200).json({
      status: 'success',
      data: {
        totalVideos,
        theoryVideos,
        practicalVideos,
        activeVideos,
        programStats,
        phaseStats,
        mostViewed
      }
    });
  } catch (error) {
    console.error('Get video stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving video statistics'
    });
  }
};

// @desc    Bulk update video order
// @route   PUT /api/teacher/videos/reorder
// @access  Private (Teacher)
const reorderVideos = async (req, res) => {
  try {
    const { videos } = req.body;
    
    if (!Array.isArray(videos)) {
      return res.status(400).json({
        status: 'error',
        message: 'Videos array is required'
      });
    }
    
    const updatePromises = videos.map(({ id, order }) =>
      Video.findByIdAndUpdate(id, { order: parseInt(order) })
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      status: 'success',
      message: 'Video order updated successfully'
    });
  } catch (error) {
    console.error('Reorder videos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error reordering videos'
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoStats,
  getNextOrder,
  reorderVideos
}; 