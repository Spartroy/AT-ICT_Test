# Upload Troubleshooting Guide

## Problem: CORS and 502 Bad Gateway Errors

### Symptoms
- CORS policy errors when uploading large files
- 502 Bad Gateway errors
- Network errors during upload
- Upload timeouts

### Root Causes
1. **CORS Configuration**: Backend not properly configured for Vercel domain
2. **File Size Limits**: Railway/Express limits exceeded
3. **Request Timeouts**: Large files taking too long to upload
4. **Cloudinary Configuration**: Not optimized for large files

## Solutions Implemented

### 1. CORS Configuration Fixed

#### Backend Changes (`backend/server.js`)
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL, 'https://at-ict-test.vercel.app']
    : ['http://localhost:3000', 'https://at-ict-test.vercel.app'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### 2. File Size Limits Increased

#### Express Limits (`backend/server.js`)
```javascript
app.use(express.json({ 
  limit: '100mb'  // Increased from 10mb
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb'  // Increased from 10mb
}));
```

#### Multer Limits (`backend/config/cloudinary.js`)
```javascript
const uploadMaterial = multer({ 
  storage: materialStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    fieldSize: 100 * 1024 * 1024 // 100MB field size
  }
});
```

### 3. Cloudinary Optimization

#### Chunked Uploads (`backend/config/cloudinary.js`)
```javascript
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
```

### 4. Frontend Improvements

#### Enhanced Error Handling (`client/src/components/teacher/MaterialsCenter.jsx`)
```javascript
// Set timeout for large files (5 minutes)
xhr.timeout = 300000; // 5 minutes

// Better error logging
xhr.addEventListener('error', (error) => {
  console.error('XHR error:', error);
  showError('Network error during upload. Please check your connection and try again.');
});

xhr.addEventListener('timeout', () => {
  console.error('Upload timeout');
  showError('Upload timed out. Please try again with a smaller file or check your connection.');
});
```

## Railway Configuration

### Environment Variables
Add these to your Railway project:

```
NODE_ENV=production
CLIENT_URL=https://at-ict-test.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_FILE_SIZE=100mb
UPLOAD_TIMEOUT=300000
```

### Railway Configuration File (`backend/railway.json`)
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  },
  "environments": {
    "production": {
      "variables": {
        "MAX_FILE_SIZE": "100mb",
        "UPLOAD_TIMEOUT": "300000"
      }
    }
  }
}
```

## Testing Steps

### 1. Test Health Endpoint
```bash
curl https://at-icttest-production.up.railway.app/health
```

### 2. Test CORS
```bash
curl -H "Origin: https://at-ict-test.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://at-icttest-production.up.railway.app/api/teacher/materials
```

### 3. Test Small File Upload
- Try uploading a small file (< 1MB) first
- Check browser console for errors
- Verify progress bar works

### 4. Test Large File Upload
- Try uploading a 25MB file
- Monitor progress bar
- Check for timeouts

## Debugging Commands

### Frontend Debugging
```javascript
// Check file size
console.log('File size:', file.size);

// Check upload progress
console.log('Upload progress:', progress);

// Check XHR status
console.log('XHR status:', xhr.status);
console.log('XHR response:', xhr.responseText);
```

### Backend Debugging
```javascript
// Check request size
console.log('Request size:', req.headers['content-length']);

// Check file info
console.log('File info:', req.files);

// Check Cloudinary response
console.log('Cloudinary response:', result);
```

## Common Issues and Solutions

### Issue 1: CORS Error
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: 
1. Verify CORS configuration in `backend/server.js`
2. Check that your Vercel domain is in the allowed origins
3. Ensure environment variables are set correctly

### Issue 2: 502 Bad Gateway
**Error**: `POST /api/teacher/materials net::ERR_FAILED 502`

**Solution**:
1. Check Railway logs for errors
2. Verify file size limits are set correctly
3. Check Cloudinary credentials
4. Ensure all environment variables are set

### Issue 3: Upload Timeout
**Error**: `Upload timed out`

**Solution**:
1. Increase timeout in frontend (already set to 5 minutes)
2. Check network connection
3. Try uploading smaller files first
4. Consider chunking large files

### Issue 4: File Size Too Large
**Error**: `File size must be less than 100MB`

**Solution**:
1. Check file size before upload
2. Consider compressing files
3. Use Cloudinary's optimization features

## Performance Optimization

### For Large Files
1. **Chunked Uploads**: Files are uploaded in 6MB chunks
2. **Progress Tracking**: Real-time progress updates
3. **Timeout Handling**: 5-minute timeout for large files
4. **Error Recovery**: Graceful error handling

### For Better Performance
1. **File Compression**: Compress files before upload
2. **Image Optimization**: Use Cloudinary's automatic optimization
3. **CDN Delivery**: Files served from Cloudinary's global CDN

## Monitoring

### Health Check
```bash
curl https://at-icttest-production.up.railway.app/health
```

### Railway Logs
Check Railway dashboard for:
- Application logs
- Error logs
- Performance metrics

### Cloudinary Dashboard
Monitor:
- Upload success rates
- File storage usage
- Bandwidth usage

## Next Steps

1. **Deploy Changes**: Push updated code to Railway
2. **Test Uploads**: Try uploading files of various sizes
3. **Monitor Performance**: Watch for errors in logs
4. **Optimize Further**: Consider additional optimizations if needed

---

**Troubleshooting Complete!** 🔧

These changes should resolve the CORS and upload issues you're experiencing with large files.
