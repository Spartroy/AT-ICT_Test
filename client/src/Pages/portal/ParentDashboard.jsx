import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import {
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  TrophyIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Import parent components
import ParentOverview from '../../components/parent/ParentOverview';
import ChildProgress from '../../components/parent/ChildProgress';
import ReportsMarks from '../../components/parent/ReportsMarks';
import ParentChat from '../../components/parent/ParentChat';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [parentData, setParentData] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      component: ParentOverview
    },
    {
      id: 'progress',
      name: 'Progress',
      icon: TrophyIcon,
      component: ChildProgress
    },
    {
      id: 'reports',
      name: 'Reports & Marks',
      icon: DocumentTextIcon,
      component: ReportsMarks
    },
    {
      id: 'chat',
      name: 'Chat with Teacher',
      icon: ChatBubbleLeftRightIcon,
      component: ParentChat
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
              </div>
              {parentData && (
                <div className="ml-6">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">
                        Welcome, {parentData.user.firstName}!
                      </p>
                      <p className="text-xs text-gray-500">
                        Tracking {parentData.children.length} child{parentData.children.length !== 1 ? 'ren' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Child Selector & Quick Stats */}
            <div className="flex items-center space-x-4">
              {/* Child Selector */}
              {parentData?.children?.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedChild?.student?._id || ''}
                    onChange={(e) => {
                      const child = parentData.children.find(
                        c => c.student._id === e.target.value
                      );
                      switchChild(child);
                    }}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {parentData.children.map((child) => (
                      <option key={child.student._id} value={child.student._id}>
                        {child.student.user.firstName} {child.student.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center text-sm text-green-600">
                <TrophyIcon className="h-4 w-4 mr-1" />
                <span>Grade: {selectedChild?.student?.currentGrade || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm text-blue-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>{stats?.assignments?.completedAssignments || 0} Tasks Done</span>
              </div>
              <div className="flex items-center text-sm text-purple-600">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                <span>{stats?.attendance?.percentage || 0}% Attendance</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh Data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-blue-900">
                    {selectedChild.student.user.firstName} {selectedChild.student.user.lastName}
                  </h2>
                  <p className="text-sm text-blue-700">
                    Year {selectedChild.student.year} • {selectedChild.student.session} Session • 
                    ID: {selectedChild.student.studentId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {selectedChild.student.overallProgress || 0}%
                  </div>
                  <div className="text-blue-600">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {selectedChild.student.currentGrade || 'N/A'}
                  </div>
                  <div className="text-blue-600">Current Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {selectedChild.student.targetGrade || 'A*'}
                  </div>
                  <div className="text-blue-600">Target Grade</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent
                    className={`
                      -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                      ${activeTab === tab.id
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
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