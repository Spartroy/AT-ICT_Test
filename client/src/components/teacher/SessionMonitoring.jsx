import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess, showWarning, showInfo } from '../../utils/toast';
import {
  ArrowRightOnRectangleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const SessionMonitoring = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalActiveSessions: 0,
    studentsWithSessions: 0,
    studentsWithoutSessions: 0,
    averageSessionsPerStudent: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  useEffect(() => {
    fetchStudentSessions();
    fetchSessionStats();
  }, []);

  const fetchStudentSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER_SESSIONS.STUDENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students);
      } else {
        showError('Failed to fetch student sessions');
      }
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      showError('Error fetching student sessions');
    }
  };

  const fetchSessionStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TEACHER_SESSIONS.STATS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        showError('Failed to fetch session statistics');
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
      showError('Error fetching session statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSession = async (studentId, sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER_SESSIONS.BASE}/students/${studentId}/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess('Session deactivated successfully');
        fetchStudentSessions();
        fetchSessionStats();
      } else {
        showError('Failed to deactivate session');
      }
    } catch (error) {
      console.error('Error deactivating session:', error);
      showError('Error deactivating session');
    }
  };

  const handleDeactivateAllSessions = async (studentId) => {
    if (!window.confirm('Are you sure you want to deactivate all sessions for this student?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER_SESSIONS.BASE}/students/${studentId}/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess('All sessions deactivated successfully');
        fetchStudentSessions();
        fetchSessionStats();
      } else {
        showError('Failed to deactivate sessions');
      }
    } catch (error) {
      console.error('Error deactivating sessions:', error);
      showError('Error deactivating sessions');
    }
  };

  const getDeviceIcon = (deviceName) => {
    if (deviceName.includes('iPhone') || deviceName.includes('Android')) {
      return <DevicePhoneMobileIcon className="h-4 w-4" />;
    } else if (deviceName.includes('iPad')) {
      return <DevicePhoneMobileIcon className="h-4 w-4" />;
    } else {
      return <ComputerDesktopIcon className="h-4 w-4" />;
    }
  };

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600/20 rounded-xl">
              <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Session Monitoring</h2>
              <p className="text-sm sm:text-base text-gray-400">Monitor student device sessions and login activity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-1 rounded-xl">
            <ChartBarIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Live Monitoring</span>
          </div>
        </div>

        {/* Stats Grid - Improved Responsiveness */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400">Total Students</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <WifiIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400">Active Sessions</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{stats.totalActiveSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400">Online Students</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{stats.studentsWithSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <NoSymbolIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400">Offline Students</p>
                <p className="text-lg sm:text-xl font-semibold text-white">{stats.studentsWithoutSessions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List - Improved Responsiveness */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-white">Student Sessions</h3>
          <p className="text-sm sm:text-base text-gray-400">Monitor individual student device activity</p>
        </div>
        
        <div className="divide-y divide-gray-700">
          {students.map((student) => (
            <div key={student.id} className="p-4 sm:p-6 hover:bg-gray-700/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-semibold text-sm">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-medium text-sm sm:text-base truncate">
                      {student.firstName} {student.lastName}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">{student.email}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        student.registrationStatus === 'approved' 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {student.registrationStatus}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        Last login: {formatLastLogin(student.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {student.activeSessionCount > 0 ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                      ) : (
                        <NoSymbolIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        student.activeSessionCount > 0 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {student.activeSessionCount} session{student.activeSessionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    {student.activeSessionCount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetails(true);
                        }}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors"
                        title="View sessions"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {student.activeSessionCount > 0 && (
                      <button
                        onClick={() => handleDeactivateAllSessions(student.id)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-colors"
                        title="Deactivate all sessions"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Session Details Modal - Improved Responsiveness */}
      <AnimatePresence>
        {showStudentDetails && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStudentDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-semibold text-sm">
                      {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">{selectedStudent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStudentDetails(false)}
                  className="p-2 bg-gray-700/50 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors self-start sm:self-auto"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium text-sm sm:text-base">
                  Active Sessions ({selectedStudent.sessions.length})
                </h4>
                
                {selectedStudent.sessions.map((session) => (
                  <div key={session.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {getDeviceIcon(session.deviceName)}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm sm:text-base truncate">
                            {session.deviceName}
                          </p>
                          <p className="text-sm text-gray-400 truncate">{session.ipAddress}</p>
                          <p className="text-xs text-gray-500">
                            Last activity: {formatLastActivity(session.lastActivity)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          handleDeactivateSession(selectedStudent.id, session.id);
                          setShowStudentDetails(false);
                        }}
                        className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-colors self-start sm:self-auto"
                        title="Deactivate session"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionMonitoring; 