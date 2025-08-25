const Material = require('../models/Material');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { deleteFromCloudinary, getFileUrl } = require('../config/cloudinary');

// @desc    Get all materials
// @route   GET /api/teacher/materials
// @access  Private (Teacher)
const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        materials
      }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving materials'
    });
  }
};

// @desc    Upload material
// @route   POST /api/teacher/materials
// @access  Private (Teacher)
const uploadMaterial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (!req.files || !req.files.material) {
      return res.status(400).json({
        status: 'error',
        message: 'No material file uploaded'
      });
    }

    const { title, type } = req.body;
    const materialFile = req.files.material[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    // Prepare material data with Cloudinary information
    const materialData = {
      title,
      type,
      fileUrl: materialFile.path, // Cloudinary URL
      fileName: materialFile.originalname,
      fileSize: materialFile.size,
      mimeType: materialFile.mimetype,
      cloudinaryPublicId: materialFile.filename, // Cloudinary public ID
      cloudinaryUrl: materialFile.path, // Cloudinary URL
      uploadedBy: req.user.id
    };

    // Add thumbnail data if provided
    if (thumbnailFile) {
      materialData.thumbnailUrl = thumbnailFile.path; // Cloudinary URL
      materialData.thumbnailFileName = thumbnailFile.originalname;
      materialData.thumbnailSize = thumbnailFile.size;
      materialData.thumbnailMimeType = thumbnailFile.mimetype;
      materialData.thumbnailCloudinaryPublicId = thumbnailFile.filename; // Cloudinary public ID
      materialData.thumbnailCloudinaryUrl = thumbnailFile.path; // Cloudinary URL
    }

    const material = await Material.create(materialData);

    await material.populate('uploadedBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Material uploaded successfully',
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Upload material error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request files:', req.files);
    
    res.status(500).json({
      status: 'error',
      message: 'Server error uploading material',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update material
// @route   PUT /api/teacher/materials/:id
// @access  Private (Teacher)
const updateMaterial = async (req, res) => {
  try {
    const { title, type } = req.body;

    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found'
      });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this material'
      });
    }

    material.title = title || material.title;
    material.type = type || material.type;

    await material.save();

    await material.populate('uploadedBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Material updated successfully',
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating material'
    });
  }
};

// @desc    Delete material
// @route   DELETE /api/teacher/materials/:id
// @access  Private (Teacher)
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found'
      });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this material'
      });
    }

    // Delete files from Cloudinary
    try {
      if (material.cloudinaryPublicId) {
        await deleteFromCloudinary(material.cloudinaryPublicId);
      }
      if (material.thumbnailCloudinaryPublicId) {
        await deleteFromCloudinary(material.thumbnailCloudinaryPublicId);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    await Material.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting material'
    });
  }
};

// @desc    Download material file
// @route   GET /api/teacher/materials/:id/download
// @access  Private (Teacher)
const downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found'
      });
    }

    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to download this material'
      });
    }

    // Increment download count
    await material.incrementDownload();

    // Redirect to Cloudinary URL for download
    res.redirect(material.cloudinaryUrl);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error downloading material'
    });
  }
};

// @desc    Get materials for student
// @route   GET /api/student/materials
// @access  Private (Student)
const getMaterialsForStudent = async (req, res) => {
  try {
    const { type } = req.query;

    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    // Build query for all active materials
    let query = { isActive: true };
    if (type) query.type = type;

    const materials = await Material.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ type: 1, createdAt: -1 });

    // Group materials by type
    const groupedMaterials = {
      theory: [],
      practical: [],
      other: []
    };

    materials.forEach(material => {
      if (groupedMaterials[material.type]) {
        groupedMaterials[material.type].push(material);
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        materials: groupedMaterials,
        allMaterials: materials
      }
    });
  } catch (error) {
    console.error('Get materials for student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving materials'
    });
  }
};

// @desc    Download material file for student
// @route   GET /api/student/materials/:id/download
// @access  Private (Student)
const downloadMaterialForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const material = await Material.findById(req.params.id);

    if (!material || !material.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Material not found'
      });
    }

    // Increment download count
    await material.incrementDownload();

    // Redirect to Cloudinary URL for download
    res.redirect(material.cloudinaryUrl);
  } catch (error) {
    console.error('Download material for student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error downloading material'
    });
  }
};

module.exports = {
  getMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
  getMaterialsForStudent,
  downloadMaterialForStudent
}; 