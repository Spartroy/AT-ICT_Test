const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Organize files by type
    if (file.fieldname === 'assignment') {
      uploadPath += 'assignments/';
    } else if (file.fieldname === 'homework') {
      uploadPath += 'homework/';
    } else if (file.fieldname === 'quiz') {
      uploadPath += 'quizzes/';
    } else if (file.fieldname === 'profile') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'announcement') {
      uploadPath += 'announcements/';
    } else if (file.fieldname === 'files') {
      uploadPath += 'chat/';
    } else if (file.fieldname === 'material') {
      uploadPath += 'materials/';
    } else if (file.fieldname === 'thumbnail') {
      uploadPath += 'materials/thumbnails/';
    } else {
      uploadPath += 'general/';
    }

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
    'text/plain': true,
    'text/csv': true,
    'application/zip': true,
    'application/x-zip-compressed': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/mp3': true,
    'audio/mp4': true,
    'video/mp4': true,
    'video/avi': true,
    'video/mov': true,
    'video/wmv': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE) || 100;
      return res.status(400).json({
        status: 'error',
        message: `File too large. Maximum size is ${maxSizeMB}MB.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: 'File upload error: ' + err.message
    });
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError
}; 