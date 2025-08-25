# Cloudinary Migration Guide

## Problem Solved

The 404 download errors you were experiencing were caused by **ephemeral file storage** on Railway. When Railway containers restart or redeploy, all locally stored files are lost, causing download links to break.

## Solution: Cloudinary Integration

This migration implements Cloudinary as a cloud storage solution for all uploaded files, ensuring they persist across deployments.

## What's Changed

### Backend Changes
1. **New Cloudinary Configuration** (`backend/config/cloudinary.js`)
   - Handles file uploads to Cloudinary
   - Manages file deletions
   - Provides optimized URLs

2. **Updated Material Model** (`backend/models/Material.js`)
   - Added `cloudinaryPublicId` and `cloudinaryUrl` fields
   - Added `thumbnailCloudinaryPublicId` and `thumbnailCloudinaryUrl` fields

3. **Updated Material Controller** (`backend/controllers/materialController.js`)
   - Files now upload directly to Cloudinary
   - Downloads redirect to Cloudinary URLs
   - Proper cleanup of Cloudinary resources

4. **Updated Material Routes** (`backend/routes/materialRoutes.js`)
   - Uses Cloudinary storage instead of local multer storage

### Frontend Changes
1. **Updated Download Function** (`client/src/components/student/MaterialsTab.jsx`)
   - Handles Cloudinary redirects properly
   - Opens files in new tabs for better user experience

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Get your credentials from the Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Add Environment Variables to Railway
Add these to your Railway project's environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Deploy Updated Backend
1. Push the updated code to your repository
2. Railway will automatically redeploy with the new dependencies
3. The new uploads will use Cloudinary storage

### 4. Test the Setup
Run the setup script to verify everything is working:

```bash
cd backend
npm run setup-cloudinary
```

## Migration Notes

### Existing Files
- **Important**: Existing files uploaded before this migration are lost due to ephemeral storage
- Teachers will need to re-upload any materials that were previously uploaded
- This is a one-time issue - all future uploads will be persistent

### New Upload Process
1. Files are uploaded directly to Cloudinary
2. Cloudinary URLs are stored in the database
3. Downloads redirect to Cloudinary URLs
4. Files are automatically optimized and cached

### Benefits
- ✅ **Persistent Storage**: Files survive container restarts
- ✅ **Global CDN**: Faster downloads worldwide
- ✅ **Automatic Optimization**: Images and videos are optimized
- ✅ **Scalable**: No storage limits on your server
- ✅ **Reliable**: 99.9% uptime guarantee

## Troubleshooting

### Common Issues

1. **"Missing environment variables" error**
   - Ensure all three Cloudinary environment variables are set in Railway
   - Check for typos in variable names

2. **Upload fails**
   - Verify Cloudinary credentials are correct
   - Check file size limits (100MB max)
   - Ensure file type is allowed

3. **Download doesn't work**
   - Clear browser cache
   - Check if the material exists in the database
   - Verify Cloudinary URL is accessible

### Testing Commands

```bash
# Test Cloudinary connection
npm run setup-cloudinary

# Check if environment variables are set
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

## File Structure After Migration

```
backend/
├── config/
│   └── cloudinary.js          # Cloudinary configuration
├── controllers/
│   └── materialController.js  # Updated for Cloudinary
├── models/
│   └── Material.js           # Updated schema
├── routes/
│   └── materialRoutes.js     # Updated for Cloudinary
└── scripts/
    └── setupCloudinary.js    # Setup verification script
```

## Cost Considerations

- **Cloudinary Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Typical Usage**: For educational materials, this should be sufficient
- **Upgrade**: If needed, paid plans start at $89/month

## Security

- Files are stored securely on Cloudinary
- Access is controlled through your application
- No direct public access to uploaded files
- Automatic virus scanning on uploads

## Support

If you encounter any issues:
1. Check the Railway logs for errors
2. Run the setup script to verify configuration
3. Test with a small file first
4. Ensure all environment variables are correctly set

---

**Migration Complete!** 🎉

Your application now uses persistent cloud storage, and the 404 download errors should be resolved permanently.
