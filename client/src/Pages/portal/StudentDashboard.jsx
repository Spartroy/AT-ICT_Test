import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlayIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Import student components
import DashboardOverview from '../../components/student/DashboardOverview';
import AssignmentsTab from '../../components/student/AssignmentsTab';
import QuizzesTab from '../../components/student/QuizzesTab';
import MaterialsTab from '../../components/student/MaterialsTab';
import VideosTab from '../../components/student/VideosTab';
import ChatTab from '../../components/student/ChatTab';
import AnnouncementsTab from '../../components/student/AnnouncementsTab';
import ScheduleTab from '../../components/student/ScheduleTab';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [currentTabPage, setCurrentTabPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tabsPerPage, setTabsPerPage] = useState(4);

  // Update tabs per page based on screen size
  useEffect(() => {
    const updateTabsPerPage = () => {
      if (window.innerWidth < 640) { // Mobile
        setTabsPerPage(3);
      } else if (window.innerWidth < 1024) { // Tablet
        setTabsPerPage(4);
      } else { // Desktop
        setTabsPerPage(5);
      }
    };

    updateTabsPerPage();
    window.addEventListener('resize', updateTabsPerPage);
    return () => window.removeEventListener('resize', updateTabsPerPage);
  }, []);

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      component: DashboardOverview
    },
    {
      id: 'announcements',
      name: 'Announcements',
      icon: MegaphoneIcon,
      component: AnnouncementsTab
    },
    {
      id: 'schedule',
      name: 'Schedule',
      icon: CalendarDaysIcon,
      component: ScheduleTab
    },
    {
      id: 'assignments',
      name: 'Assignments',
      icon: DocumentTextIcon,
      component: AssignmentsTab
    },
    {
      id: 'quizzes',
      name: 'Quizzes',
      icon: AcademicCapIcon,
      component: QuizzesTab
    },
    {
      id: 'materials',
      name: 'Materials',
      icon: BookOpenIcon,
      component: MaterialsTab
    },
    {
      id: 'videos',
      name: 'Videos',
      icon: PlayIcon,
      component: VideosTab
    },
    {
      id: 'chat',
      name: 'Chat',
      icon: ChatBubbleLeftRightIcon,
      component: ChatTab
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
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudentData(data.data.student);
        setStats(data.data.stats);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to sign-in page
    navigate('/signin');
  };

  const getCurrentTabComponent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab && currentTab.component) {
      const Component = currentTab.component;
      return <Component studentData={studentData} stats={stats} />;
    }
    return <div>Tab not found</div>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#CA133E]"></div>
        <p className="text-white text-xl font-bold mt-4">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039] border-b border-[#CA133E]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Welcome Message - Full width on top */}
          {studentData && (
            <div className="border-b border-white/10 pb-3 sm:pb-4 pt-4">
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                  Welcome back, {studentData.firstName} {studentData.lastName}!
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 mt-1">
                  Year {studentData.studentInfo?.year} • {studentData.studentInfo?.session} Session • Student Portal
                </p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Dashboard</h1>
              </div>
            </div>
            
            {/* Quick stats and logout */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6">
              <div className="flex items-center text-xs sm:text-sm lg:text-base text-green-400 bg-green-900/30 px-2 sm:px-4 py-1 sm:py-2 rounded-xl">
                <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 sm:mr-2" />
                <span className="font-bold">
                  <span className="hidden sm:inline">Current: </span>
                  {studentData?.studentInfo?.currentGrade || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-xs sm:text-sm lg:text-base text-blue-400 bg-blue-900/30 px-2 sm:px-4 py-1 sm:py-2 rounded-xl">
                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 sm:mr-2" />
                <span className="font-bold">
                  {stats?.assignments?.completedAssignments || 0} 
                  <span className="hidden sm:inline"> Tasks Done</span>
                </span>
              </div>
              {stats?.unreadMessages > 0 && (
                <div className="flex items-center text-xs sm:text-sm lg:text-base text-red-400 bg-red-900/30 px-2 sm:px-4 py-1 sm:py-2 rounded-xl">
                  <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 sm:mr-2" />
                  <span className="font-bold">
                    {stats.unreadMessages} 
                    <span className="hidden sm:inline"> New Messages</span>
                  </span>
                </div>
              )}
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
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Pagination */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="border-b border-[#CA133E]/30">
          <div className="flex items-center py-3 sm:py-4 lg:py-6">
            {/* Left Arrow - Always visible */}
            <motion.button
              onClick={handlePrevPage}
              disabled={currentTabPage === 0 || isTransitioning}
              className={`flex mr-2 lg:mr-4 p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                currentTabPage === 0 || isTransitioning
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-[#CA133E]/20 text-[#CA133E] hover:bg-[#CA133E]/40 hover:scale-110'
              }`}
              whileHover={currentTabPage > 0 && !isTransitioning ? { scale: 1.1 } : {}}
              whileTap={currentTabPage > 0 && !isTransitioning ? { scale: 0.95 } : {}}
            >
              <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </motion.button>

            {/* Tabs Container */}
            <div className="flex-1 flex justify-center overflow-hidden">
              <div className="relative w-full max-w-4xl">
                <AnimatePresence mode="wait" custom={1}>
                  <motion.nav
                    key={currentTabPage}
                    custom={1}
                    variants={tabPageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={tabPageTransition}
                    className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 lg:gap-8 justify-center"
                  >
                    {visibleTabs.map((tab, index) => {
                      const IconComponent = tab.icon;
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            group inline-flex items-center py-2 sm:py-4 lg:py-6 px-1 sm:px-3 lg:px-4 border-b-2 sm:border-b-4 font-medium sm:font-bold text-xs sm:text-sm lg:text-lg transition-all duration-300 whitespace-nowrap rounded-t-xl flex-1 sm:flex-none justify-center sm:justify-start
                            ${activeTab === tab.id
                              ? 'border-[#CA133E] text-[#CA133E] bg-[#CA133E]/10'
                              : 'border-transparent text-gray-300 hover:text-white hover:border-[#CA133E]/50 hover:bg-white/5'
                            }
                          `}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconComponent
                            className={`
                              -ml-0.5 mr-1 sm:mr-2 lg:mr-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 transition-colors duration-300 flex-shrink-0
                              ${activeTab === tab.id
                                ? 'text-[#CA133E]'
                                : 'text-gray-400 group-hover:text-white'
                              }
                            `}
                            aria-hidden="true"
                          />
                          <span className="text-center sm:text-left">
                            <span className="sm:hidden text-xs leading-tight">
                              {tab.name}
                            </span>
                            <span className="hidden sm:inline">{tab.name}</span>
                          </span>
                          
                          {/* Notification badges */}
                          {tab.id === 'announcements' && stats?.announcements?.unreadAnnouncements > 0 && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-1 sm:ml-2 lg:ml-3 inline-flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 text-white"
                            >
                              {stats.announcements.unreadAnnouncements}
                            </motion.span>
                          )}
                          {tab.id === 'assignments' && stats?.assignments?.pendingAssignments > 0 && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-1 sm:ml-2 lg:ml-3 inline-flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white"
                            >
                              {stats.assignments.pendingAssignments}
                            </motion.span>
                          )}
                          {tab.id === 'quizzes' && stats?.quizzes?.pendingQuizzes > 0 && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-1 sm:ml-2 lg:ml-3 inline-flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-xl text-xs sm:text-sm font-bold bg-yellow-600 text-white"
                            >
                              {stats.quizzes.pendingQuizzes}
                            </motion.span>
                          )}
                          {tab.id === 'chat' && stats?.unreadMessages > 0 && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-1 sm:ml-2 lg:ml-3 inline-flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white"
                            >
                              {stats.unreadMessages}
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
              className={`flex ml-2 lg:ml-4 p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                currentTabPage === totalPages - 1 || isTransitioning
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-[#CA133E]/20 text-[#CA133E] hover:bg-[#CA133E]/40 hover:scale-110'
              }`}
              whileHover={currentTabPage < totalPages - 1 && !isTransitioning ? { scale: 1.1 } : {}}
              whileTap={currentTabPage < totalPages - 1 && !isTransitioning ? { scale: 0.95 } : {}}
            >
              <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </motion.button>
          </div>

          {/* Mobile Quick Tab Navigation */}
          <div className="sm:hidden pb-3">
            <div className="flex justify-center">
              <div className="flex space-x-1 max-w-full overflow-x-auto">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-[#CA133E] text-white shadow-lg'
                          : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/50 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title={tab.name}
                    >
                      <IconComponent className="h-5 w-5" />
                      {/* Notification dot for mobile */}
                      {((tab.id === 'announcements' && stats?.announcements?.unreadAnnouncements > 0) ||
                        (tab.id === 'assignments' && stats?.assignments?.pendingAssignments > 0) ||
                        (tab.id === 'quizzes' && stats?.quizzes?.pendingQuizzes > 0) ||
                        (tab.id === 'chat' && stats?.unreadMessages > 0)) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Page Indicator for larger screens */}
          {totalPages > 1 && (
            <div className="hidden sm:flex justify-center pb-2 sm:pb-4">
              <div className="flex space-x-1 sm:space-x-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handlePageIndicatorClick(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                      index === currentTabPage
                        ? 'bg-[#CA133E] scale-125'
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#2a1a1a]/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CA133E]/20"
        >
          {getCurrentTabComponent()}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard; 