import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import {
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Import parent components
import ParentOverview from '../../components/parent/ParentOverview';
import AttendanceHomework from '../../components/parent/AttendanceHomework';
import AssignmentsLikeStudent from '../../components/student/AssignmentsTab';
import QuizTracking from '../../components/parent/QuizTracking';
import WeeklyReports from '../../components/parent/WeeklyReports';
import ParentChat from '../../components/parent/ParentChat';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [parentData, setParentData] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon, component: ParentOverview },
    { id: 'assignments', name: 'Homework', icon: DocumentTextIcon, component: AssignmentsLikeStudent },
    { id: 'attendance', name: 'Attendance', icon: CalendarDaysIcon, component: AttendanceHomework },
    { id: 'quiz', name: 'Quiz Tracking', icon: DocumentTextIcon, component: QuizTracking },
    { id: 'reports', name: 'Weekly Reports', icon: DocumentTextIcon, component: WeeklyReports },
    { id: 'chat', name: 'Chat with Teacher', icon: ChatBubbleLeftRightIcon, component: ParentChat }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.PARENT.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setParentData(data.data.parent);
        setSelectedChild(data.data.primaryChild);
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

  const switchChild = (child) => {
    setSelectedChild(child);
    // You could also make an API call to switch primary child
  };

  const getCurrentTabComponent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab && currentTab.component) {
      const Component = currentTab.component;
      // For the reused student Assignments component, pass compatible props
      if (currentTab.id === 'assignments') {
        const studentId = selectedChild?.student?._id;
        const fetchUrl = studentId ? `${API_ENDPOINTS.PARENT.BASE}/child/${studentId}/progress` : '';
        return (
          <Component
            studentData={selectedChild?.student || {}}
            stats={{}}
            fetchUrl={fetchUrl}
            readonly={true}
          />
        );
      }
      return (
        <Component 
          parentData={parentData} 
          selectedChild={selectedChild} 
          stats={stats}
          onRefresh={fetchDashboardData}
        />
      );
    }
    return <div>Tab not found</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3a1a1a] via-[#2a1a1a] to-[#1a1a1a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CA133E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a1a1a] via-[#2a1a1a] to-[#1a1a1a] text-white">
      {/* Header */}
      <div className="border-b border-gray-700/60 bg-gray-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold">Parent Portal</h1>
              </div>
              {parentData && (
                <div className="ml-6">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm">Welcome, {parentData.user.firstName}!</p>
                      <p className="text-xs text-gray-300">Tracking {parentData.children.length} child{parentData.children.length !== 1 ? 'ren' : ''}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Child Selector & Quick Stats */}
            <div className="flex items-center space-x-4">
              {parentData?.children?.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedChild?.student?._id || ''}
                    onChange={(e) => {
                      const child = parentData.children.find(c => c.student._id === e.target.value);
                      switchChild(child);
                    }}
                    className="bg-gray-800/70 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {parentData.children.map((child) => (
                      <option key={child.student._id} value={child.student._id}>
                        {child.student.user.firstName} {child.student.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="hidden sm:flex items-center text-sm text-green-300">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>Grade: {selectedChild?.student?.currentGrade || 'N/A'}</span>
              </div>
              <div className="hidden md:flex items-center text-sm text-blue-300">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>{stats?.assignments?.completedAssignments || 0} Tasks Done</span>
              </div>
              <div className="hidden lg:flex items-center text-sm text-purple-300">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                <span>{stats?.attendance?.percentage || 0}% Attendance</span>
              </div>

              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                title="Refresh Data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/70 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Child Info Bar */}
      {selectedChild && (
        <div className="border-b border-gray-700/60 bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                  <UserIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedChild.student.user.firstName} {selectedChild.student.user.lastName}
                  </h2>
                  <p className="text-sm text-gray-300">
                    Year {selectedChild.student.year} • {selectedChild.student.session} Session • ID: {selectedChild.student.studentId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {selectedChild.student.overallProgress || 0}%
                  </div>
                  <div className="text-gray-300">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {selectedChild.student.currentGrade || 'N/A'}
                  </div>
                  <div className="text-gray-300">Current Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {selectedChild.student.targetGrade || 'A*'}
                  </div>
                  <div className="text-gray-300">Target Grade</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-700/60">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-3 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-[#CA133E] text-white' : 'border-transparent text-gray-300 hover:text-white hover:border-gray-600'}`}
                >
                  <IconComponent
                    className={`-ml-0.5 mr-2 h-5 w-5 transition-colors duration-200 ${activeTab === tab.id ? 'text-[#CA133E]' : 'text-gray-400 group-hover:text-gray-300'}`}
                    aria-hidden="true"
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {getCurrentTabComponent()}
        </motion.div>
      </div>
    </div>
  );
};

export default ParentDashboard; 