const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
  getMaterialsForStudent,
  downloadMaterialForStudent
} = require('../controllers/materialController');
const { uploadMaterial: cloudinaryUploadMaterial } = require('../config/cloudinary');

// Validation middleware
const validateMaterial = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('type')
    .isIn(['theory', 'practical', 'other'])
    .withMessage('Type must be theory, practical, or other')
];

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error) {
    console.error('Multer error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'File upload error'
    });
  }
  next();
};

// Routes
router.get('/', protect, getMaterials);

// Upload material with Cloudinary
router.post('/', protect, 
  (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. Teacher role required.' 
      });
    }
    next();
  },
  cloudinaryUploadMaterial.fields([
    { name: 'material', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  handleMulterError,
  validateMaterial,
  uploadMaterial
);

router.put('/:id', protect, 
  (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. Teacher role required.' 
      });
    }
    next();
  },
  validateMaterial,
  updateMaterial
);

router.delete('/:id', protect, 
  (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. Teacher role required.' 
      });
    }
    next();
  },
  deleteMaterial
);

router.get('/:id/download', protect, 
  (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. Teacher role required.' 
      });
    }
    next();
  }, 
  downloadMaterial
);

module.exports = router; 