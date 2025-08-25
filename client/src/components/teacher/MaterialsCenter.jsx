import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { getValidToken, clearAuth, redirectToLogin, setAuthHeaders } from '../../utils/auth';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import ProgressBar from '../shared/ProgressBar';
import LoadingSpinner from '../shared/LoadingSpinner';
import {
  DocumentTextIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  TagIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const MaterialsCenter = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'theory',
    file: null,
    thumbnail: null
  });

  const materialTypes = [
    { value: 'theory', label: 'Theory', icon: AcademicCapIcon, color: 'blue' },
    { value: 'practical', label: 'Practical', icon: ComputerDesktopIcon, color: 'green' },
    { value: 'other', label: 'Other', icon: DocumentTextIcon, color: 'gray' }
  ];



  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = getValidToken();
      
      if (!token) {
        console.error('Authentication token is missing or invalid');
        setLoading(false);
        clearAuth();
        setTimeout(() => {
          redirectToLogin('invalid_token');
        }, 100);
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.TEACHER.MATERIALS, {
        headers: setAuthHeaders({
          'Content-Type': 'application/json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data.materials || []);
      } else {
        console.error('Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        showError('File size must be less than 100MB');
        return;
      }
      
      // Show file info
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      setFormData({ ...formData, file });
    }
  };

  const handleThumbnailSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 2MB for thumbnails)
      if (file.size > 2 * 1024 * 1024) {
        showError('Thumbnail size must be less than 2MB');
        return;
      }
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        showError('Thumbnail must be an image file');
        return;
      }
      
      setFormData({ ...formData, thumbnail: file });
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!formData.file && !editingMaterial) {
      showError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const token = getValidToken();
      
      if (!token) {
        showWarning('Authentication token is missing or invalid. Please log in again.');
        clearAuth();
        redirectToLogin('invalid_token');
        return;
      }
      
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('type', formData.type);
      
      if (formData.file) {
        uploadData.append('material', formData.file);
      }

      if (formData.thumbnail) {
        uploadData.append('thumbnail', formData.thumbnail);
      }

      const url = editingMaterial 
        ? `${API_ENDPOINTS.TEACHER.MATERIALS}/${editingMaterial._id}`
        : API_ENDPOINTS.TEACHER.MATERIALS;
      
      const method = editingMaterial ? 'PUT' : 'POST';

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Set timeout for large files (5 minutes)
        xhr.timeout = 300000; // 5 minutes
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            console.log(`Upload progress: ${progress}%`);
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload response status:', xhr.status);
          console.log('Upload response:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              showSuccess(`Material ${editingMaterial ? 'updated' : 'uploaded'} successfully!`);
              
              if (editingMaterial) {
                setMaterials(materials.map(m => m._id === editingMaterial._id ? data.data.material : m));
              } else {
                setMaterials([data.data.material, ...materials]);
              }
              
              setShowUploadModal(false);
              setEditingMaterial(null);
              setFormData({
                title: '',
                type: 'theory',
                file: null,
                thumbnail: null
              });
              
              // Reset file inputs
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              if (thumbnailInputRef.current) {
                thumbnailInputRef.current.value = '';
              }
              
              setUploadProgress(0);
              resolve(data);
            } catch (error) {
              console.error('Error parsing response:', error);
              showError('Error processing response');
              reject(error);
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload error response:', errorData);
              showError(errorData.message || `Upload failed with status ${xhr.status}`);
            } catch (error) {
              console.error('Upload failed with status:', xhr.status);
              showError(`Upload failed with status ${xhr.status}`);
            }
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', (error) => {
          console.error('XHR error:', error);
          showError('Network error during upload. Please check your connection and try again.');
          reject(new Error('Network error'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('Upload timeout');
          showError('Upload timed out. Please try again with a smaller file or check your connection.');
          reject(new Error('Upload timeout'));
        });

        xhr.addEventListener('abort', () => {
          showError('Upload was cancelled');
          reject(new Error('Upload cancelled'));
        });

        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        // Add additional headers for better compatibility
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        
        console.log('Starting upload to:', url);
        console.log('Upload data size:', uploadData.get('material')?.size || 'unknown');
        
        xhr.send(uploadData);
      });

    } catch (error) {
      console.error('Error uploading material:', error);
      showError('Error uploading material');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.MATERIALS}/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Material deleted successfully!');
        setMaterials(materials.filter(m => m._id !== materialId));
      } else {
        const errorData = await response.json();
        showError(errorData.message);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      showError('Error deleting material');
    }
  };

  const editMaterial = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      type: material.type,
      file: null,
      thumbnail: null
    });
    setShowUploadModal(true);
  };

  const downloadMaterial = async (material) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.MATERIALS}/${material._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        redirect: 'follow'
      });

      if (response.ok) {
        // For Cloudinary redirects, we need to open the URL directly
        // The backend will redirect to the Cloudinary URL
        window.open(response.url, '_blank');
        showSuccess('Download started successfully!');
      } else {
        showError('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      showError('Error downloading material');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📊';
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📈';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('video')) return '🎥';
    if (mimeType?.includes('audio')) return '🎵';
    return '📁';
  };

  const filteredMaterials = materials.filter(material => {
    const matchesType = filter === 'all' || material.type === filter;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
            <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-4"></div>
            <div className="h-20 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white flex items-center">
            <FolderIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
            Materials Center
          </h2>
          <p className="text-sm text-gray-300 mt-1">Upload and manage learning materials for students</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
            />
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploading}
            className="flex items-center justify-center space-x-2 bg-blue-600 font-bold text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                <span>Upload Material</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Progress Bar for Main View */}
      {uploading && (
        <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-600/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Uploading Material...</span>
            <span className="text-sm text-blue-400 font-medium">{uploadProgress}%</span>
          </div>
          <ProgressBar 
            progress={uploadProgress}
            showPercentage={false}
            color="blue"
            size="large"
          />
          <p className="text-xs text-gray-400 mt-1">Please wait while your file is being uploaded...</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
          >
            <option value="all">All Types</option>
            {materialTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-gray-300 sm:ml-auto">
          <span>{filteredMaterials.length} materials</span>
          <span>•</span>
          <span>{materials.filter(m => m.type === 'theory').length} theory</span>
          <span>•</span>
          <span>{materials.filter(m => m.type === 'practical').length} practical</span>
          <span>•</span>
          <span>{materials.filter(m => m.type === 'other').length} other</span>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full bg-gray-900/50 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-700/50">
            <DocumentTextIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm || filter !== 'all' 
                ? 'No matching materials' 
                : 'No Materials Yet'
              }
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first learning material to get started.'
              }
            </p>
            {(!searchTerm && filter === 'all') && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                Upload Material
              </button>
            )}
          </div>
        ) : (
          filteredMaterials.map((material, index) => {
            const typeConfig = materialTypes.find(t => t.value === material.type);
            const TypeIcon = typeConfig?.icon || DocumentTextIcon;
            
            return (
              <motion.div
                key={material._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/70 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl bg-${typeConfig?.color || 'gray'}-900/50`}>
                      <TypeIcon className={`h-5 w-5 sm:h-6 sm:w-6 text-${typeConfig?.color || 'gray'}-400`} />
                    </div>
                    <div>
                      <span className="text-xl sm:text-2xl">{getFileIcon(material.mimeType)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      onClick={() => downloadMaterial(material)}
                      className="p-2 text-green-400 hover:bg-green-500/20 rounded-xl transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => editMaterial(material)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(material._id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">
                      {material.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${typeConfig?.color || 'gray'}-900/50 text-${typeConfig?.color || 'gray'}-300`}>
                      {typeConfig?.label || material.type}
                    </span>
                    <span className="text-gray-400">{formatFileSize(material.fileSize)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-400">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    <span>{material.downloadCount || 0} downloads</span>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                    Uploaded {new Date(material.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {editingMaterial ? 'Edit Material' : 'Upload New Material'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setEditingMaterial(null);
                      setFormData({
                        title: '',
                        type: 'theory',
                        file: null,
                        thumbnail: null
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (thumbnailInputRef.current) {
                        thumbnailInputRef.current.value = '';
                      }
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUploadMaterial} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    File {!editingMaterial && '*'}
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="material-file-upload"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                      required={!editingMaterial}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('material-file-upload').click()}
                      className="flex flex-col items-center space-y-2 w-full"
                    >
                      {editingMaterial && !formData.file ? (
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{getFileIcon(editingMaterial.mimeType)}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{editingMaterial.fileName}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(editingMaterial.fileSize)}</p>
                            <p className="text-xs text-blue-400 mt-1">Click to replace file</p>
                          </div>
                        </div>
                      ) : formData.file ? (
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-green-900/50 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{getFileIcon(formData.file.type)}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{formData.file.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(formData.file.size)}</p>
                            <p className="text-xs text-blue-400 mt-1">Click to change file</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-12 w-12 text-gray-500" />
                          <span className="text-sm text-gray-400">Click to select file</span>
                          <span className="text-xs text-gray-500">
                            PDF, Word, PowerPoint, Excel, Text, ZIP (Max: 100MB)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thumbnail (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      id="thumbnail-file-upload"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('thumbnail-file-upload').click()}
                      className="flex flex-col items-center space-y-2 w-full"
                    >
                      {editingMaterial && !formData.thumbnail && editingMaterial.thumbnailUrl ? (
                        <div className="flex items-center space-x-2">
                          <img 
                            src={`${API_ENDPOINTS.BASE_URL}${editingMaterial.thumbnailUrl}`}
                            alt="Current thumbnail" 
                            className="h-16 w-16 object-cover rounded-xl"
                          />
                          <div>
                            <p className="text-sm text-gray-400">Current thumbnail</p>
                            <p className="text-xs text-blue-400">Click to change</p>
                          </div>
                        </div>
                      ) : formData.thumbnail ? (
                        <div className="flex items-center space-x-2">
                          <img 
                            src={URL.createObjectURL(formData.thumbnail)} 
                            alt="Thumbnail preview" 
                            className="h-16 w-16 object-cover rounded-xl"
                          />
                          <div>
                            <p className="text-sm text-gray-400">{formData.thumbnail.name}</p>
                            <p className="text-xs text-blue-400">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="h-16 w-16 bg-gray-800/70 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🖼️</span>
                          </div>
                          <span className="text-sm text-gray-400">Click to select thumbnail</span>
                          <span className="text-xs text-gray-500">
                            JPEG, PNG, GIF (Max: 2MB)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    placeholder="Introduction to Programming"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    required
                  >
                    {materialTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Upload Progress Bar */}
                {uploading && (
                  <ProgressBar 
                    progress={uploadProgress}
                    label="Uploading..."
                    color="blue"
                    size="default"
                  />
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setEditingMaterial(null);
                      setFormData({
                        title: '',
                        type: 'theory',
                        file: null,
                        thumbnail: null
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (thumbnailInputRef.current) {
                        thumbnailInputRef.current.value = '';
                      }
                    }}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Uploading...' : (editingMaterial ? 'Update Material' : 'Upload Material')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsCenter; 