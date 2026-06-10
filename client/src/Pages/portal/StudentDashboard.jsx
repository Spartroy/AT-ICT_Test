import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import io from 'socket.io-client';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlayIcon,
  CalendarDaysIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  BookmarkSquareIcon,
  Squares2X2Icon,
  StarIcon
} from '@heroicons/react/24/outline';

import ProfileModal from '../../components/shared/ProfileModal';
import DashboardOverview from '../../components/student/DashboardOverview';
import AssignmentsTab from '../../components/student/AssignmentsTab';
import QuizzesTab from '../../components/student/QuizzesTab';
import MaterialsTab from '../../components/student/MaterialsTab';
import VideosTab from '../../components/student/VideosTab';
import NotesTab from '../../components/student/NotesTab';
import ChatTab from '../../components/student/ChatTab';
import AnnouncementsTab from '../../components/student/AnnouncementsTab';
import ScheduleTab from '../../components/student/ScheduleTab';
import FlashcardsTab from '../../components/student/FlashcardsTab';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [currentTabPage, setCurrentTabPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tabsPerPage, setTabsPerPage] = useState(5);
  const socketRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const updateTabsPerPage = () => {
      if (window.innerWidth < 480) {
        setTabsPerPage(3);
      } else if (window.innerWidth < 768) {
        setTabsPerPage(4);
      } else if (window.innerWidth < 976) {
        setTabsPerPage(5);
      } else {
        setTabsPerPage(5);
      }
    };
    updateTabsPerPage();
    window.addEventListener('resize', updateTabsPerPage);
    return () => window.removeEventListener('resize', updateTabsPerPage);
  }, []);

  const tabs = [
    { id: 'dashboard',      name: 'Dashboard',         shortName: 'Dash',        icon: ChartBarIcon },
    { id: 'announcements',  name: 'Announcements',      shortName: 'News',        icon: MegaphoneIcon },
    { id: 'schedule',       name: 'Schedule',           shortName: 'Schedule',    icon: CalendarDaysIcon },
    { id: 'assignments',    name: 'Assignments',        shortName: 'H.W',         icon: DocumentTextIcon },
    { id: 'quizzes',        name: 'Quizzes',            shortName: 'Quizzes',     icon: AcademicCapIcon },
    { id: 'materials',      name: 'Materials',          shortName: 'Files',       icon: FolderIcon },
    { id: 'videos',         name: 'Videos',             shortName: 'Videos',      icon: PlayIcon },
    { id: 'notes',          name: 'Interactive Notes',  shortName: 'Notes',       icon: BookmarkSquareIcon },
    { id: 'flashcards',     name: 'Flashcards',         shortName: 'Cards',       icon: Squares2X2Icon },
    { id: 'chat',           name: 'Chat',               shortName: 'Chat',        icon: ChatBubbleLeftRightIcon }
  ];

  const totalPages = Math.ceil(tabs.length / tabsPerPage);
  const visibleTabs = tabs.slice(currentTabPage * tabsPerPage, (currentTabPage + 1) * tabsPerPage);

  const tabPageVariants = {
    enter: () => ({ x: 60, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: () => ({ zIndex: 0, x: -60, opacity: 0 })
  };

  const tabPageTransition = {
    x: { type: 'spring', stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  useEffect(() => {
    fetchDashboardData();
    const socket = io(API_ENDPOINTS.BASE_URL);
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeTabIndex !== -1) {
      const requiredPage = Math.floor(activeTabIndex / tabsPerPage);
      if (requiredPage !== currentTabPage) setCurrentTabPage(requiredPage);
    }
  }, [activeTab, tabsPerPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.DASHBOARD, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentData(data.data.student);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const getCurrentTabComponent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab?.component && currentTab) {
      const components = {
        dashboard: DashboardOverview,
        announcements: AnnouncementsTab,
        schedule: ScheduleTab,
        assignments: AssignmentsTab,
        quizzes: QuizzesTab,
        materials: MaterialsTab,
        videos: VideosTab,
        notes: NotesTab,
        flashcards: FlashcardsTab,
        chat: ChatTab
      };
      const Component = components[activeTab];
      if (!Component) return <div className="text-gray-400">Tab not found</div>;
      const extraProps = activeTab === 'dashboard' ? { socket: socketRef.current, onNavigate: setActiveTab } : {};
      return <Component studentData={studentData} stats={stats} {...extraProps} />;
    }
    return <div className="text-gray-400">Tab not found</div>;
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

  const sessionPoints = studentData?.studentInfo?.points?.currentSession || 0;
  const hasUnreadAnnouncements = stats?.announcements?.unreadAnnouncements > 0;
  const hasPendingAssignments = stats?.assignments?.pendingAssignments > 0;
  const hasPendingQuizzes = stats?.quizzes?.pendingQuizzes > 0;
  const hasUnreadMessages = stats?.unreadMessages > 0;

  const getBadge = (tabId) => {
    if (tabId === 'announcements' && hasUnreadAnnouncements) return stats.announcements.unreadAnnouncements;
    if (tabId === 'assignments' && hasPendingAssignments) return stats.assignments.pendingAssignments;
    if (tabId === 'quizzes' && hasPendingQuizzes) return stats.quizzes.pendingQuizzes;
    if (tabId === 'chat' && hasUnreadMessages) return stats.unreadMessages;
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#CA133E] border-t-transparent" />
        <p className="text-gray-400 text-sm">Loading dashboard…</p>
      </div>
    );
  }

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
              <span className="text-white font-bold text-sm hidden sm:block">AT-ICT</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Points badge */}
              {studentData && (
                <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-white/10 rounded-full px-3 py-1.5">
                  <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {sessionPoints.toLocaleString()} <span className="text-gray-400 font-normal">pts</span>
                  </span>
                </div>
              )}

              {/* Bell */}
              <button
                className="relative p-2 rounded-full hover:bg-white/8 transition-colors text-gray-400 hover:text-white"
                title="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {(hasUnreadAnnouncements || hasPendingAssignments) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CA133E] rounded-full" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-white/8 transition-colors text-gray-400 hover:text-white"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>

              {/* Profile avatar */}
              {studentData && (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CA133E] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {studentData.firstName?.[0]}{studentData.lastName?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-white text-sm font-semibold leading-none">
                      {studentData.firstName} {studentData.lastName}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      IGCSE · Year {studentData.studentInfo?.year}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation (sm+ screens: paginated) ── */}
      <div className="hidden sm:block bg-[#0F0F0F] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3">

            {/* Prev */}
            <motion.button
              onClick={handlePrevPage}
              disabled={currentTabPage === 0 || isTransitioning}
              className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                currentTabPage === 0 || isTransitioning
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>

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
                    const badge = getBadge(tab.id);
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
                        {badge > 0 && (
                          <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                            activeTab === tab.id ? 'bg-white text-[#CA133E]' : 'bg-[#CA133E] text-white'
                          }`}>
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.nav>
              </AnimatePresence>
            </div>

            {/* Next */}
            <motion.button
              onClick={handleNextPage}
              disabled={currentTabPage === totalPages - 1 || isTransitioning}
              className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-all ${
                currentTabPage === totalPages - 1 || isTransitioning
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}
            >
              <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
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

      {/* ── Mobile Tab Navigation (< 480px: horizontally scrollable) ── */}
      <div className="sm:hidden bg-[#0F0F0F] border-b border-white/5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const badge = getBadge(tab.id);
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
                {badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {getCurrentTabComponent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && studentData && (
          <ProfileModal
            user={{ ...studentData, role: 'student', roleData: studentData.studentInfo }}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
