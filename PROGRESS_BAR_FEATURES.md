# Progress Bar Features Documentation

## Overview

This document describes the progress bar features implemented for upload and download operations in the AT-ICT Learning Management System.

## Features Implemented

### 1. Upload Progress Tracking

#### Teacher's Materials Center
- **Real-time Progress**: Shows upload progress as files are being uploaded to Cloudinary
- **Visual Feedback**: Progress bar with percentage completion
- **Multiple Locations**: 
  - Main view progress indicator
  - Modal upload progress
- **Status Messages**: Clear indication of upload status

#### Progress Bar Components
- **Reusable ProgressBar Component**: `client/src/components/shared/ProgressBar.jsx`
- **Reusable LoadingSpinner Component**: `client/src/components/shared/LoadingSpinner.jsx`

### 2. Download Progress Tracking

#### Student's Materials Tab
- **Download Status**: Shows when a download is in progress
- **Progress Visualization**: Progress bar for download operations
- **Multiple Views**:
  - Card view download progress
  - Detail modal download progress
- **Success Feedback**: Toast notifications for successful downloads

### 3. Cloudinary Integration

#### Upload Process
1. **File Selection**: User selects file(s) to upload
2. **Progress Tracking**: XMLHttpRequest tracks upload progress
3. **Cloudinary Storage**: Files uploaded directly to Cloudinary
4. **Database Update**: Material information stored in database
5. **Success Feedback**: Progress bar completes, success message shown

#### Download Process
1. **Download Request**: User clicks download button
2. **Progress Indication**: Loading spinner and progress bar shown
3. **Cloudinary Redirect**: Backend redirects to Cloudinary URL
4. **File Access**: File opens in new tab/window
5. **Success Feedback**: Toast notification shown

## Components

### ProgressBar Component

```jsx
<ProgressBar 
  progress={75}           // Progress percentage (0-100)
  label="Uploading..."    // Optional label
  showPercentage={true}   // Show/hide percentage
  size="default"          // "small", "default", "large"
  color="blue"           // "blue", "green", "red", "yellow", "purple"
  className=""           // Additional CSS classes
/>
```

### LoadingSpinner Component

```jsx
<LoadingSpinner 
  size="default"         // "small", "default", "large"
  color="white"          // "white", "blue", "green", "gray"
  className=""           // Additional CSS classes
  text="Loading..."      // Optional text
/>
```

## Implementation Details

### Upload Progress Tracking

#### XMLHttpRequest Implementation
```javascript
const xhr = new XMLHttpRequest();

xhr.upload.addEventListener('progress', (event) => {
  if (event.lengthComputable) {
    const progress = Math.round((event.loaded / event.total) * 100);
    setUploadProgress(progress);
  }
});
```

#### State Management
```javascript
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
```

### Download Progress Tracking

#### State Management
```javascript
const [downloadingMaterials, setDownloadingMaterials] = useState(new Set());
const [downloadProgress, setDownloadProgress] = useState({});
```

#### Download Function
```javascript
const handleDownload = async (materialId, fileName) => {
  // Add to downloading set
  setDownloadingMaterials(prev => new Set(prev).add(materialId));
  
  try {
    // Download logic
    window.open(response.url, '_blank');
    showSuccess('Download started successfully!');
  } finally {
    // Remove from downloading set
    setDownloadingMaterials(prev => {
      const newSet = new Set(prev);
      newSet.delete(materialId);
      return newSet;
    });
  }
};
```

## User Experience Features

### Visual Feedback
- **Smooth Animations**: Progress bars animate smoothly
- **Color Coding**: Different colors for different operations
- **Loading States**: Clear indication of ongoing operations
- **Success States**: Confirmation when operations complete

### Accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: All progress indicators are keyboard accessible
- **High Contrast**: Progress bars have good contrast ratios

### Responsive Design
- **Mobile Friendly**: Progress bars work well on mobile devices
- **Adaptive Sizing**: Different sizes for different contexts
- **Touch Friendly**: Large enough touch targets

## Error Handling

### Upload Errors
- **File Size Validation**: Prevents oversized uploads
- **File Type Validation**: Ensures only allowed file types
- **Network Error Handling**: Graceful handling of network issues
- **Progress Reset**: Progress resets on error

### Download Errors
- **Authentication Errors**: Handles expired tokens
- **File Not Found**: Graceful handling of missing files
- **Network Issues**: Retry mechanisms for failed downloads

## Performance Considerations

### Optimizations
- **Debounced Updates**: Progress updates are optimized
- **Memory Management**: Proper cleanup of progress states
- **Efficient Rendering**: Minimal re-renders during progress updates

### Cloudinary Benefits
- **CDN Delivery**: Fast global file delivery
- **Automatic Optimization**: Files are optimized automatically
- **Scalable Storage**: No storage limits on server

## Usage Examples

### Teacher Upload
```jsx
// In MaterialsCenter.jsx
{uploading && (
  <ProgressBar 
    progress={uploadProgress}
    label="Uploading..."
    color="blue"
    size="default"
  />
)}
```

### Student Download
```jsx
// In MaterialsTab.jsx
{downloadingMaterials.has(material._id) ? (
  <div className="space-y-2">
    <LoadingSpinner size="small" color="white" text="Downloading..." />
    <ProgressBar 
      progress={downloadProgress[material._id] || 0}
      showPercentage={false}
      color="blue"
      size="small"
    />
  </div>
) : (
  <button onClick={() => handleDownload(material._id, material.fileName)}>
    Download
  </button>
)}
```

## Future Enhancements

### Planned Features
1. **Cancel Operations**: Allow users to cancel uploads/downloads
2. **Resume Uploads**: Resume interrupted uploads
3. **Batch Operations**: Progress tracking for multiple file operations
4. **Advanced Analytics**: Detailed progress analytics
5. **Custom Themes**: User-configurable progress bar themes

### Technical Improvements
1. **WebSocket Integration**: Real-time progress updates
2. **Service Worker**: Background progress tracking
3. **Offline Support**: Progress tracking for offline operations
4. **Advanced Error Recovery**: Automatic retry mechanisms

## Troubleshooting

### Common Issues

1. **Progress Bar Not Updating**
   - Check if XMLHttpRequest is properly configured
   - Verify event listeners are attached
   - Ensure state updates are working

2. **Download Progress Not Showing**
   - Verify material ID is correct
   - Check if downloadingMaterials set is being updated
   - Ensure progress state is properly managed

3. **Cloudinary Integration Issues**
   - Verify environment variables are set
   - Check Cloudinary credentials
   - Ensure proper redirect handling

### Debug Commands
```javascript
// Check upload progress
console.log('Upload Progress:', uploadProgress);

// Check downloading materials
console.log('Downloading Materials:', Array.from(downloadingMaterials));

// Check download progress
console.log('Download Progress:', downloadProgress);
```

---

**Implementation Complete!** 🎉

The progress bar features provide a smooth, user-friendly experience for file uploads and downloads, with comprehensive visual feedback and error handling.
