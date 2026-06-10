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

const getSessionTypeConfig = (type) => {
  const types = {
    theory:    { icon: BookOpenIcon,        color: 'Theory',    bgColor: 'bg-blue-600',    lightBg: 'bg-blue-500/10',   textColor: 'text-white', borderColor: 'border-blue-400' },
    practical: { icon: ComputerDesktopIcon, color: 'Practical', bgColor: 'bg-emerald-600', lightBg: 'bg-emerald-500/10', textColor: 'text-white', borderColor: 'border-emerald-400' },
    revision:  { icon: AcademicCapIcon,     color: 'Revision',  bgColor: 'bg-purple-600',  lightBg: 'bg-purple-500/10', textColor: 'text-white', borderColor: 'border-purple-400' },
    quiz:      { icon: DocumentTextIcon,    color: 'Quiz',      bgColor: 'bg-[#CA133E]',   lightBg: 'bg-red-500/10',   textColor: 'text-white', borderColor: 'border-red-500' },
  };
  return types[type] || types.theory;
};

const formatTime = (timeString) =>
  new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

const ScheduleTab = ({ studentData }) => {
  const [schedule, setSchedule]               = useState(null);
  const [todaySchedule, setTodaySchedule]     = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode]               = useState('week');
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalPosition, setModalPosition]     = useState({ top: 0, left: 0 });
  const scheduleContainerRef = useRef(null);
  const modalRef             = useRef(null);

  const days      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchSchedule();
    const idx = days.findIndex(d => d === getCurrentDay());
    if (idx !== -1) setSelectedDayIndex(idx);
  }, []);

  const handleSessionClick = (e, session) => {
    e.stopPropagation();
    if (!scheduleContainerRef.current) return;
    const cardRect      = e.currentTarget.getBoundingClientRect();
    const containerRect = scheduleContainerRef.current.getBoundingClientRect();
    setModalPosition({
      top:  cardRect.bottom - containerRect.top + 10,
      left: cardRect.left   - containerRect.left + cardRect.width / 2,
    });
    setSelectedSession(session);
  };

  const handleCloseModal = () => setSelectedSession(null);

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) handleCloseModal();
    };
    if (selectedSession) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedSession]);

  const fetchSchedule = async () => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.STUDENT.SCHEDULE, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.data.schedule);
        setTodaySchedule(data.data.todaySchedule || []);
        setUpcomingSessions(data.data.upcomingSessions || []);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to fetch schedule');
      }
    } catch {
      setError('Error fetching schedule');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const WeekView = () => (
    <div className="bg-[#161616] border border-white/5 rounded-xl p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
        {shortDays.map((day, index) => (
          <div
            key={day}
            className={`text-center py-2 px-1 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              days[index] === getCurrentDay()
                ? 'bg-[#CA133E] text-white'
                : 'bg-white/5 text-gray-400'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3">
        {days.map((day) => {
          const daySchedule = schedule.schedule.find(d => d.day === day) || { day, sessions: [] };
          const isToday = day === getCurrentDay();
          return (
            <div
              key={day}
              className={`rounded-xl border transition-all min-h-[140px] flex flex-col p-2 sm:p-3 gap-1.5 ${
                isToday
                  ? 'bg-[#CA133E]/10 border-[#CA133E]/40'
                  : 'bg-white/2 border-white/5'
              }`}
            >
              <div className="lg:hidden text-center">
                <p className="text-xs font-medium text-gray-400">{day}</p>
              </div>
              {daySchedule.sessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-600 text-xs text-center">No classes</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {daySchedule.sessions.map((session, i) => (
                    <button key={i} onClick={(e) => handleSessionClick(e, session)} className="w-full text-left">
                      <SessionChip session={session} />
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
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-[#161616] border border-white/5 rounded-xl p-3">
          <button
            onClick={() => setSelectedDayIndex(prev => prev > 0 ? prev - 1 : 6)}
            className="p-2 rounded-lg bg-[#CA133E]/20 hover:bg-[#CA133E]/30 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-[#CA133E]" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white">{selectedDay}</h2>
            <p className="text-xs text-gray-500">{daySchedule.sessions.length} sessions</p>
          </div>
          <button
            onClick={() => setSelectedDayIndex(prev => prev < 6 ? prev + 1 : 0)}
            className="p-2 rounded-lg bg-[#CA133E]/20 hover:bg-[#CA133E]/30 transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-[#CA133E]" />
          </button>
        </div>

        <div className="bg-[#161616] border border-white/5 rounded-xl p-4">
          {daySchedule.sessions.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDaysIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No classes scheduled for {selectedDay}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySchedule.sessions.map((session, i) => (
                <SessionRow key={i} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-xl animate-pulse w-40" />
        <div className="bg-[#161616] border border-white/5 rounded-xl h-48 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-xl p-8 text-center">
        <ExclamationCircleIcon className="h-10 w-10 text-[#CA133E] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white mb-2">Error Loading Schedule</h3>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button onClick={fetchSchedule} className="px-5 py-2 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl text-sm font-medium transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-xl p-10 text-center">
        <CalendarDaysIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-white mb-2">No Schedule Available</h3>
        <p className="text-gray-500 text-sm">Your class schedule hasn't been created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-[#CA133E]" />
            Weekly Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your class timetable</p>
        </div>
        <div className="flex bg-[#1A1A1A] border border-white/5 rounded-xl p-1">
          {['week', 'day'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                viewMode === mode ? 'bg-[#CA133E] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule canvas */}
      <div ref={scheduleContainerRef} className="relative">
        {viewMode === 'week' ? <WeekView /> : <DayView />}

        <AnimatePresence>
          {selectedSession && (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
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

      {/* Today + Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161616] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-4 w-4 text-[#CA133E]" />
            <h2 className="text-sm font-semibold text-white">Today — {getCurrentDay()}</h2>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarDaysIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No sessions today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((session, i) => <SessionRow key={i} session={session} />)}
            </div>
          )}
        </div>

        <div className="bg-[#161616] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DocumentTextIcon className="h-4 w-4 text-[#CA133E]" />
            <h2 className="text-sm font-semibold text-white">Upcoming Sessions</h2>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="py-6 text-center">
              <DocumentTextIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No upcoming sessions</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {upcomingSessions.slice(0, 4).map((session, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-center">
                  <SessionChip session={session} />
                  {session.date && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {schedule.lastUpdatedBy && (
        <p className="text-center text-xs text-gray-600">
          Last updated {new Date(schedule.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}
    </div>
  );
};

const SessionChip = ({ session }) => {
  const cfg = getSessionTypeConfig(session.type);
  return (
    <div className={`${cfg.lightBg} border-l-2 ${cfg.borderColor} rounded-lg px-2 py-1.5`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{cfg.color}</p>
      <p className="text-xs text-white font-medium mt-0.5">{formatTime(session.startTime)}</p>
    </div>
  );
};

const SessionRow = ({ session }) => {
  const cfg  = getSessionTypeConfig(session.type);
  const Icon = cfg.icon;
  return (
    <div className={`${cfg.lightBg} border border-white/5 border-l-4 ${cfg.borderColor} rounded-xl p-3 flex items-center gap-3`}>
      <div className={`w-8 h-8 ${cfg.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{session.topic || cfg.color}</p>
        <p className="text-xs text-gray-400">
          {formatTime(session.startTime)}{session.endTime ? ` — ${formatTime(session.endTime)}` : ''}
        </p>
      </div>
      <span className={`${cfg.bgColor} text-white text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0`}>
        {cfg.color}
      </span>
    </div>
  );
};

const SessionDetailModal = ({ session, onClose }) => {
  const cfg  = getSessionTypeConfig(session.type);
  const Icon = cfg.icon;
  return (
    <div className="bg-[#161616] border border-white/10 rounded-xl w-72 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 relative">
        <div className={`w-9 h-9 ${cfg.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white">{cfg.color} Session</p>
          <p className="text-sm text-gray-400 truncate">{session.topic}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <div className={`px-4 py-3 border-t-2 ${cfg.borderColor} space-y-2`}>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          {formatTime(session.startTime)}{session.endTime ? ` — ${formatTime(session.endTime)}` : ''}
        </div>
        {session.description && (
          <div className="flex items-start gap-2 text-sm text-gray-400">
            <InformationCircleIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p>{session.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTab;
