import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError } from '../../utils/toast';
import {
  UserIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.ACTIVITIES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data.activities || []);
        setUnreadCount(data.data.unreadCount || 0);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (activityIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.ACTIVITIES}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activityIds })
      });

      if (response.ok) {
        // Update local state to mark activities as read
        setActivities(prev => 
          prev.map(activity => 
            activityIds.includes(activity._id) 
              ? { ...activity, isRead: true }
              : activity
          )
        );
        setUnreadCount(prev => Math.max(0, prev - activityIds.length));
        showSuccess('Activities marked as read');
      }
    } catch (error) {
      console.error('Error marking activities as read:', error);
      showError('Failed to mark activities as read');
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'registration':
        return <UserIcon className="h-5 w-5" />;
      case 'assignment_submission':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'quiz_submission':
        return <QuestionMarkCircleIcon className="h-5 w-5" />;
      case 'message':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type, priority) => {
    if (priority === 'urgent') return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (priority === 'high') return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (priority === 'medium') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getStudentInitials = (student) => {
    if (!student) return '?';
    return `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 border border-white/20">
        <h3 className="text-xl lg:text-2xl font-bold text-white mb-6 lg:mb-8">Recent Activity</h3>
        <div className="space-y-4 lg:space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 lg:space-x-6 p-3 lg:p-4 animate-pulse">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gray-300/20"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h3 className="text-xl lg:text-2xl font-bold text-white">Recent Activity</h3>
        {unreadCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {unreadCount} unread
            </span>
            <button
              onClick={() => {
                const unreadIds = activities
                  .filter(activity => !activity.isRead)
                  .map(activity => activity._id);
                if (unreadIds.length > 0) {
                  markAsRead(unreadIds);
                }
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">No recent activities</p>
            <p className="text-sm">Student activities will appear here</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-4 lg:space-x-6 p-3 lg:p-4 rounded-xl transition-all duration-300 hover:bg-white/5 ${
                !activity.isRead ? 'bg-blue-500/10 border border-blue-500/20' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center border ${getActivityColor(activity.type, activity.priority)}`}>
                  {activity.student?.profileImage ? (
                    <img 
                      src={activity.student.profileImage} 
                      alt="Profile" 
                      className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm lg:text-base font-bold">
                      {getStudentInitials(activity.student)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm lg:text-lg text-white truncate">
                    {/* <span className="font-bold">
                      {activity.student ? `${activity.student.firstName} ${activity.student.lastName}` : 'Unknown Student'}
                    </span> */}
                    {' '}{activity.description}
                  </p>
                  {!activity.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <p className="text-xs lg:text-base text-gray-400">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                  
                  <div className="flex items-center space-x-1">
                    {getActivityIcon(activity.type)}
                    <span className="text-xs text-gray-500 capitalize">
                      {activity.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {activity.priority === 'urgent' && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                  )}
                </div>
                
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {activity.metadata.isLate && (
                      <span className="text-red-400 mr-2">⚠️ Late submission</span>
                    )}
                    {activity.metadata.attachmentsCount > 0 && (
                      <span className="text-blue-400 mr-2">📎 {activity.metadata.attachmentsCount} attachment(s)</span>
                    )}
                  </div>
                )}
              </div>
              
              {!activity.isRead && (
                <button
                  onClick={() => markAsRead([activity._id])}
                  className="text-blue-400 hover:text-blue-300 p-1 rounded"
                  title="Mark as read"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivities; 