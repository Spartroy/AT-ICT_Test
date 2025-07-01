import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Helper functions moved outside component for reuse
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

const ScheduleTab = ({ studentData }) => {
  const [schedule, setSchedule] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const scheduleContainerRef = useRef(null);
  const modalRef = useRef(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchSchedule();
    // Set current day as selected
    const currentDay = getCurrentDay();
    const currentDayIndex = days.findIndex(day => day === currentDay);
    if (currentDayIndex !== -1) {
      setSelectedDayIndex(currentDayIndex);
    }
  }, []);

  const handleSessionClick = (e, session) => {
    e.stopPropagation();
    if (!scheduleContainerRef.current) return;

    const cardRect = e.currentTarget.getBoundingClientRect();
    const containerRect = scheduleContainerRef.current.getBoundingClientRect();
    
    setModalPosition({
      top: cardRect.bottom - containerRect.top + 10,
      left: cardRect.left - containerRect.left + cardRect.width / 2,
    });
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };
    if (selectedSession) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedSession]);

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
        setTodaySchedule(data.data.todaySchedule || []);
        setUpcomingSessions(data.data.upcomingSessions || []);
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



  const getTodayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getCurrentDay = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const SessionCard = ({ session, size = 'normal' }) => {
    const config = getSessionTypeConfig(session.type);

    if (size === 'large') {
      return (
        <div className={`${config.lightBg} border-l-8 ${config.borderColor} rounded-xl p-12 space-y-8 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50`}>
          <div className="flex flex-col space-y-6">
            <span className={`${config.bgColor} ${config.textColor} px-8 py-4 rounded-xl text-3xl font-bold self-start shadow-xl`}>
              {config.color}
            </span>
            <div className="text-6xl font-bold text-white drop-shadow-lg">
              {formatTime(session.startTime)}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-white text-4xl leading-tight drop-shadow-lg">{session.topic}</h3>
          </div>
        </div>
      );
    }

    // NEW COMPACT CARD FOR WEEK VIEW
    return (
      <div className={`${config.lightBg} rounded-3xl p-5 shadow-lg border-l-4 ${config.borderColor} flex flex-col text-center space-y-3 min-h-[180px] justify-center transition-all hover:shadow-2xl hover:scale-105`}>
        <span className={`${config.bgColor} ${config.textColor} px-4 py-1 rounded-xl text-sm font-bold self-center`}>
            {config.color}
        </span>
        <div className="text-2xl font-bold text-white pt-2">
            {formatTime(session.startTime)}
        </div>
      </div>
    );
  };

  const DayNavigation = () => (
    <div className="flex items-center justify-between bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12 border-2 border-[#CA133E]/40">
      <button
        onClick={() => setSelectedDayIndex(prev => prev > 0 ? prev - 1 : 6)}
        className="p-3 sm:p-4 lg:p-6 rounded-xl bg-[#CA133E]/30 hover:bg-[#CA133E]/50 transition-colors border-2 border-[#CA133E]/60"
      >
        <ChevronLeftIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-[#CA133E]" />
      </button>
      
      <div className="text-center flex-1 px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
          {days[selectedDayIndex]}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg xl:text-2xl text-gray-300 mt-2 sm:mt-3">
          <span className="hidden sm:inline">Tap to view day</span>
          <span className="sm:hidden">Day view</span>
        </p>
      </div>
      
      <button
        onClick={() => setSelectedDayIndex(prev => prev < 6 ? prev + 1 : 0)}
        className="p-3 sm:p-4 lg:p-6 rounded-xl bg-[#CA133E]/30 hover:bg-[#CA133E]/50 transition-colors border-2 border-[#CA133E]/60"
      >
        <ChevronRightIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-[#CA133E]" />
      </button>
    </div>
  );

  const WeekView = () => (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-3 sm:p-4 lg:p-6 border-2 border-gray-700">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
        {shortDays.map((day, index) => (
          <div
            key={day}
            className={`text-center py-2 sm:py-3 lg:py-4 px-1 sm:px-2 lg:px-3 rounded-xl sm:rounded-xl font-medium sm:font-bold text-xs sm:text-sm lg:text-lg xl:text-2xl transition-all shadow-lg ${
              days[index] === getCurrentDay()
                ? 'bg-[#CA133E] text-white shadow-[#CA133E]/50'
                : 'bg-gray-700 text-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        {days.map((day, dayIndex) => {
          const daySchedule = schedule.schedule.find(d => d.day === day) || { day, sessions: [] };
          const isToday = day === getCurrentDay();
          
          return (
            <div
              key={day}
              className={`rounded-xl border-2 transition-all min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] flex flex-col p-3 sm:p-4 space-y-3 sm:space-y-4 ${
                isToday 
                  ? 'bg-[#CA133E]/20 border-[#CA133E] shadow-2xl shadow-[#CA133E]/20' 
                  : 'bg-gray-900/40 border-gray-700/80'
              }`}
            >
              {/* Day name for mobile/tablet */}
              <div className="lg:hidden text-center">
                <h3 className="font-bold text-white text-base sm:text-lg">{day}</h3>
              </div>
              
              {daySchedule.sessions.length === 0 ? (
                <div className="flex-grow flex items-center justify-center h-full">
                  <p className="text-gray-400 font-medium sm:font-semibold text-sm sm:text-base lg:text-lg text-center">No classes</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {daySchedule.sessions.map((session, sessionIndex) => (
                    <button 
                      key={sessionIndex} 
                      onClick={(e) => handleSessionClick(e, session)}
                      className="w-full"
                    >
                      <ResponsiveSessionCard session={session} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const DayView = () => {
    const selectedDay = days[selectedDayIndex];
    const daySchedule = schedule.schedule.find(d => d.day === selectedDay) || { day: selectedDay, sessions: [] };
    
    return (
      <div>
        <DayNavigation />
        
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 lg:p-12 border-2 border-[#CA133E]/40">
          <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold text-white mb-6 sm:mb-8 lg:mb-12 drop-shadow-lg text-center">
            {selectedDay} Classes
          </h3>
          
          {daySchedule.sessions.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-24">
              <CalendarDaysIcon className="h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 text-gray-400 mx-auto mb-4 sm:mb-6 lg:mb-8" />
              <p className="text-gray-300 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">No classes scheduled</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {daySchedule.sessions.map((session, sessionIndex) => (
                <div key={sessionIndex} className="sm:hidden">
                  <DaySessionCard session={session} />
                </div>
              ))}
              <div className="hidden sm:block space-y-6 lg:space-y-8">
                {daySchedule.sessions.map((session, sessionIndex) => (
                  <SessionCard
                    key={sessionIndex}
                    session={session}
                    size="large"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-8 py-16">
        <div className="text-center py-32">
          <div className="animate-spin rounded-full h-32 w-32 border-b-8 border-[#CA133E] mx-auto"></div>
          <p className="text-white mt-12 text-4xl font-bold drop-shadow-lg">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full mx-auto px-8 py-16">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-16 border-2 border-[#CA133E]/40">
          <div className="text-center">
            <ExclamationCircleIcon className="h-32 w-32 text-[#CA133E] mx-auto mb-8" />
            <h3 className="text-5xl font-bold text-white mb-8 drop-shadow-lg">Error Loading Schedule</h3>
            <p className="text-gray-300 mb-12 text-2xl">{error}</p>
            <button
              onClick={fetchSchedule}
              className="bg-[#CA133E] text-white px-12 py-6 rounded-xl hover:bg-[#A01030] transition-colors text-2xl font-bold shadow-2xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="max-w-full mx-auto px-8 py-16">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-20 text-center border-2 border-[#CA133E]/40">
          <CalendarDaysIcon className="h-40 w-40 text-gray-400 mx-auto mb-12" />
          <h3 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">No Schedule Available</h3>
          <p className="text-gray-300 text-3xl">Your class schedule hasn't been created yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 lg:space-y-16">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-[20pt] font-bold text-white flex items-center justify-center lg:justify-start mb-2 drop-shadow-lg">
          <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 mr-2 sm:mr-3 lg:mr-4 text-[#CA133E]" />
          Weekly Schedule
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-300 mt-2">
          View your class schedule in weekly or daily format
        </p>
      </div>

      {/* View Toggle - Responsive */}
      <div className="flex justify-center">
        <div className="flex bg-gray-800/60 rounded-xl p-1 sm:p-2 border border-gray-600/50">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-xl font-medium sm:font-bold text-sm sm:text-base lg:text-lg xl:text-xl transition-all ${
              viewMode === 'week' 
                ? 'bg-[#CA133E] text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="hidden sm:inline">Week View</span>
            <span className="sm:hidden">Week</span>
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-xl font-medium sm:font-bold text-sm sm:text-base lg:text-lg xl:text-xl transition-all ${
              viewMode === 'day' 
                ? 'bg-[#CA133E] text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="hidden sm:inline">Day View</span>
            <span className="sm:hidden">Day</span>
          </button>
        </div>
      </div>

      <div ref={scheduleContainerRef} className="relative">
        {/* Schedule Views */}
        {viewMode === 'week' ? <WeekView /> : <DayView />}
        
        {/* Session Detail Popover */}
        <AnimatePresence>
          {selectedSession && (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: -10, x: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.2 }}
              className="absolute z-50"
              style={{
                top: `${modalPosition.top}px`,
                left: `${modalPosition.left}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <SessionDetailModal session={selectedSession} onClose={handleCloseModal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Today's Schedule & Upcoming Sessions */}
      <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Today's Schedule */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-xl shadow-2xl border-2 border-blue-500/40 p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-200 mb-4 sm:mb-6 flex items-center justify-center drop-shadow-lg">
            <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-300" />
            Today ({getTodayName()})
          </h2>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <CalendarDaysIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400/50 mx-auto mb-4" />
              <p className="text-blue-300 text-base sm:text-lg lg:text-xl font-bold">No sessions today</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {todaySchedule.map((session, index) => (
                <div key={index} className="sm:hidden">
                  <TodaySessionCard session={session} />
                </div>
              ))}
              <div className="hidden sm:block space-y-4">
                {todaySchedule.map((session, index) => (
                  <SessionCard key={index} session={session} size="large" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 rounded-xl shadow-2xl border-2 border-green-500/40 p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-200 mb-4 sm:mb-6 flex items-center justify-center drop-shadow-lg">
            <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-green-300" />
            Upcoming Sessions
          </h2>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <DocumentTextIcon className="h-12 w-12 sm:h-16 sm:w-16 text-green-400/50 mx-auto mb-4" />
              <p className="text-green-300 text-base sm:text-lg lg:text-xl font-bold">No upcoming sessions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingSessions.slice(0, 6).map((session, index) => (
                <div key={index} className="bg-gray-800/60 rounded-xl p-3 sm:p-4 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
                  <div className="text-center">
                    <UpcomingSessionCard session={session} />
                    {session.date && (
                      <div className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-green-200 font-bold">
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {schedule.lastUpdatedBy && (
        <div className="text-center text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300">
          <strong>Last updated on </strong>
          <span className="text-sm sm:text-base lg:text-lg">
            {new Date(schedule.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      )}
    </div>
  );
};

const SessionDetailModal = ({ session, onClose }) => {
  const getSessionTypeConfig = (type) => {
    const types = {
      theory: { 
        icon: BookOpenIcon, 
        color: 'Theory',
        bgColor: 'bg-blue-600', 
        textColor: 'text-blue-100',
        borderColor: 'border-blue-400'
      },
      practical: { 
        icon: ComputerDesktopIcon, 
        color: 'Practical',
        bgColor: 'bg-green-600', 
        textColor: 'text-green-100',
        borderColor: 'border-green-400'
      },
      revision: { 
        icon: AcademicCapIcon, 
        color: 'Revision',
        bgColor: 'bg-purple-600', 
        textColor: 'text-purple-100',
        borderColor: 'border-purple-400'
      },
      quiz: { 
        icon: DocumentTextIcon, 
        color: 'Quiz',
        bgColor: 'bg-[#CA133E]', 
        textColor: 'text-red-100',
        borderColor: 'border-red-500'
      }
    };
    return types[type] || types.theory;
  };

  const config = getSessionTypeConfig(session.type);
  const Icon = config.icon;

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-[#2a1a1a] w-96 rounded-xl shadow-2xl border border-gray-700 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 relative">
        <div className={`p-3 rounded-xl ${config.bgColor} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="font-bold text-lg">{config.color} Session</p>
          <p className="text-md text-gray-300">{session.topic}</p>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-600/50 transition-colors">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Body */}
      <div className={`p-5 border-t-2 ${config.borderColor}`}>
        <div className="flex items-center text-lg text-gray-200">
          <ClockIcon className="h-6 w-6 mr-3 text-gray-400" />
          <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
        </div>
        
        {session.description && (
          <div className="flex items-start text-md text-gray-300 mt-4">
            <InformationCircleIcon className="h-6 w-6 mr-3 text-gray-400 flex-shrink-0 mt-1" />
            <p>{session.description}</p>
          </div>
        )}
      </div>
      
      
    </div>
  );
};

// Responsive Session Card Components
const ResponsiveSessionCard = ({ session }) => {
  const config = getSessionTypeConfig(session.type);

  return (
    <div className={`${config.lightBg} rounded-xl p-3 sm:p-4 lg:p-5 shadow-lg border-l-4 ${config.borderColor} transition-all hover:shadow-xl hover:scale-105`}>
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <span className={`${config.bgColor} ${config.textColor} px-2 sm:px-3 lg:px-4 py-1 rounded-xl text-xs sm:text-sm font-bold text-center`}>
            {config.color}
          </span>
        </div>
        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">
          {formatTime(session.startTime)}
        </div>
      </div>
    </div>
  );
};

const TodaySessionCard = ({ session }) => {
  const config = getSessionTypeConfig(session.type);

  return (
    <div className={`${config.lightBg} border-l-4 ${config.borderColor} rounded-xl p-4 space-y-3 shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-xl text-sm font-bold`}>
          {config.color}
        </span>
        <div className="text-lg font-bold text-white">
          {formatTime(session.startTime)}
        </div>
      </div>
      {session.topic && (
        <h3 className="font-bold text-white text-base">{session.topic}</h3>
      )}
    </div>
  );
};

const DaySessionCard = ({ session }) => {
  const config = getSessionTypeConfig(session.type);

  return (
    <div className={`${config.lightBg} border-l-6 ${config.borderColor} rounded-xl p-6 space-y-4 shadow-xl`}>
      <div className="flex flex-col space-y-3">
        <span className={`${config.bgColor} ${config.textColor} px-4 py-2 rounded-xl text-lg font-bold self-start`}>
          {config.color}
        </span>
        <div className="text-3xl font-bold text-white">
          {formatTime(session.startTime)}
        </div>
      </div>
      {session.topic && (
        <h3 className="font-bold text-white text-2xl">{session.topic}</h3>
      )}
    </div>
  );
};

const UpcomingSessionCard = ({ session }) => {
  const config = getSessionTypeConfig(session.type);

  return (
    <div className={`${config.lightBg} rounded-xl p-3 sm:p-4 shadow-lg border-l-4 ${config.borderColor} transition-all hover:shadow-xl`}>
      <div className="text-center space-y-2 sm:space-y-3">
        <span className={`${config.bgColor} ${config.textColor} px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold`}>
          {config.color}
        </span>
        <div className="text-base sm:text-lg lg:text-xl font-bold text-white">
          {formatTime(session.startTime)}
        </div>
        {session.topic && (
          <div className="text-xs sm:text-sm text-gray-300 truncate">
            {session.topic}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTab; 