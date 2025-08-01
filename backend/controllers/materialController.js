const Material = require('../models/Material');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Get all materials for teacher
// @route   GET /api/teacher/materials
// @access  Private (Teacher)
const getMaterials = async (req, res) => {
  try {
    const { type, search } = req.query;
    
    // Build query
    let query = { uploadedBy: req.user.id };
    
    if (type) query.type = type;
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const materials = await Material.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ type: 1, createdAt: -1 });

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

// @desc    Upload new material
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

    // Ensure upload directories exist
    const materialsDir = path.join(__dirname, '..', 'uploads', 'materials');
    const thumbnailsDir = path.join(__dirname, '..', 'uploads', 'materials', 'thumbnails');
    
    if (!fs.existsSync(materialsDir)) {
      fs.mkdirSync(materialsDir, { recursive: true });
    }
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Prepare material data
    const materialData = {
      title,
      type,
      fileUrl: `/uploads/materials/${materialFile.filename}`,
      fileName: materialFile.originalname,
      fileSize: materialFile.size,
      mimeType: materialFile.mimetype,
      uploadedBy: req.user.id
    };

    // Add thumbnail data if provided
    if (thumbnailFile) {
      materialData.thumbnailUrl = `/uploads/materials/thumbnails/${thumbnailFile.filename}`;
      materialData.thumbnailFileName = thumbnailFile.originalname;
      materialData.thumbnailSize = thumbnailFile.size;
      materialData.thumbnailMimeType = thumbnailFile.mimetype;
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
    
    // Delete uploaded files if database save failed
    if (req.files) {
      if (req.files.material) {
        try {
          fs.unlinkSync(req.files.material[0].path);
        } catch (deleteError) {
          console.error('Error deleting material file:', deleteError);
        }
      }
      if (req.files.thumbnail) {
        try {
          fs.unlinkSync(req.files.thumbnail[0].path);
        } catch (deleteError) {
          console.error('Error deleting thumbnail file:', deleteError);
        }
      }
    }
    
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

    // Check if user uploaded this material
    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this material'
      });
    }

    // Update material
    material.title = title;
    material.type = type;

    // If new material file is uploaded, update file information
    if (req.files && req.files.material) {
      const materialFile = req.files.material[0];
      
      // Delete old file
      try {
        const oldFilePath = path.join(__dirname, '..', material.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (deleteError) {
        console.error('Error deleting old file:', deleteError);
      }

      // Update with new file info
      material.fileUrl = `/uploads/materials/${materialFile.filename}`;
      material.fileName = materialFile.originalname;
      material.fileSize = materialFile.size;
      material.mimeType = materialFile.mimetype;
    }

    // If new thumbnail is uploaded, update thumbnail information
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail[0];
      
      // Delete old thumbnail if exists
      try {
        if (material.thumbnailUrl) {
          const oldThumbnailPath = path.join(__dirname, '..', material.thumbnailUrl);
          if (fs.existsSync(oldThumbnailPath)) {
            fs.unlinkSync(oldThumbnailPath);
          }
        }
      } catch (deleteError) {
        console.error('Error deleting old thumbnail:', deleteError);
      }

      // Update with new thumbnail info
      material.thumbnailUrl = `/uploads/materials/thumbnails/${thumbnailFile.filename}`;
      material.thumbnailFileName = thumbnailFile.originalname;
      material.thumbnailSize = thumbnailFile.size;
      material.thumbnailMimeType = thumbnailFile.mimetype;
    }

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
    
    // Delete uploaded files if database save failed
    if (req.files) {
      if (req.files.material) {
        try {
          fs.unlinkSync(req.files.material[0].path);
        } catch (deleteError) {
          console.error('Error deleting material file:', deleteError);
        }
      }
      if (req.files.thumbnail) {
        try {
          fs.unlinkSync(req.files.thumbnail[0].path);
        } catch (deleteError) {
          console.error('Error deleting thumbnail file:', deleteError);
        }
      }
    }
    
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

    // Check if user uploaded this material
    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this material'
      });
    }

    // Delete files from filesystem
    try {
      // Delete material file
      const filePath = path.join(__dirname, '..', material.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete thumbnail file if exists
      if (material.thumbnailUrl) {
        const thumbnailPath = path.join(__dirname, '..', material.thumbnailUrl);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    } catch (deleteError) {
      console.error('Error deleting files:', deleteError);
    }

    await material.deleteOne();

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

    // Check if user uploaded this material
    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to download this material'
      });
    }

    const filePath = path.join(__dirname, '..', material.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Increment download count
    await material.incrementDownload();

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Type', material.mimeType);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error downloading material'
    });
  }
};

// @desc    Get materials accessible by student
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

    const filePath = path.join(__dirname, '..', material.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Increment download count
    await material.incrementDownload();

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Type', material.mimeType);

    // Send file
    res.sendFile(filePath);
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