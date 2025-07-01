import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  MegaphoneIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  TrophyIcon,
  InformationCircleIcon,
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PaperClipIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  MegaphoneIcon as MegaphoneIconSolid
} from '@heroicons/react/24/solid';

const AnnouncementsTab = ({ studentData }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const announcementTypes = [
    { value: 'all', label: 'All', icon: MegaphoneIcon, color: 'text-gray-400' },
    { value: 'general', label: 'General', icon: InformationCircleIcon, color: 'text-blue-400' },
    { value: 'assignment', label: 'Assignment', icon: BookOpenIcon, color: 'text-green-400' },
    { value: 'exam', label: 'Exam', icon: AcademicCapIcon, color: 'text-red-400' },
    { value: 'holiday', label: 'Holiday', icon: CalendarIcon, color: 'text-purple-400' },
    { value: 'meeting', label: 'Meeting', icon: UserGroupIcon, color: 'text-indigo-400' },
    { value: 'important', label: 'Important', icon: ExclamationTriangleIcon, color: 'text-yellow-400' }
  ];

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-blue-400', 
    high: 'text-orange-400',
    urgent: 'text-red-400'
  };

  const priorityBadges = {
    low: 'bg-gray-700 text-gray-200',
    medium: 'bg-blue-900/50 text-blue-300',
    high: 'bg-orange-900/50 text-orange-300', 
    urgent: 'bg-red-900/50 text-red-300'
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data.announcements || []);
      } else {
        console.error('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (announcementId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update announcements list
        setAnnouncements(prev => prev.map(ann => 
          ann._id === announcementId 
            ? { ...ann, likeCount: data.data.likeCount, hasLiked: data.data.hasLiked }
            : ann
        ));
        
        // Update selected announcement if it's open
        if (selectedAnnouncement && selectedAnnouncement._id === announcementId) {
          setSelectedAnnouncement(prev => ({ 
            ...prev, 
            likeCount: data.data.likeCount, 
            hasLiked: data.data.hasLiked 
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (announcementId) => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewComment('');
        // Refresh the selected announcement to get updated comments
        fetchAnnouncementDetails(announcementId);
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const fetchAnnouncementDetails = async (announcementId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedAnnouncement(data.data.announcement);
      }
    } catch (error) {
      console.error('Error fetching announcement details:', error);
    }
  };

  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
    fetchAnnouncementDetails(announcement._id);
  };

  const getTypeIcon = (type) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : InformationCircleIcon;
  };

  const getTypeColor = (type) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'text-gray-400';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesFilter = filter === 'all' || announcement.type === filter;
    const matchesSearch = searchTerm === '' || 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded-xl w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded-xl w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
            <div className="h-4 bg-gray-700/50 rounded-xl w-3/4 mb-4"></div>
            <div className="h-20 bg-gray-700/50 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white flex items-center">
            <MegaphoneIconSolid className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-500" />
            Announcements
          </h2>
          <p className="text-sm sm:text-base lg:text-[14pt] text-gray-300 mt-1">Stay updated with the latest news and updates</p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative w-full sm:w-auto">
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-4 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white text-sm sm:text-base w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-6 min-w-max pb-2" style={{ overflow: 'visible' }}>
          {announcementTypes.map((type) => {
            const IconComponent = type.icon;
            const count = type.value === 'all' 
              ? announcements.length 
              : announcements.filter(a => a.type === type.value).length;
            
            return (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`
                  group inline-flex items-center py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200
                  ${filter === type.value
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }
                `}
              >
                <IconComponent
                  className={`
                    -ml-0.5 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200
                    ${filter === type.value
                      ? 'text-blue-500'
                      : `${type.color} group-hover:text-gray-400`
                    }
                  `}
                />
                <span className="hidden sm:inline">{type.label}</span>
                <span className="sm:hidden">{type.label.substring(0, 3)}</span>
                {count > 0 && (
                  <span className={`ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filter === type.value 
                      ? 'bg-blue-900/70 text-blue-300'
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Announcements List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-gray-800/60 rounded-xl shadow-lg p-8 sm:p-12 text-center backdrop-blur-sm border-2 border-gray-600/50">
            <MegaphoneIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No matching announcements' : 'No announcements yet'}
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Your teachers haven\'t posted any announcements yet.'
              }
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement, index) => {
            const TypeIcon = getTypeIcon(announcement.type);
            
            return (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-900/70 backdrop-blur-md rounded-xl shadow-lg border-l-4 p-4 sm:p-6 hover:shadow-xl transition-all cursor-pointer ${
                  announcement.isPinned ? 'border-l-yellow-400 bg-yellow-900/20' : 'border-l-blue-400'
                }`}
                onClick={() => openAnnouncementModal(announcement)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <TypeIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${getTypeColor(announcement.type)} flex-shrink-0`} />
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">{announcement.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {announcement.isPinned && (
                          <span className="bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                            📌 Pinned
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[announcement.priority]}`}>
                          {announcement.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-300 mb-4 line-clamp-2">{announcement.content}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500">By</span>
                          <span className="ml-1 font-medium text-gray-300">{announcement.createdBy?.firstName} {announcement.createdBy?.lastName}</span>
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>{announcement.metadata?.views || 0} views</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(announcement._id);
                            }}
                            className={`flex items-center space-x-1 ${
                              announcement.hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            {announcement.hasLiked ? (
                              <HeartIconSolid className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                            <span className="text-xs sm:text-sm">{announcement.likeCount || 0}</span>
                          </button>
                          
                          <div className="flex items-center space-x-1 text-gray-400">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-sm">{announcement.commentCount || 0}</span>
                          </div>
                        </div>
                        
                        <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Announcement Detail Modal */}
      <AnimatePresence>
        {showModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 backdrop-blur-md border border-gray-700 text-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mt-2 sm:mt-0"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {React.createElement(getTypeIcon(selectedAnnouncement.type), {
                          className: `h-5 w-5 sm:h-6 sm:w-6 ${getTypeColor(selectedAnnouncement.type)} flex-shrink-0`
                        })}
                        <h3 className="text-lg sm:text-xl font-semibold text-white line-clamp-2">{selectedAnnouncement.title}</h3>
                      </div>
                      {selectedAnnouncement.isPinned && (
                        <span className="bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium self-start">
                          📌 Pinned
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[selectedAnnouncement.priority]}`}>
                        {selectedAnnouncement.priority.toUpperCase()}
                      </span>
                      <span>By {selectedAnnouncement.createdBy?.firstName} {selectedAnnouncement.createdBy?.lastName}</span>
                      <span>{formatDate(selectedAnnouncement.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-white p-1 flex-shrink-0"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="prose prose-invert max-w-none mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                {/* Attachments */}
                {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm sm:text-base font-medium text-white mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedAnnouncement.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/70 rounded-xl">
                          <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-white truncate flex-1">{attachment.originalName}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">({attachment.size} bytes)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Like and Comment Actions */}
                <div className="border-t border-gray-700 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <button
                        onClick={() => toggleLike(selectedAnnouncement._id)}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-colors text-sm ${
                          selectedAnnouncement.hasLiked 
                            ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {selectedAnnouncement.hasLiked ? (
                          <HeartIconSolid className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                        <span>{selectedAnnouncement.likeCount || 0} Likes</span>
                      </button>
                      
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{selectedAnnouncement.metadata?.views || 0} Views</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-medium text-white">
                      Comments ({selectedAnnouncement.comments?.length || 0})
                    </h4>
                    
                    {/* Add Comment */}
                    <div className="flex space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center ring-2 ring-blue-500/50 flex-shrink-0">
                        <span className="text-sm font-medium text-blue-300">
                          {studentData?.firstName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-2 sm:p-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/90 text-white resize-none text-sm sm:text-base"
                          rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => addComment(selectedAnnouncement._id)}
                            disabled={!newComment.trim() || submittingComment}
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
                          >
                            {submittingComment ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                      {selectedAnnouncement.comments?.map((comment, index) => (
                        <div key={index} className="flex space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700/80 rounded-full flex items-center justify-center ring-2 ring-gray-600/50 flex-shrink-0">
                            <span className="text-xs sm:text-sm font-medium text-gray-300">
                              {comment.user?.firstName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-800/70 rounded-xl p-2 sm:p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <span className="text-xs sm:text-sm font-medium text-white">
                                  {comment.user?.firstName} {comment.user?.lastName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-300">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsTab; 