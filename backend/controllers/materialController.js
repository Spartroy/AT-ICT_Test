const Material = require('../models/Material');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { deleteFromCloudinary, getFileUrl, cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

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

// @desc    Upload material (file or link-only)
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

    const { title, type, externalUrl } = req.body;
    const materialFile = req.files?.material ? req.files.material[0] : null;
    const thumbnailFile = req.files?.thumbnail ? req.files.thumbnail[0] : null;

    // Allow link-only materials when no file is provided and externalUrl is present
    if (!materialFile && !externalUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Provide either a file or an external link'
      });
    }

    // Prepare material data
    const materialData = {
      title,
      type,
      uploadedBy: req.user.id
    };

    if (materialFile) {
      materialData.fileUrl = materialFile.path; // Cloudinary URL
      materialData.fileName = materialFile.originalname;
      materialData.fileSize = materialFile.size;
      materialData.mimeType = materialFile.mimetype;
      materialData.cloudinaryPublicId = materialFile.filename; // Cloudinary public ID
      materialData.cloudinaryUrl = materialFile.path; // Cloudinary URL
    } else if (externalUrl) {
      materialData.externalUrl = externalUrl;
    }

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

// @desc    Stream material file for student (proxied through server – no client redirect)
// @route   GET /api/student/materials/:id/download
// @access  Private (Student)
const downloadMaterialForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ status: 'error', message: 'Student profile not found' });
    }

    const material = await Material.findById(req.params.id);
    if (!material || !material.isActive) {
      return res.status(404).json({ status: 'error', message: 'Material not found' });
    }

    const fileUrl = material.cloudinaryUrl || material.fileUrl;
    if (!fileUrl) {
      return res.status(404).json({ status: 'error', message: 'File not found for this material' });
    }

    await material.incrementDownload();

    /* ── Helper: pipe a successful fetch response to the client ── */
    const streamToClient = (upstream) => {
      res.setHeader('Content-Type', material.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(material.fileName || 'material')}"`
      );
      res.setHeader('Cache-Control', 'private, no-store');
      Readable.fromWeb(upstream.body).pipe(res);
    };

    /* ── Strategy 1: plain server-to-Cloudinary fetch (no auth headers) ──
     *  Works for 'upload'-type (public) resources. The original 401 was
     *  caused by the browser forwarding the JWT to Cloudinary; a bare
     *  server-side request has no such header. */
    const directRes = await fetch(fileUrl);
    if (directRes.ok) {
      return streamToClient(directRes);
    }
    console.warn(`[download] Direct fetch ${directRes.status} for ${fileUrl}`);

    /* ── Strategy 2: signed CDN URL (handles Strict-Transformations) ── */
    if (material.cloudinaryPublicId) {
      const ext = material.fileName
        ? material.fileName.split('.').pop().toLowerCase()
        : (material.mimeType || '').split('/').pop() || 'pdf';

      // cloudinary.url with sign_url:true appends s--HASH-- to the CDN URL,
      // which satisfies Cloudinary accounts with Strict Transformations enabled.
      const signedCdnUrl = cloudinary.url(material.cloudinaryPublicId, {
        sign_url:      true,
        secure:        true,
        resource_type: 'image',   // PDFs stored via resource_type:'auto' become 'image'
        type:          'upload',
        format:        ext,
      });

      const signedCdnRes = await fetch(signedCdnUrl);
      if (signedCdnRes.ok) {
        return streamToClient(signedCdnRes);
      }
      console.warn(`[download] Signed CDN fetch ${signedCdnRes.status} for ${signedCdnUrl}`);

      /* ── Strategy 3: private download API URL ── */
      const apiDownloadUrl = cloudinary.utils.private_download_url(
        material.cloudinaryPublicId,
        ext,
        { resource_type: 'image' }
      );

      const apiRes = await fetch(apiDownloadUrl);
      if (apiRes.ok) {
        return streamToClient(apiRes);
      }
      console.error(`[download] All strategies failed. Last status: ${apiRes.status}`);
    }

    return res.status(502).json({
      status:  'error',
      message: 'Could not retrieve file from storage. Please contact support.',
    });

  } catch (error) {
    console.error('Download material for student error:', error);
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: 'Server error downloading material' });
    }
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