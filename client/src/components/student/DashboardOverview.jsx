import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../config/api';
import Leaderboard from '../shared/Leaderboard';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  TrophyIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  ChevronRightIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';

// ── Colour map for progress rings ──────────────────────────────────────────
const RING_COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  purple: '#a855f7',
  yellow: '#eab308',
  red:    '#CA133E'
};

// ── Circular progress ring ─────────────────────────────────────────────────
const ProgressRing = ({ percentage, color, size = 72 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const stroke = RING_COLORS[color] || RING_COLORS.blue;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={stroke} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
};

// ── Announcement tag colour ────────────────────────────────────────────────
const tagColor = (priority, isPinned) => {
  if (priority === 'urgent') return 'bg-red-500/20 text-red-400';
  if (isPinned) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-blue-500/20 text-blue-400';
};

// ── Announcement tag label ─────────────────────────────────────────────────
const tagLabel = (priority, isPinned) => {
  if (priority === 'urgent') return 'Urgent';
  if (isPinned) return 'Pinned';
  return 'Notice';
};

// ── Relative time helper ───────────────────────────────────────────────────
const relativeTime = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(date).toLocaleDateString();
};

// ══════════════════════════════════════════════════════════════════════════
const DashboardOverview = ({ studentData, stats, socket, onNavigate }) => {
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [pointsFlash, setPointsFlash] = useState(null);
  const [sessionPoints, setSessionPoints] = useState(
    studentData?.studentInfo?.points?.currentSession || 0
  );

  useEffect(() => {
    setSessionPoints(studentData?.studentInfo?.points?.currentSession || 0);
  }, [studentData]);

  useEffect(() => { fetchRecentAnnouncements(); }, []);

  useEffect(() => {
    if (!socket || !studentData?._id) return;
    socket.emit('join_user_room', studentData._id);
    const handlePointsAwarded = (data) => {
      const gained = data.total || 0;
      setSessionPoints(prev => prev + gained);
      setPointsFlash(data);
      const bonusMsg = data.bonusPoints > 0 ? ` (+${data.bonusPoints} bonus)` : '';
      toast.success(`+${gained} pts earned — ${data.title}${bonusMsg}`, { icon: '⭐', autoClose: 4000 });
      setTimeout(() => setPointsFlash(null), 3000);
    };
    socket.on('points_awarded', handlePointsAwarded);
    return () => socket.off('points_awarded', handlePointsAwarded);
  }, [socket, studentData?._id]);

  const fetchRecentAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentAnnouncements((data.data.announcements || []).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching recent announcements:', error);
    }
  };

  const overallProgress = studentData?.studentInfo?.overallProgress || 0;
  const sessionLabel = studentData?.studentInfo?.points?.sessionLabel || studentData?.studentInfo?.session || '';

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
      title: 'Attendance',
      completed: stats?.attendance?.attended || stats?.assignments?.completedAssignments || 0,
      total: stats?.attendance?.total || stats?.assignments?.totalAssignments || 1,
      pending: 0,
      icon: CalendarDaysIcon,
      color: 'purple'
    },
    {
      title: 'Avg. score',
      completed: Math.round(stats?.assignments?.avgScore || 0),
      total: 100,
      pending: 0,
      icon: TrophyIcon,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Welcome section ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-block bg-[#CA133E]/15 text-[#CA133E] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Welcome Back
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Hi {studentData?.firstName} — let's get that <span className="text-[#CA133E]">A*.</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            You're {overallProgress}% through this term's plan. Keep the streak alive.
          </p>
        </div>
        <motion.button
          onClick={() => onNavigate?.('schedule')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 flex items-center gap-2 bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#CA133E]/20 whitespace-nowrap text-sm sm:text-base"
        >
          <PlayCircleIcon className="h-5 w-5" />
          Resume last lesson
        </motion.button>
      </div>

      {/* ── Points flash + overall progress pill ────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-[#161616] border border-white/5 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-[#CA133E]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">⭐</span>
            <AnimatePresence>
              {pointsFlash && (
                <motion.span
                  key="flash"
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -24, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-1 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none"
                >
                  +{pointsFlash.total}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              My Points {sessionLabel ? `· ${sessionLabel}` : ''}
            </p>
            <p className="text-xl font-bold text-white">
              {sessionPoints.toLocaleString()} <span className="text-gray-500 text-sm font-normal">pts</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Overall</p>
            <p className="text-lg font-bold text-white">{overallProgress}%</p>
          </div>
          <div className="relative flex items-center justify-center flex-shrink-0">
            <ProgressRing percentage={overallProgress} color="red" size={64} />
            <span className="absolute text-xs font-bold text-white">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const percentage = card.total > 0 ? (card.completed / card.total) * 100 : 0;
          const pct = Math.min(100, Math.round(percentage));
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-xs truncate">{card.title}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white leading-none">
                  {card.title === 'Avg. score' ? `${card.completed}%` : `${card.completed}/${card.total}`}
                </p>
                {card.pending > 0 ? (
                  <p className="text-xs text-red-400 mt-1.5 font-medium">{card.pending} pending</p>
                ) : card.total > 0 ? (
                  <p className="text-xs text-green-400 mt-1.5 font-medium">All done ✓</p>
                ) : null}
              </div>
              <div className="relative flex items-center justify-center flex-shrink-0">
                <ProgressRing percentage={pct} color={card.color} size={68} />
                <span className="absolute text-xs font-bold text-white">{pct}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Leaderboard + Announcements side by side ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Leaderboard */}
        <Leaderboard
          currentUserId={studentData?._id}
          session={studentData?.studentInfo?.session}
        />

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MegaphoneIcon className="h-4 w-4 text-[#CA133E]" />
              Announcements
            </h3>
            {stats?.announcements?.unreadAnnouncements > 0 && (
              <span className="text-xs bg-[#CA133E]/20 text-[#CA133E] px-2 py-0.5 rounded-full font-medium">
                {stats.announcements.unreadAnnouncements} unread
              </span>
            )}
          </div>

          {recentAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600">
              <MegaphoneIcon className="h-10 w-10 mb-2" />
              <p className="text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => (
                <div key={ann._id} className="group">
                  <div className="flex items-start gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tagColor(ann.priority, ann.isPinned)}`}>
                      {tagLabel(ann.priority, ann.isPinned)}
                    </span>
                    <span className="text-gray-500 text-[11px] mt-0.5">
                      {relativeTime(ann.createdAt)}
                    </span>
                    {ann.priority === 'urgent' && (
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">{ann.title}</p>
                </div>
              ))}
              <button
                onClick={() => onNavigate?.('announcements')}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-[#CA133E] pt-1 transition-colors"
              >
                View all <ChevronRightIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Weekly Schedule widget ───────────────────────────────────────── */}
      <DashboardScheduleWidget />
    </div>
  );
};

// ── Session type config ────────────────────────────────────────────────────
const SESSION_TYPES = {
  theory:    { label: 'Theory',    bg: 'bg-blue-600',     light: 'bg-blue-900/20',   border: 'border-blue-500' },
  practical: { label: 'Practical', bg: 'bg-green-600',    light: 'bg-green-900/20',  border: 'border-green-500' },
  revision:  { label: 'Revision',  bg: 'bg-purple-600',   light: 'bg-purple-900/20', border: 'border-purple-500' },
  quiz:      { label: 'Quiz',      bg: 'bg-[#CA133E]',    light: 'bg-red-900/20',    border: 'border-red-500' }
};

const formatTime = (t) =>
  new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const getCurrentDay = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long' });

const DashboardSessionCard = ({ session }) => {
  const cfg = SESSION_TYPES[session.type] || SESSION_TYPES.theory;
  return (
    <div className={`${cfg.light} rounded-lg p-2 border-l-2 ${cfg.border}`}>
      <span className={`${cfg.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md block text-center mb-1`}>
        {cfg.label}
      </span>
      <p className="text-white text-xs font-semibold text-center">{formatTime(session.startTime)}</p>
    </div>
  );
};

const DashboardScheduleWidget = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => { fetchSchedule(); }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.STUDENT.SCHEDULE, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.data.schedule);
      } else {
        setError((await res.json()).message || 'Failed to fetch schedule');
      }
    } catch { setError('Error fetching schedule'); }
    finally { setLoading(false); }
  };

  const wrapperClass = 'bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5';

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={wrapperClass}>
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4 text-[#CA133E]" /> Weekly Schedule
      </h3>
      <div className="animate-pulse space-y-3">
        <div className="grid grid-cols-7 gap-2">
          {shortDays.map(d => <div key={d} className="h-7 bg-white/5 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => <div key={i} className="h-24 bg-white/5 rounded-lg" />)}
        </div>
      </div>
    </motion.div>
  );

  if (error || !schedule) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={wrapperClass}>
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4 text-[#CA133E]" /> Weekly Schedule
      </h3>
      <div className="text-center py-8">
        <CalendarDaysIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{error || 'No schedule available'}</p>
        {error && (
          <button onClick={fetchSchedule} className="mt-3 px-4 py-2 bg-[#CA133E] text-white rounded-xl text-sm hover:bg-[#A01030] transition-colors">
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );

  const today = getCurrentDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={wrapperClass}
    >
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4 text-[#CA133E]" /> Weekly Schedule
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
        {shortDays.map((short, i) => (
          <div
            key={short}
            className={`text-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              days[i] === today ? 'bg-[#CA133E] text-white' : 'bg-white/5 text-gray-400'
            }`}
          >
            <span className="hidden sm:inline">{short}</span>
            <span className="sm:hidden">{short[0]}</span>
          </div>
        ))}
      </div>

      {/* Schedule grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const daySched = schedule.schedule?.find(d => d.day === day) || { day, sessions: [] };
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`rounded-xl border p-1.5 sm:p-2 min-h-[90px] sm:min-h-[110px] flex flex-col gap-1 transition-all ${
                isToday ? 'border-[#CA133E]/40 bg-[#CA133E]/8' : 'border-white/5 bg-white/2'
              }`}
            >
              {daySched.sessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-700 text-[10px] text-center">—</p>
                </div>
              ) : (
                <>
                  {daySched.sessions.slice(0, 2).map((s, si) => (
                    <DashboardSessionCard key={si} session={s} />
                  ))}
                  {daySched.sessions.length > 2 && (
                    <p className="text-gray-500 text-[10px] text-center">+{daySched.sessions.length - 2}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DashboardOverview;
