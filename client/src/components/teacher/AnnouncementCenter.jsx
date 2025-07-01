import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  MegaphoneIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AnnouncementCenter = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    scheduledFor: '',
    expiresAt: '',
    isPinned: false,
    tags: []
  });

  const announcementTypes = [
    { value: 'general', label: 'General', color: 'bg-blue-900/50 text-blue-300' },
    { value: 'assignment', label: 'Assignment', color: 'bg-green-900/50 text-green-300' },
    { value: 'exam', label: 'Exam', color: 'bg-red-900/50 text-red-300' },
    { value: 'holiday', label: 'Holiday', color: 'bg-yellow-900/50 text-yellow-300' },
    { value: 'deadline', label: 'Deadline', color: 'bg-orange-900/50 text-orange-300' },
    { value: 'meeting', label: 'Meeting', color: 'bg-purple-900/50 text-purple-300' },
    { value: 'important', label: 'Important', color: 'bg-pink-900/50 text-pink-300' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-gray-400' },
    { value: 'medium', label: 'Medium', color: 'text-blue-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.MANAGEMENT}/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = [];
    
    if (!formData.title.trim()) {
      validationErrors.push('Title is required');
    } else if (formData.title.trim().length < 5) {
      validationErrors.push('Title must be at least 5 characters');
    } else if (formData.title.trim().length > 200) {
      validationErrors.push('Title cannot exceed 200 characters');
    }
    
    if (!formData.content.trim()) {
      validationErrors.push('Content is required');
    } else if (formData.content.trim().length < 10) {
      validationErrors.push('Content must be at least 10 characters');
    }
    
    const validTypes = ['general', 'assignment', 'exam', 'holiday', 'deadline', 'meeting', 'important'];
    if (!validTypes.includes(formData.type)) {
      validationErrors.push('Invalid announcement type');
    }
    
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (formData.priority && !validPriorities.includes(formData.priority)) {
      validationErrors.push('Invalid priority level');
    }
    
    const validAudiences = ['all', 'students', 'parents', 'specific'];
    if (!validAudiences.includes(formData.targetAudience)) {
      validationErrors.push('Invalid target audience');
    }
    
    if (validationErrors.length > 0) {
      alert(`❌ Please fix these validation errors:\n\n${validationErrors.map(err => `• ${err}`).join('\n')}`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        scheduledFor: formData.scheduledFor || new Date().toISOString(),
        expiresAt: formData.expiresAt || undefined
      };
      
      console.log('Sending announcement payload:', payload);
      
      const response = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        alert('✅ Announcement created successfully!');
        setAnnouncements([responseData.data.announcement, ...announcements]);
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          type: 'general',
          priority: 'medium',
          targetAudience: 'all',
          scheduledFor: '',
          expiresAt: '',
          isPinned: false,
          tags: []
        });
      } else {
        console.error('Validation errors:', responseData);
        
        // Handle validation errors more gracefully
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const errorMessages = responseData.errors.map(error => `• ${error.msg}`).join('\n');
          alert(`❌ Please fix these validation errors:\n\n${errorMessages}`);
        } else {
          alert(`❌ Error: ${responseData.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('❌ Error creating announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Announcement deleted successfully!');
        setAnnouncements(announcements.filter(ann => ann._id !== id));
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('❌ Error deleting announcement');
    }
  };

  const getTypeColor = (type) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'bg-gray-700 text-gray-300';
  };

  const getPriorityColor = (priority) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    return priorityConfig ? priorityConfig.color : 'text-gray-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white flex items-center">
            <MegaphoneIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
            Announcement Center
          </h2>
          <p className="text-sm text-gray-300">Create and manage announcements for students and parents</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-blue-900/40 rounded-xl p-3 sm:p-4 border border-blue-700/50">
          <div className="flex items-center">
            <MegaphoneIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-400">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-white">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-900/40 rounded-xl p-3 sm:p-4 border border-green-700/50">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 flex-shrink-0" />
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-400">Published</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {announcements.filter(a => a.isPublished).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/40 rounded-xl p-3 sm:p-4 border border-yellow-700/50">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 flex-shrink-0" />
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-400">Pinned</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {announcements.filter(a => a.isPinned).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-900/40 rounded-xl p-3 sm:p-4 border border-red-700/50">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 flex-shrink-0" />
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-red-400">Urgent</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {announcements.filter(a => a.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-700/50">
            <MegaphoneIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Announcements Yet</h3>
            <p className="text-gray-400 mb-4">Create your first announcement to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Create Announcement
            </button>
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/70 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{announcement.title}</h3>
                    {announcement.isPinned && (
                      <span className="bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                        Pinned
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    <span className={`text-xs sm:text-sm font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 line-clamp-2">{announcement.content}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>{announcement.targetAudience}</span>
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span>{announcement.metadata?.views || 0} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 lg:ml-4">
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(announcement);
                      setShowViewModal(true);
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-semibold">Create New Announcement</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title * (5-200 characters)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={200}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white ${
                      formData.title.length > 0 && formData.title.length < 5 
                        ? 'border-red-500/50' 
                        : 'border-gray-600'
                    }`}
                    placeholder="Enter announcement title"
                  />
                  <p className="text-sm text-gray-500 mt-1 text-right">
                    {formData.title.length}/200
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Content * (minimum 10 characters)
                  </label>
                  <textarea
                    required
                    rows={4}
                    minLength={10}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white ${
                      formData.content.length > 0 && formData.content.length < 10 
                        ? 'border-red-500/50' 
                        : 'border-gray-600'
                    }`}
                    placeholder="Enter announcement content"
                  />
                  <p className="text-sm text-gray-500 mt-1 text-right">
                    {formData.content.length} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    >
                      {announcementTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    >
                      {priorityLevels.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                  >
                    <option value="all">All (Students & Parents)</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Publish Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600 rounded bg-gray-800/90"
                  />
                  <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-300">
                    Pin this announcement
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      formData.title.length < 5 || 
                      formData.content.length < 10 ||
                      !formData.title.trim() ||
                      !formData.content.trim()
                    }
                    className="px-4 py-2 rounded-xl transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Create Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Announcement Modal */}
      <AnimatePresence>
        {showViewModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Announcement Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {selectedAnnouncement.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedAnnouncement.type)}`}>
                        {selectedAnnouncement.type}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(selectedAnnouncement.priority)}`}>
                        {selectedAnnouncement.priority.toUpperCase()}
                      </span>
                      {selectedAnnouncement.isPinned && (
                        <span className="bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                          Pinned
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="font-medium text-white">{formatDate(selectedAnnouncement.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Target Audience</p>
                      <p className="font-medium text-white">{selectedAnnouncement.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Views</p>
                      <p className="font-medium text-white">{selectedAnnouncement.metadata?.views || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Likes</p>
                      <p className="font-medium text-white">{selectedAnnouncement.metadata?.totalLikes || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-700/80 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementCenter; 