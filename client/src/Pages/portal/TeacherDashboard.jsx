import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { showOperationToast } from '../../utils/toast';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  PlusIcon,
  CalendarDaysIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Import tab components
import PendingRegistrations from '../../components/teacher/PendingRegistrations';
import StudentManagement from '../../components/teacher/StudentManagement';
import AnnouncementCenter from '../../components/teacher/AnnouncementCenter';
import ChatCenter from '../../components/teacher/ChatCenter';
import ScheduleBuilder from '../../components/teacher/ScheduleBuilder';
import MaterialsCenter from '../../components/teacher/MaterialsCenter';
import CreateAssignmentModal from '../../components/teacher/CreateAssignmentModal';
import CreateQuizModal from '../../components/teacher/CreateQuizModal';
import VideoManagement from '../../components/teacher/VideoManagement';
import FlashcardCenter from '../../components/teacher/FlashcardCenter';
import SessionMonitoring from '../../components/teacher/SessionMonitoring';
import RecentActivities from '../../components/teacher/RecentActivities';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [stats, setStats] = useState({
    overview: {
      totalStudents: 0,
      activeAnnouncements: 0
    },
    performance: {
      avgScore: 0,
      avgAttendance: 0,
      avgProgress: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [currentTabPage, setCurrentTabPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  
  // Responsive tabs per page
  const [tabsPerPage, setTabsPerPage] = useState(4);

  // Update tabs per page based on screen size
  useEffect(() => {
    const updateTabsPerPage = () => {
      if (window.innerWidth < 640) { // mobile
        setTabsPerPage(2);
      } else { // tablet and desktop - always 4 tabs per page for optimal distribution
        setTabsPerPage(4);
      }
    };

    updateTabsPerPage();
    window.addEventListener('resize', updateTabsPerPage);
    return () => window.removeEventListener('resize', updateTabsPerPage);
  }, []);

  const tabs = [
    {
      id: 'overview',
      name: 'Dashboard Overview',
      shortName: 'Dashboard',
      icon: ChartBarIcon,
      color: 'bg-[#CA133E]'
    },
    {
      id: 'registrations',
      name: 'New Registrations',
      shortName: 'New Requests',
      icon: ClockIcon,
      color: 'bg-orange-600',
      badge: pendingRegistrationsCount
    },
    {
      id: 'students',
      name: 'Student Management',
      shortName: 'Students',
      icon: UserGroupIcon,
      color: 'bg-green-600'
    },
    {
      id: 'schedule',
      name: 'Schedule Builder',
      shortName: 'Schedule',
      icon: CalendarDaysIcon,
      color: 'bg-indigo-600'
    },
    {
      id: 'materials',
      name: 'Materials Center',
      shortName: 'Materials',
      icon: FolderIcon,
      color: 'bg-teal-600'
    },
    {
      id: 'videos',
      name: 'Video Management',
      shortName: 'Videos',
      icon: PlayIcon,
      color: 'bg-blue-600'
    },
    {
      id: 'flashcards',
      name: 'Flashcard Center',
      shortName: 'Flashcards',
      icon: MegaphoneIcon,
      color: 'bg-yellow-600'
    },
    {
      id: 'sessions',
      name: 'Session Monitoring',
      shortName: 'Sessions',
      icon: ArrowRightOnRectangleIcon,
      color: 'bg-red-600'
    },
    {
      id: 'announcements',
      name: 'Announcements',
      shortName: 'News',
      icon: MegaphoneIcon,
      color: 'bg-purple-600'
    },
    {
      id: 'chat',
      name: 'Communication',
      shortName: 'Chat',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-pink-600'
    }
  ];

  const totalPages = Math.ceil(tabs.length / tabsPerPage);
  const visibleTabs = tabs.slice(currentTabPage * tabsPerPage, (currentTabPage + 1) * tabsPerPage);

  // Animation variants for tab transitions
  const tabPageVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const tabPageTransition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.4 }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchPendingRegistrationsCount();
  }, []);

  // Auto-navigate to page containing active tab when activeTab changes
  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeTabIndex !== -1) {
      const requiredPage = Math.floor(activeTabIndex / tabsPerPage);
      if (requiredPage !== currentTabPage) {
        setCurrentTabPage(requiredPage);
      }
    }
  }, [activeTab, tabsPerPage]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrationsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.REGISTRATION.BASE}/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.status === 'success') {
        setPendingRegistrationsCount(data.data.registrations.length);
      }
    } catch (error) {
      console.error('Error fetching pending registrations count:', error);
    }
  };

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to sign-in page
    navigate('/signin');
  };

  const handlePrevPage = async () => {
    if (currentTabPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  };

  const handleNextPage = async () => {
    if (currentTabPage < totalPages - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    // The useEffect will handle navigating to the correct page
  };

  const handlePageIndicatorClick = async (pageIndex) => {
    if (pageIndex !== currentTabPage && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentTabPage(pageIndex);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview stats={stats} loading={loading} setActiveTab={setActiveTab} setShowCreateAssignment={setShowCreateAssignment} setShowCreateQuiz={setShowCreateQuiz} />;
      case 'registrations':
        return <PendingRegistrations onRegistrationUpdate={fetchPendingRegistrationsCount} />;
      case 'students':
        return <StudentManagement />;
      case 'schedule':
        return <ScheduleBuilder />;
      case 'materials':
        return <MaterialsCenter />;
      case 'videos':
        return <VideoManagement />;
      case 'flashcards':
        return <FlashcardCenter />;
      case 'sessions':
        return <SessionMonitoring />;
      case 'announcements':
        return <AnnouncementCenter />;
      case 'chat':
        return <ChatCenter />;
      default:
        return <DashboardOverview stats={stats} loading={loading} setActiveTab={setActiveTab} setShowCreateAssignment={setShowCreateAssignment} setShowCreateQuiz={setShowCreateQuiz} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039] shadow-xl border-b border-[#CA133E]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Welcome Message - Full width on top */}
          <div className="">
            <div className="text-center sm:text-left">
             
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                Welcome back, El Gran Maestro !
              </h2>
            </div>
            
            {/* Desktop user info and logout */}
            <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
              <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-xl bg-[#CA133E] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg lg:text-2xl">AT</span>
              </div>
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                <span>Logout</span>
              </motion.button>
            </div>

            {/* Mobile user info - always visible */}
            <div className="sm:hidden w-full bg-white/10 rounded-xl p-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-[#CA133E] flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">AT</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Ahmad Teacher</p>
                    <p className="text-xs text-gray-300">ICT Instructor</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all duration-300 text-sm font-bold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Pagination */}
      <div className="bg-[#2a1a1a]/50 backdrop-blur-sm border-b border-[#CA133E]/30 min-h-[90px] sm:min-h-[100px] lg:min-h-[110px] overflow-hidden">
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-6">
          {/* Main Navigation */}
          <div className="hidden sm:flex items-center py-4 sm:py-5 lg:py-6 gap-3 sm:gap-4 lg:gap-6">
            {/* Left Arrow - Always visible */}
            <motion.button
              onClick={handlePrevPage}
              disabled={currentTabPage === 0 || isTransitioning}
              className={`flex-shrink-0 p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 ${currentTabPage === 0 || isTransitioning
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-[#CA133E]/20 text-[#CA133E] hover:bg-[#CA133E]/40 hover:scale-110'
                }`}
              whileHover={currentTabPage > 0 && !isTransitioning ? { scale: 1.1 } : {}}
              whileTap={currentTabPage > 0 && !isTransitioning ? { scale: 0.95 } : {}}
            >
              <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </motion.button>

            {/* Tabs Container */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-7xl">
                <AnimatePresence mode="wait" custom={1}>
                  <motion.nav
                    key={currentTabPage}
                    custom={1}
                    variants={tabPageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={tabPageTransition}
                    className="flex flex-nowrap gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 justify-center items-center px-2"
                  >
                    {visibleTabs.map((tab, index) => {
                      const Icon = tab.icon;
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-3 sm:py-3.5 md:py-4 lg:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg lg:text-xl whitespace-nowrap transition-all duration-300 shadow-lg justify-center min-w-0 relative ${activeTab === tab.id
                            ? 'bg-[#CA133E] text-white shadow-[#CA133E]/50 scale-105'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                          <span className="text-center">
                            <span className="sm:hidden">
                              {tab.shortName}
                            </span>
                            <span className="hidden sm:inline lg:hidden">{tab.shortName}</span>
                            <span className="hidden lg:inline">{tab.name}</span>
                          </span>
                          {tab.badge > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold shadow-lg ml-1 min-w-[20px] text-center absolute -top-1 -right-1"
                            >
                              {tab.badge > 99 ? '99+' : tab.badge}
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.nav>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Arrow - Always visible */}
            <motion.button
              onClick={handleNextPage}
              disabled={currentTabPage === totalPages - 1 || isTransitioning}
              className={`flex-shrink-0 p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 ${currentTabPage === totalPages - 1 || isTransitioning
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-[#CA133E]/20 text-[#CA133E] hover:bg-[#CA133E]/40 hover:scale-110'
                }`}
              whileHover={currentTabPage < totalPages - 1 && !isTransitioning ? { scale: 1.1 } : {}}
              whileTap={currentTabPage < totalPages - 1 && !isTransitioning ? { scale: 0.95 } : {}}
            >
              <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </motion.button>
          </div>

          {/* Mobile-only tab section title */}
          <div className="sm:hidden py-2 px-2">
            <h2 className="text-lg font-bold text-white text-center">Teacher Dashboard</h2>
          </div>

          {/* Mobile Quick Tab Navigation */}
          <div className="sm:hidden pb-4 overflow-hidden">
            <div className="w-full flex justify-center">
              <div className="flex space-x-2 px-4 py-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory justify-center">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-[10px] transition-all duration-300 relative snap-center ${
                        activeTab === tab.id
                          ? 'bg-[#CA133E] text-white shadow-lg'
                          : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/50 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={tab.name}
                    >
                      <IconComponent className="h-6 w-6" />
                      {/* Notification dot for mobile */}
                      {tab.badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center border border-[#2a1a1a]">
                          <span className="text-[10px] text-white font-bold">{tab.badge > 9 ? '9+' : tab.badge}</span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {/* Active tab name display */}
            <div className="text-center mt-2 px-4">
              <span className="text-white font-semibold text-sm">
                {tabs.find(tab => tab.id === activeTab)?.name || ''}
              </span>
            </div>
          </div>



          {/* Page Indicator for larger screens */}
          {totalPages > 1 && (
            <div className="hidden sm:flex justify-center pb-3 sm:pb-4 lg:pb-5">
              <div className="flex space-x-2 sm:space-x-3">
                {Array.from({ length: totalPages }, (_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handlePageIndicatorClick(index)}
                    className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full transition-all duration-300 ${index === currentTabPage
                      ? 'bg-[#CA133E] scale-125 shadow-lg shadow-[#CA133E]/50'
                      : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 1.1 }}
                    layout
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#2a1a1a]/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CA133E]/20"
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
        onSuccess={() => {
          // Refresh data if needed
          showOperationToast.operationSuccess('Assignment creation');
        }}
      />

      <CreateQuizModal
        isOpen={showCreateQuiz}
        onClose={() => setShowCreateQuiz(false)}
        onSuccess={() => {
          // Refresh data if needed
          showOperationToast.operationSuccess('Quiz creation');
        }}
      />
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, loading, setActiveTab, setShowCreateAssignment, setShowCreateQuiz }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl shadow-xl p-6 lg:p-8 animate-pulse backdrop-blur-sm border border-white/20">
            <div className="h-6 bg-gray-300 rounded-xl w-3/4 mb-6"></div>
            <div className="h-10 bg-gray-300 rounded-xl w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Students',
      value: stats.overview.totalStudents,
      icon: UserGroupIcon,
      color: 'bg-blue-600',

    }
  ];

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-[#CA133E]/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base lg:text-[16pt] font-bold text-white">{card.title}</p>
                  <p className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white mt-2">{card.value}</p>
                  <div className="flex items-center mt-4">

                  </div>
                </div>
                <div className={`p-3 lg:p-4 rounded-xl ${card.color} shadow-lg`}>
                  <Icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl p-6 lg:p-8 border border-white/20">
        <h3 className="text-xl lg:text-2xl font-bold text-white mb-6 lg:mb-8">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <button
            onClick={() => setShowCreateAssignment(true)}
            className="flex items-center p-4 lg:p-6 bg-blue-600/20 backdrop-blur-sm rounded-xl hover:bg-blue-600/30 transition-all duration-300 group border border-blue-500/30"
          >
            <ClipboardDocumentListIcon className="h-8 w-8 lg:h-10 lg:w-10 text-blue-400 group-hover:text-blue-300" />
            <div className="ml-3 lg:ml-4 text-left">
              <p className="text-base lg:text-[18pt] font-bold text-white">Create H.W</p>
            </div>
          </button>

          <button
            onClick={() => setShowCreateQuiz(true)}
            className="flex items-center p-4 lg:p-6 bg-purple-600/20 backdrop-blur-sm rounded-xl hover:bg-purple-600/30 transition-all duration-300 group border border-purple-500/30"
          >
            <QuestionMarkCircleIcon className="h-8 w-8 lg:h-10 lg:w-10 text-purple-400 group-hover:text-purple-300" />
            <div className="ml-3 lg:ml-4 text-left">
              <p className="text-base lg:text-[18pt] font-bold text-white">Create Quiz</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className="flex items-center p-4 lg:p-6 bg-green-600/20 backdrop-blur-sm rounded-xl hover:bg-green-600/30 transition-all duration-300 group border border-green-500/30"
          >
            <MegaphoneIcon className="h-8 w-8 lg:h-10 lg:w-10 text-green-400 group-hover:text-green-300" />
            <div className="ml-3 lg:ml-4 text-left">
              <p className="text-base lg:text-[18pt] font-bold text-white">Send Announcement</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivities />
    </div>
  );
};

export default TeacherDashboard; 