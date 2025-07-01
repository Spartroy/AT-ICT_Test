import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TrophyIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  BookOpenIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const DashboardOverview = ({ studentData, stats }) => {
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  useEffect(() => {
    fetchRecentAnnouncements();
  }, []);

  const fetchRecentAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Get the 3 most recent announcements
        setRecentAnnouncements((data.data.announcements || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching recent announcements:', error);
    }
  };

  const summaryCards = [
    {
      title: 'Assignments',
      completed: stats?.assignments?.completedAssignments || 0,
      total: stats?.assignments?.totalAssignments || 0,
      pending: stats?.assignments?.pendingAssignments || 0,
      icon: DocumentTextIcon,
      color: 'blue'
    },
    {
      title: 'Quizzes',
      completed: stats?.quizzes?.completedQuizzes || 0,
      total: stats?.quizzes?.totalQuizzes || 0,
      pending: stats?.quizzes?.pendingQuizzes || 0,
      icon: AcademicCapIcon,
      color: 'green'
    },
    {
      title: 'Announcements',
      completed: (stats?.announcements?.totalAnnouncements || 0) - (stats?.announcements?.unreadAnnouncements || 0),
      total: stats?.announcements?.totalAnnouncements || 0,
      pending: stats?.announcements?.unreadAnnouncements || 0,
      icon: MegaphoneIcon,
      color: 'purple'
    },
    // {
    //   title: 'Marks Average',
    //   completed: Math.round(stats?.assignments?.avgScore || 0),
    //   total: 100,
    //   pending: 0,
    //   icon: TrophyIcon,
    //   color: 'purple'
    // },
    // {
    //   title: 'Progress',
    //   completed: studentData?.studentInfo?.overallProgress || 0,
    //   total: 100,
    //   pending: 100 - (studentData?.studentInfo?.overallProgress || 0),
    //   icon: ChartBarIcon,
    //   color: 'orange'
    // }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Summary Cards
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-7xl justify-center">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          const percentage = card.total > 0 ? (card.completed / card.total) * 100 : 0;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/60 rounded-xl p-4 sm:p-5 lg:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50 flex flex-col items-center w-full max-w-xs mx-auto"
            >
              <div className="flex flex-col items-center mb-3 sm:mb-4 w-full">
                <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-${card.color}-400 mb-2`} />
                <div className="text-center w-full">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {card.title === 'Marks Average' ? `${card.completed}%` : `${card.completed}/${card.total}`}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">{card.title}</div>
                </div>
              </div>

              <div className="mb-2 sm:mb-3 w-full">
                <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${card.color}-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {card.pending > 0 && (
                <div className="text-xs sm:text-sm text-red-400 text-center w-full">
                  Pending: {card.pending}
                </div>
              )}
            </motion.div>
          );
        })}
        </div>
      </div> */}

      {/* Recent Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/60 rounded-xl p-4 sm:p-5 lg:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50 w-full"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
            <MegaphoneIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
            Recent Announcements
          </h3>
          {stats?.announcements?.unreadAnnouncements > 0 && (
            <span className="bg-red-500/30 text-red-300 px-2 py-1 rounded-full text-xs font-medium">
              {stats.announcements.unreadAnnouncements} unread
            </span>
          )}
        </div>
        
        {recentAnnouncements.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <MegaphoneIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-sm sm:text-base">No recent announcements</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentAnnouncements.map((announcement, index) => (
              <div
                key={announcement._id}
                className={`p-3 sm:p-4 border-l-4 rounded-xl ${
                  announcement.priority === 'urgent' 
                    ? 'border-l-red-400 bg-red-500/20' 
                    : announcement.isPinned
                    ? 'border-l-yellow-400 bg-yellow-500/20'
                    : 'border-l-blue-400 bg-blue-500/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm sm:text-base font-medium text-white truncate">
                        {announcement.title}
                      </h4>
                      {announcement.priority === 'urgent' && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                      {announcement.isPinned && (
                        <span className="text-xs flex-shrink-0">📌</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
            
            
          </div>
        )}
      </motion.div>

      {/* Weekly Schedule */}
      <DashboardScheduleWidget />
    </div>
  );
};

// Helper functions for schedule functionality
const getSessionTypeConfig = (type) => {
  const types = {
    theory: { 
      icon: BookOpenIcon, 
      color: 'Theory',
      bgColor: 'bg-blue-600', 
      lightBg: 'bg-blue-900/30',
      textColor: 'text-white',
      borderColor: 'border-blue-400'
    },
    practical: { 
      icon: ComputerDesktopIcon, 
      color: 'Practical',
      bgColor: 'bg-green-600', 
      lightBg: 'bg-green-900/30',
      textColor: 'text-white',
      borderColor: 'border-green-400'
    },
    revision: { 
      icon: AcademicCapIcon, 
      color: 'Revision',
      bgColor: 'bg-purple-600', 
      lightBg: 'bg-purple-900/30',
      textColor: 'text-white',
      borderColor: 'border-purple-400'
    },
    quiz: { 
      icon: DocumentTextIcon, 
      color: 'Quiz',
      bgColor: 'bg-[#CA133E]', 
      lightBg: 'bg-red-900/30',
      textColor: 'text-white',
      borderColor: 'border-red-500'
    }
  };
  return types[type] || types.theory;
};

const formatTime = (timeString) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getCurrentDay = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};

// Dashboard Schedule Session Card Component
const DashboardSessionCard = ({ session }) => {
  const config = getSessionTypeConfig(session.type);

  return (
    <div className={`${config.lightBg} rounded-xl p-2 sm:p-3 shadow-md border-l-4 ${config.borderColor} transition-all hover:shadow-lg`}>
      <div className="text-center space-y-1 sm:space-y-2">
        <span className={`${config.bgColor} ${config.textColor} px-2 py-1 rounded-xl text-xs font-bold block`}>
          {config.color}
        </span>
        <div className="text-sm sm:text-base font-bold text-white">
          {formatTime(session.startTime)}
        </div>

      </div>
    </div>
  );
};

// Dashboard Schedule Widget Component
const DashboardScheduleWidget = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.SCHEDULE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.data.schedule);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Error fetching schedule');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/60 rounded-xl p-4 sm:p-5 lg:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50 w-full"
      >
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
          <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#CA133E]" />
          Weekly Schedule
        </h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {shortDays.map((day) => (
              <div key={day} className="h-8 bg-gray-700/50 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-16 bg-gray-700/50 rounded"></div>
                <div className="h-16 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !schedule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/60 rounded-xl p-4 sm:p-5 lg:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50 w-full"
      >
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
          <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#CA133E]" />
          Weekly Schedule
        </h3>
        <div className="text-center py-8">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">{error || 'No schedule available'}</p>
          {error && (
            <button
              onClick={fetchSchedule}
              className="mt-4 px-4 py-2 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 lg:p-6 shadow-2xl border-2 border-gray-700 w-full"
    >
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
        <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#CA133E]" />
        Weekly Schedule
      </h3>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
        {shortDays.map((day, index) => (
          <div
            key={day}
            className={`text-center py-1 sm:py-2 px-1 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              days[index] === getCurrentDay()
                ? 'bg-[#CA133E] text-white shadow-lg'
                : 'bg-gray-700 text-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 sm:gap-3">
        {days.map((day, dayIndex) => {
          const daySchedule = schedule.schedule?.find(d => d.day === day) || { day, sessions: [] };
          const isToday = day === getCurrentDay();
          
          return (
            <div
              key={day}
              className={`rounded-xl border-2 transition-all min-h-[120px] sm:min-h-[140px] flex flex-col p-2 sm:p-3 space-y-2 ${
                isToday 
                  ? 'bg-[#CA133E]/20 border-[#CA133E] shadow-lg' 
                  : 'bg-gray-900/40 border-gray-700/80'
              }`}
            >
              {/* Day name for mobile/tablet */}
              <div className="md:hidden text-center">
                <h4 className="font-bold text-white text-xs sm:text-sm">{day.substring(0, 3)}</h4>
              </div>
              
              {daySchedule.sessions.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-gray-400 font-medium text-xs text-center">No classes</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {daySchedule.sessions.slice(0, 2).map((session, sessionIndex) => (
                    <DashboardSessionCard key={sessionIndex} session={session} />
                  ))}
                  {daySchedule.sessions.length > 2 && (
                    <div className="text-center py-1">
                      <span className="text-xs text-gray-400">+{daySchedule.sessions.length - 2} more</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DashboardOverview; 