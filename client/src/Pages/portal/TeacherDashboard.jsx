import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { showOperationToast } from '../../utils/toast';
import Leaderboard from '../../components/shared/Leaderboard';
import ProfileModal from '../../components/shared/ProfileModal';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  CalendarDaysIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  TrophyIcon,
  ArrowPathIcon,
  SparklesIcon,
  BellIcon
} from '@heroicons/react/24/outline';

import PendingRegistrations from '../../components/teacher/PendingRegistrations';
import StudentManagement from '../../components/teacher/StudentManagement';
import AnnouncementCenter from '../../components/teacher/AnnouncementCenter';
import ChatCenter from '../../components/teacher/ChatCenter';
import ScheduleBuilder from '../../components/teacher/ScheduleBuilder';
import CatchupGenerator from '../../components/teacher/CatchupGenerator';
import MaterialsCenter from '../../components/teacher/MaterialsCenter';
import CreateAssignmentModal from '../../components/teacher/CreateAssignmentModal';
import CreateQuizModal from '../../components/teacher/CreateQuizModal';
import VideoManagement from '../../components/teacher/VideoManagement';
import NotesManagement from '../../components/teacher/NotesManagement';
import FlashcardCenter from '../../components/teacher/FlashcardCenter';
import SessionMonitoring from '../../components/teacher/SessionMonitoring';
import RecentActivities from '../../components/teacher/RecentActivities';
import ContentManagementCenter from '../../components/teacher/ContentManagementCenter';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [stats, setStats] = useState({
    overview: { totalStudents: 0, activeAnnouncements: 0 },
    performance: { avgScore: 0, avgAttendance: 0, avgProgress: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTabPage, setCurrentTabPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tabsPerPage, setTabsPerPage] = useState(4);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 480)      setTabsPerPage(2);
      else if (window.innerWidth < 768) setTabsPerPage(3);
      else                              setTabsPerPage(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const tabs = [
    { id: 'overview',       name: 'Dashboard Overview', shortName: 'Dashboard',  icon: ChartBarIcon,              color: 'bg-[#CA133E]'  },
    { id: 'registrations',  name: 'New Registrations',  shortName: 'Requests',   icon: ClockIcon,                 color: 'bg-orange-600', badge: pendingRegistrationsCount },
    { id: 'students',       name: 'Students',           shortName: 'Students',   icon: UserGroupIcon,             color: 'bg-green-600'  },
    { id: 'schedule',       name: 'Schedule Builder',   shortName: 'Schedule',   icon: CalendarDaysIcon,          color: 'bg-indigo-600' },
    { id: 'catchup',        name: 'Catchup Generator',  shortName: 'Catch-Up',   icon: SparklesIcon,              color: 'bg-rose-600'   },
    { id: 'materials',      name: 'Materials',          shortName: 'Materials',  icon: FolderIcon,                color: 'bg-teal-600'   },
    { id: 'videos',         name: 'Videos',             shortName: 'Videos',     icon: PlayIcon,                  color: 'bg-blue-600'   },
    { id: 'notes',          name: 'Interactive Notes',  shortName: 'Notes',      icon: FolderIcon,                color: 'bg-teal-600'   },
    { id: 'flashcards',     name: 'Flashcards',         shortName: 'Flashcards', icon: MegaphoneIcon,             color: 'bg-yellow-600' },
    { id: 'sessions',       name: 'Session Monitoring', shortName: 'Sessions',   icon: ArrowRightOnRectangleIcon, color: 'bg-red-600'    },
    { id: 'announcements',  name: 'Announcements',      shortName: 'News',       icon: MegaphoneIcon,             color: 'bg-purple-600' },
    { id: 'chat',           name: 'Communication',      shortName: 'Chat',       icon: ChatBubbleLeftRightIcon,   color: 'bg-pink-600'   },
    { id: 'content',        name: 'Content Management', shortName: 'Content',    icon: AcademicCapIcon,           color: 'bg-cyan-600'   }
  ];

  const totalPages = Math.ceil(tabs.length / tabsPerPage);
  const visibleTabs = tabs.slice(currentTabPage * tabsPerPage, (currentTabPage + 1) * tabsPerPage);

  const tabPageVariants = {
    enter: () => ({ x: 60, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit:  () => ({ zIndex: 0, x: -60, opacity: 0 })
  };
  const tabPageTransition = {
    x: { type: 'spring', stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchPendingRegistrationsCount();
  }, []);

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(t => t.id === activeTab);
    if (activeTabIndex !== -1) {
      const requiredPage = Math.floor(activeTabIndex / tabsPerPage);
      if (requiredPage !== currentTabPage) setCurrentTabPage(requiredPage);
    }
  }, [activeTab, tabsPerPage]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.TEACHER.DASHBOARD, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === 'success') setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrationsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/pending`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === 'success') setPendingRegistrationsCount(data.data.registrations.length);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const handlePrevPage = () => {
    if (currentTabPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNextPage = () => {
    if (currentTabPage < totalPages - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleTabClick = (tabId) => setActiveTab(tabId);

  const handlePageIndicatorClick = (pageIndex) => {
    if (pageIndex !== currentTabPage && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(pageIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':       return <DashboardOverview stats={stats} loading={loading} setActiveTab={setActiveTab} setShowCreateAssignment={setShowCreateAssignment} setShowCreateQuiz={setShowCreateQuiz} onRegistrationUpdate={fetchPendingRegistrationsCount} />;
      case 'registrations':  return <PendingRegistrations onRegistrationUpdate={fetchPendingRegistrationsCount} />;
      case 'students':       return <StudentManagement />;
      case 'schedule':       return <ScheduleBuilder />;
      case 'catchup':        return <CatchupGenerator />;
      case 'materials':      return <MaterialsCenter />;
      case 'videos':         return <VideoManagement />;
      case 'notes':          return <NotesManagement />;
      case 'flashcards':     return <FlashcardCenter />;
      case 'sessions':       return <SessionMonitoring />;
      case 'announcements':  return <AnnouncementCenter />;
      case 'chat':           return <ChatCenter />;
      case 'content':        return <ContentManagementCenter />;
      default:               return <DashboardOverview stats={stats} loading={loading} setActiveTab={setActiveTab} setShowCreateAssignment={setShowCreateAssignment} setShowCreateQuiz={setShowCreateQuiz} onRegistrationUpdate={fetchPendingRegistrationsCount} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B]">

      {/* ── Top Header ── */}
      <header className="bg-[#111111] border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#CA133E] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs tracking-tight">A+</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-sm leading-none">AT-ICT</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Teacher Portal</p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Pending registrations badge */}
              {pendingRegistrationsCount > 0 && (
                <button
                  onClick={() => handleTabClick('registrations')}
                  className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-orange-500/25 transition-colors"
                >
                  <BellIcon className="h-3.5 w-3.5" />
                  {pendingRegistrationsCount} pending
                </button>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-white/8 transition-colors text-gray-400 hover:text-white"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>

              {/* Profile */}
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CA133E] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {currentUser.firstName?.[0] || 'T'}{currentUser.lastName?.[0] || ''}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-white text-sm font-semibold leading-none">
                    {currentUser.firstName
                      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
                      : 'Teacher'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">{currentUser.role || 'ICT Instructor'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation (sm+ screens: paginated) ── */}
      <div className="hidden sm:block bg-[#0F0F0F] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3">

            {/* Prev */}
            <button
              onClick={handlePrevPage}
              disabled={currentTabPage === 0 || isTransitioning}
              className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                currentTabPage === 0 || isTransitioning
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Tabs */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.nav
                  key={currentTabPage}
                  variants={tabPageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={tabPageTransition}
                  className="flex gap-1 justify-center"
                >
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-[#CA133E] text-white shadow-lg shadow-[#CA133E]/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/6'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">{tab.name}</span>
                        <span className="md:hidden">{tab.shortName}</span>
                        {tab.badge > 0 && (
                          <span className={`flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${
                            activeTab === tab.id ? 'bg-white text-[#CA133E]' : 'bg-orange-500 text-white'
                          }`}>
                            {tab.badge > 9 ? '9+' : tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.nav>
              </AnimatePresence>
            </div>

            {/* Next */}
            <button
              onClick={handleNextPage}
              disabled={currentTabPage === totalPages - 1 || isTransitioning}
              className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                currentTabPage === totalPages - 1 || isTransitioning
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}
            >
              <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Page dots */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 pb-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageIndicatorClick(i)}
                  className={`rounded-full transition-all ${
                    i === currentTabPage
                      ? 'w-4 h-1.5 bg-[#CA133E]'
                      : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Tab Navigation ── */}
      <div className="sm:hidden bg-[#0F0F0F] border-b border-white/5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#CA133E] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/6'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.shortName}</span>
                {tab.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
        onSuccess={() => showOperationToast.operationSuccess('Assignment creation')}
      />
      <CreateQuizModal
        isOpen={showCreateQuiz}
        onClose={() => setShowCreateQuiz(false)}
        onSuccess={() => showOperationToast.operationSuccess('Quiz creation')}
      />
      <AnimatePresence>
        {showProfile && (
          <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Teacher Dashboard Overview ─────────────────────────────────────────────
const DashboardOverview = ({ stats, loading, setActiveTab, setShowCreateAssignment, setShowCreateQuiz, onRegistrationUpdate }) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [newSessionLabel, setNewSessionLabel] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [showHallOfFameModal, setShowHallOfFameModal] = useState(false);
  const [hallOfFameForm, setHallOfFameForm] = useState({ name: '', year: '' });
  const [hallOfFameLoading, setHallOfFameLoading] = useState(false);

  const handleResetSession = async () => {
    if (!newSessionLabel.trim()) return;
    try {
      setResetLoading(true); setResetMsg('');
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.TEACHER.RESET_SESSION_POINTS, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSessionLabel: newSessionLabel.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.message);
        setTimeout(() => { setShowResetModal(false); setResetMsg(''); setNewSessionLabel(''); }, 2000);
      } else {
        setResetMsg(data.message || 'Reset failed');
      }
    } catch { setResetMsg('Network error'); }
    finally { setResetLoading(false); }
  };

  const handleAddHallOfFameStudent = async (e) => {
    e.preventDefault();
    if (!hallOfFameForm.name.trim() || !hallOfFameForm.year.trim()) return;
    try {
      setHallOfFameLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.TEACHER.HALL_OF_FAME, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: hallOfFameForm.name.trim(), year: hallOfFameForm.year.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showOperationToast.operationSuccess('Hall of Fame update');
        setShowHallOfFameModal(false);
        setHallOfFameForm({ name: '', year: '' });
      } else {
        showOperationToast.operationError('Hall of Fame update', data?.message || 'Unable to add student');
      }
    } catch (error) {
      showOperationToast.operationError('Hall of Fame update', error?.message || 'Network error');
    } finally {
      setHallOfFameLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#161616] rounded-xl p-5 h-24 animate-pulse border border-white/5" />
          ))}
        </div>
        <div className="bg-[#161616] rounded-xl p-5 h-40 animate-pulse border border-white/5" />
      </div>
    );
  }

  const inputClass = "w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm";
  const modalClass = "bg-[#161616] rounded-xl p-5 sm:p-6 w-full max-w-md border border-white/10 shadow-2xl";

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Welcome header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="inline-block bg-[#CA133E]/15 text-[#CA133E] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
            Teacher View
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, <span className="text-[#CA133E]">Maestro.</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {stats?.overview?.totalStudents || 0} students enrolled
          </p>
        </div>
      </div>

      {/* ── Stats card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'Total Students', value: stats.overview.totalStudents, icon: UserGroupIcon, accent: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Active Announcements', value: stats.overview.activeAnnouncements || 0, icon: MegaphoneIcon, accent: 'text-purple-400', bg: 'bg-purple-500/10' },
          { title: 'Avg. Score', value: `${Math.round(stats.performance?.avgScore || 0)}%`, icon: TrophyIcon, accent: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { title: 'Avg. Progress', value: `${Math.round(stats.performance?.avgProgress || 0)}%`, icon: ChartBarIcon, accent: 'text-green-400', bg: 'bg-green-500/10' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:border-white/10 transition-colors"
            >
              <div>
                <p className="text-gray-500 text-xs mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Create H.W',          icon: ClipboardDocumentListIcon, accent: 'text-blue-400',   bg: 'bg-blue-500/8   hover:bg-blue-500/15',   border: 'border-blue-500/15',   action: () => setShowCreateAssignment(true) },
            { label: 'Create Quiz',          icon: QuestionMarkCircleIcon,    accent: 'text-purple-400', bg: 'bg-purple-500/8 hover:bg-purple-500/15', border: 'border-purple-500/15', action: () => setShowCreateQuiz(true) },
            { label: 'Send Announcement',    icon: MegaphoneIcon,             accent: 'text-green-400',  bg: 'bg-green-500/8  hover:bg-green-500/15',  border: 'border-green-500/15',  action: () => setActiveTab('announcements') },
            { label: 'Reset Season',         icon: ArrowPathIcon,             accent: 'text-[#CA133E]',  bg: 'bg-[#CA133E]/8  hover:bg-[#CA133E]/15', border: 'border-[#CA133E]/15',  action: () => setShowResetModal(true) }
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                onClick={btn.action}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all ${btn.bg} ${btn.border}`}
              >
                <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${btn.accent}`} />
                </div>
                <span className="text-white text-sm font-medium text-left leading-tight">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Leaderboard + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-1">
          <Leaderboard className="h-full" />
        </div>
        <div className="lg:col-span-2">
          <RecentActivities onRegistrationUpdate={onRegistrationUpdate} />
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showHallOfFameModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className={modalClass}
            >
              <h3 className="text-base font-bold text-white mb-4">Add Hall of Fame Student</h3>
              <form onSubmit={handleAddHallOfFameStudent} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Student Name</label>
                  <input type="text" value={hallOfFameForm.name}
                    onChange={(e) => setHallOfFameForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Student full name" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Year</label>
                  <input type="text" value={hallOfFameForm.year}
                    onChange={(e) => setHallOfFameForm(p => ({ ...p, year: e.target.value }))}
                    placeholder="2026" className={inputClass} required />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowHallOfFameModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={hallOfFameLoading || !hallOfFameForm.name.trim() || !hallOfFameForm.year.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#CA133E] text-white font-semibold hover:bg-[#A01030] transition-colors disabled:opacity-50 text-sm">
                    {hallOfFameLoading ? 'Adding…' : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className={modalClass}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-[#CA133E]/15">
                  <ArrowPathIcon className="h-5 w-5 text-[#CA133E]" />
                </div>
                <h3 className="text-base font-bold text-white">Reset Session Points</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                This resets all students' current-session points to 0 and starts a new season. All-time totals are preserved.
              </p>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5">New Session Label (e.g. "NOV 26")</label>
                <input type="text" value={newSessionLabel} onChange={(e) => setNewSessionLabel(e.target.value)}
                  placeholder="NOV 26" className={inputClass} />
              </div>
              {resetMsg && (
                <p className={`text-sm mb-4 ${resetMsg.includes('error') || resetMsg.includes('fail') ? 'text-red-400' : 'text-green-400'}`}>
                  {resetMsg}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowResetModal(false); setResetMsg(''); setNewSessionLabel(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm">
                  Cancel
                </button>
                <button onClick={handleResetSession} disabled={resetLoading || !newSessionLabel.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#CA133E] text-white font-semibold hover:bg-[#A01030] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {resetLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrophyIcon className="h-4 w-4" />}
                  {resetLoading ? 'Resetting…' : 'Confirm Reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setShowHallOfFameModal(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#CA133E] text-white shadow-xl shadow-[#CA133E]/25 flex items-center justify-center hover:bg-[#A01030] transition-colors"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Add Hall of Fame Student"
      >
        <PlusIcon className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default TeacherDashboard;
