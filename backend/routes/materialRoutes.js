const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Create uploads directories if they don't exist
const materialsDir = path.join(__dirname, '../uploads/materials');
const thumbnailsDir = path.join(__dirname, '../uploads/materials/thumbnails');
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, materialsDir);
    }
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'thumbnail') {
    // For thumbnails, only allow images
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid thumbnail type. Only JPEG, PNG, GIF, and WebP images are allowed for thumbnails.'), false);
    }
  } else {
    // For material files, allow document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'audio/mpeg',
      'audio/wav'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Excel, Text, ZIP, RAR, Image, Video, and Audio files are allowed.'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Validation middleware
const validateMaterial = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  body('type')
    .isIn(['theory', 'practical', 'other'])
    .withMessage('Type must be theory, practical, or other')
];

// Teacher Routes
router.get('/', protect, (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Teacher role required.' 
    });
  }
  next();
}, getMaterials);

router.post('/', protect, (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Teacher role required.' 
    });
  }
  next();
}, upload.fields([
  { name: 'material', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateMaterial, uploadMaterial);

router.put('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Teacher role required.' 
    });
  }
  next();
}, upload.fields([
  { name: 'material', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), validateMaterial, updateMaterial);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Teacher role required.' 
    });
  }
  next();
}, deleteMaterial);

router.get('/:id/download', protect, (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Teacher role required.' 
    });
  }
  next();
}, downloadMaterial);

module.exports = router; 