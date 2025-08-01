import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess } from '../../utils/toast';
import {
  PlayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    type: '',
    program: '',
    contentType: '',
    phase: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'theory',
    videoUrl: '',
    phase: '',
    chapter: '',
    program: '',
    contentType: '',
    order: '',
    accessLevel: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [filters, pagination.current]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.program) params.append('program', filters.program);
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.phase) params.append('phase', filters.phase);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.current);
      params.append('limit', 10);

      const response = await fetch(`${API_ENDPOINTS.TEACHER.VIDEOS}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.data.videos);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      showError('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.VIDEOS}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchNextOrder = async (program, contentType) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('program', program);
      params.append('contentType', contentType);
      
      const response = await fetch(`${API_ENDPOINTS.TEACHER.VIDEOS}/next-order?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, order: data.data.nextOrder.toString() }));
      }
    } catch (error) {
      console.error('Error fetching next order:', error);
    }
  };

  const handleCreateVideo = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.videoUrl) {
        showError('Please fill in all required fields (Title, Video URL)');
        return;
      }

      if (formData.type === 'theory' && (!formData.phase || !formData.chapter)) {
        showError('Please select Phase and Chapter for theory videos');
        return;
      }

      if (formData.type === 'practical' && (!formData.program || !formData.contentType || !formData.order)) {
        showError('Please select Program, Type, and Order for practical videos');
        return;
      }

      // No additional validation needed for 'other' type

      console.log('Sending video data:', formData);
      
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.VIDEOS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess('Video created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchVideos();
        fetchStats();
      } else {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        showError(errorData.message || 'Failed to create video');
      }
    } catch (error) {
      console.error('Error creating video:', error);
      showError('Failed to create video');
    }
  };

  const handleUpdateVideo = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.videoUrl) {
        showError('Please fill in all required fields (Title, Video URL)');
        return;
      }

      if (formData.type === 'theory' && (!formData.phase || !formData.chapter)) {
        showError('Please select Phase and Chapter for theory videos');
        return;
      }

      if (formData.type === 'practical' && (!formData.program || !formData.contentType || !formData.order)) {
        showError('Please select Program, Type, and Order for practical videos');
        return;
      }

      // No additional validation needed for 'other' type

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.VIDEOS}/${selectedVideo._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess('Video updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchVideos();
        fetchStats();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      showError('Failed to update video');
    }
  };

  const handleDeleteVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.VIDEOS}/${selectedVideo._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Video deleted successfully');
        setShowDeleteModal(false);
        fetchVideos();
        fetchStats();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      showError('Failed to delete video');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'theory',
      videoUrl: '',
      phase: '',
      chapter: '',
      program: '',
      contentType: '',
      order: '',
      accessLevel: 'all'
    });
    setSelectedVideo(null);
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      type: video.type,
      videoUrl: video.videoUrl,
      phase: video.phase?.toString() || '',
      chapter: video.chapter?.toString() || '',
      program: video.program || '',
      contentType: video.contentType || '',
      order: video.order?.toString() || '',
      accessLevel: video.accessLevel || 'all',
      isActive: video.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVideoTypeIcon = (type) => {
    return type === 'theory' ? AcademicCapIcon : ComputerDesktopIcon;
  };

  const getAccessLevelIcon = (level) => {
    return level === 'all' ? GlobeAltIcon : LockClosedIcon;
  };

  const VideoCard = ({ video }) => {
    const TypeIcon = getVideoTypeIcon(video.type);
    const AccessIcon = getAccessLevelIcon(video.accessLevel);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 shadow-md transition-all hover:bg-gray-700/90 hover:border-gray-600"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <TypeIcon className="h-5 w-5 text-blue-400" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {video.type}
              </span>
              {video.type === 'theory' && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  Phase {video.phase} - Ch {video.chapter}
                </span>
              )}
              {video.type === 'practical' && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                  {video.program} - {video.contentType} - Order {video.order || 0}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">{video.title}</h3>
            
            {video.description && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{video.description}</p>
            )}
            
           
            

          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            <button
              onClick={() => openEditModal(video)}
              className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors"
              title="Edit video"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteModal(video)}
              className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-colors"
              title="Delete video"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white">Video Management</h2>
          <p className="text-sm lg:text-[14pt] text-gray-300 mt-1">Manage and organize your video library</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            {stats.totalVideos || 0} Videos
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Video</span>
          </motion.button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Videos</p>
              <p className="text-2xl font-bold text-white">{stats.totalVideos || 0}</p>
            </div>
            <PlayIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Theory Videos</p>
              <p className="text-2xl font-bold text-white">{stats.theoryVideos || 0}</p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Practical Videos</p>
              <p className="text-2xl font-bold text-white">{stats.practicalVideos || 0}</p>
            </div>
            <ComputerDesktopIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Videos</p>
              <p className="text-2xl font-bold text-white">{stats.activeVideos || 0}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
              {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
              </select>

              <select
                value={filters.program}
                onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Programs</option>
                <option value="word">Word</option>
                <option value="powerpoint">PowerPoint</option>
                <option value="access">Access</option>
                <option value="excel">Excel</option>
                <option value="sharepoint">SharePoint</option>
              </select>

              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Content Types</option>
                <option value="guide">Guide</option>
                <option value="task">Task</option>
              </select>

              <select
                value={filters.phase}
                onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Phases</option>
                <option value="1">Phase 1</option>
                <option value="2">Phase 2</option>
                <option value="3">Phase 3</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Videos List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <PlayIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No videos found</p>
            <p className="text-gray-500 text-sm">Add your first video to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Video Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {showCreateModal ? 'Add New Video' : 'Edit Video'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter video title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter video description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Video URL (Google Drive) *</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                </div>

                {formData.type === 'theory' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phase</label>
                      <select
                        value={formData.phase}
                        onChange={(e) => setFormData(prev => ({ ...prev, phase: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Phase</option>
                        <option value="1">Phase 1</option>
                        <option value="2">Phase 2</option>
                        <option value="3">Phase 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chapter</label>
                      <input
                        type="number"
                        value={formData.chapter}
                        onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'practical' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Program *</label>
                      <select
                        value={formData.program}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, program: e.target.value }));
                          if (e.target.value && formData.contentType) {
                            fetchNextOrder(e.target.value, formData.contentType);
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Program</option>
                        <option value="word">Word</option>
                        <option value="powerpoint">PowerPoint</option>
                        <option value="access">Access</option>
                        <option value="excel">Excel</option>
                        <option value="sharepoint">SharePoint</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                      <select
                        value={formData.contentType}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, contentType: e.target.value }));
                          if (e.target.value && formData.program) {
                            fetchNextOrder(formData.program, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="guide">Guide</option>
                        <option value="task">Task</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Order *</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
                    <select
                      value={formData.accessLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Students</option>
                      <option value="year10">Year 10</option>
                      <option value="year11">Year 11</option>
                      <option value="year12">Year 12</option>
                      <option value="specific">Specific Students</option>
                    </select>
                  </div>


                </div>

                {formData.accessLevel === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Specific Students (comma-separated IDs)</label>
                    <input
                      type="text"
                      value={formData.specificStudents}
                      onChange={(e) => setFormData(prev => ({ ...prev, specificStudents: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="student1_id, student2_id"
                    />
                  </div>
                )}

                {showEditModal && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-300">Active</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateVideo : handleUpdateVideo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {showCreateModal ? 'Create Video' : 'Update Video'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <TrashIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Delete Video</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteVideo}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoManagement; 