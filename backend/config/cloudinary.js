const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for material files
const materialStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'at-ict/materials',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }],
    chunk_size: 6000000, // 6MB chunks for large files
    eager: [{ quality: 'auto' }]
  },
});

// Configure storage for thumbnails
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'at-ict/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [{ 
      width: 300, 
      height: 200, 
      crop: 'fill',
      quality: 'auto'
    }]
  },
});

// Create multer upload instances with increased limits
const uploadMaterial = multer({ 
  storage: materialStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    fieldSize: 100 * 1024 * 1024 // 100MB field size
  }
});
const uploadThumbnail = multer({ 
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
    fieldSize: 10 * 1024 * 1024
  }
});

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Function to get file URL from Cloudinary
const getFileUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

module.exports = {
  cloudinary,
  uploadMaterial,
  uploadThumbnail,
  deleteFromCloudinary,
  getFileUrl
};


