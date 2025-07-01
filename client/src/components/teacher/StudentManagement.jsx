import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showOperationToast, showError } from '../../utils/toast';
import { API_ENDPOINTS } from '../../config/api';
import {
  UserIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  XCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    session: '',
    year: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.current]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.session) params.append('session', filters.session);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);
      params.append('page', pagination.current);
      params.append('limit', 10);

      const response = await fetch(`${API_ENDPOINTS.TEACHER.STUDENTS}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TEACHER.STUDENTS}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedStudent(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateAssignmentFeedback = async (assignmentId, studentId, score, feedback) => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/teacher/assignments/${assignmentId}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score, feedback })
      });

      if (response.ok) {
        showOperationToast.saveSuccess('Assignment feedback');
        fetchStudentDetails(studentId);
      } else {
        const errorData = await response.json();
        showOperationToast.saveError('Assignment feedback', errorData.message);
      }
    } catch (error) {
      console.error('Error updating assignment feedback:', error);
      showOperationToast.networkError();
    } finally {
      setFeedbackLoading(false);
    }
  };

  const downloadStudentFile = async (assignmentId, studentId, filename, originalName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/submissions/${studentId}/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        showOperationToast.downloadError(errorData.message);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showOperationToast.downloadError('Failed to download file');
    }
  };

  const downloadQuizFile = async (quizId, studentId, filename, originalName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.QUIZZES}/${quizId}/submissions/${studentId}/download/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        showOperationToast.downloadError(errorData.message);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showOperationToast.downloadError('Failed to download file');
    }
  };

  const updateQuizFeedback = async (quizId, studentId, score, feedback) => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/teacher/quizzes/${quizId}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score, feedback })
      });

      if (response.ok) {
        showOperationToast.saveSuccess('Quiz feedback');
        fetchStudentDetails(studentId);
      } else {
        const errorData = await response.json();
        showOperationToast.saveError('Quiz feedback', errorData.message);
      }
    } catch (error) {
      console.error('Error updating quiz feedback:', error);
      showOperationToast.networkError();
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700/50 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white">Student Management</h2>
          <p className="text-sm lg:text-[14pt] text-gray-300 mt-1">Manage and monitor student progress and information</p>
        </div>
        <div className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
          {pagination.total} Students
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value })}
          >
            <option value="">All Sessions</option>
            <option value="NOV 25">NOV 25</option>
            <option value="JUN 26">JUN 26</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="10">Year 10</option>
            <option value="11">Year 11</option>
            <option value="12">Year 12</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900/70 text-white"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {!students || students.length === 0 ? (
          <div className="bg-gray-800/60 rounded-xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm border-2 border-dashed border-gray-600/50">
            <UserIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Students Found</h3>
            <p className="text-gray-400">Try adjusting your search filters.</p>
          </div>
        ) : (
          students && Array.isArray(students) ? students.map((student, index) => (
            <motion.div
              key={student._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/70 backdrop-blur-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-700/50"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center ring-2 ring-blue-500/50 flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg lg:text-[18pt] font-semibold text-white truncate">
                        {student.fullName}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm lg:text-[12pt] text-gray-400 mt-1">
                        <span className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          Year {student.year} • {student.session}
                        </span>
                        <span className="hidden sm:inline">ID: {student.studentId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="sm:hidden">
                      <span className="text-xs text-gray-400">ID: {student.studentId}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchStudentDetails(student._id)}
                        disabled={detailsLoading}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 sm:p-4 bg-gray-800/70 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">School</p>
                    <p className="text-sm font-medium text-white truncate">{student.school}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Enrolled</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(student.enrolledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : null
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-2">
          <button
            onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
            disabled={!pagination.hasPrev}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800/70 border border-gray-700/50 text-white rounded-xl disabled:opacity-50 hover:bg-gray-700/90 text-sm"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
            disabled={!pagination.hasNext}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800/70 border border-gray-700/50 text-white rounded-xl disabled:opacity-50 hover:bg-gray-700/90 text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Student Details Modal */}
      <AnimatePresence>
        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 pt-4 sm:pt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-gray-900/90 border border-gray-700 text-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] sm:max-h-[95vh] flex flex-col"
            >
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700/80">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center ring-2 ring-blue-500/50 flex-shrink-0">
                      <span className="text-white font-semibold text-sm sm:text-lg lg:text-xl">
                        {selectedStudent.student.firstName[0]}{selectedStudent.student.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                        {selectedStudent.student.fullName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{selectedStudent.student.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {getStatusBadge(selectedStudent.student.registrationStatus)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedStudent.student.isActive ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                        }`}>
                          {selectedStudent.student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setActiveTab('summary');
                    }}
                    className="text-gray-400 hover:text-white self-end sm:self-auto flex-shrink-0"
                  >
                    <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-700/80 bg-gray-800/30 flex-shrink-0">
                <nav className="flex justify-center sm:justify-start px-2 sm:px-4 lg:px-6">
                  <div className="flex space-x-1 sm:space-x-2 lg:space-x-4 w-full max-w-full">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 sm:flex-none py-3 sm:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base transition-colors ${
                        activeTab === 'summary'
                          ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
                        <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">Summary</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className={`flex-1 sm:flex-none py-3 sm:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base transition-colors ${
                        activeTab === 'assignments'
                          ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
                        <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">
                          <span className="hidden lg:inline">Assignments ({selectedStudent.assignments?.length || 0})</span>
                          <span className="lg:hidden">Assign. ({selectedStudent.assignments?.length || 0})</span>
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('quizzes')}
                      className={`flex-1 sm:flex-none py-3 sm:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base transition-colors ${
                        activeTab === 'quizzes'
                          ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
                        <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">Quizzes ({selectedStudent.quizzes?.length || 0})</span>
                      </div>
                    </button>
                  </div>
                </nav>
              </div>

              <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)]">
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                      <div className="bg-blue-900/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-2 sm:mb-0" />
                          <div className="sm:ml-3">
                            <p className="text-xs sm:text-sm font-medium text-blue-400 sm:hidden">Progress</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">
                              {selectedStudent.student.overallProgress}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-900/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mb-2 sm:mb-0" />
                          <div className="sm:ml-3">
                            <p className="text-xs sm:text-sm font-medium text-green-400">Assignments</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">
                              {selectedStudent.stats?.assignments?.completed || 0}/{selectedStudent.stats?.assignments?.total || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-900/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <QuestionMarkCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mb-2 sm:mb-0" />
                          <div className="sm:ml-3">
                            <p className="text-xs sm:text-sm font-medium text-purple-400">Quizzes</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">
                              {selectedStudent.stats?.quizzes?.completed || 0}/{selectedStudent.stats?.quizzes?.total || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-orange-900/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 mb-2 sm:mb-0" />
                          <div className="sm:ml-3">
                            <p className="text-xs sm:text-sm font-medium text-orange-400">Score</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">
                              {selectedStudent.student.overallProgress || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      <div className="bg-gray-800/70 p-4 sm:p-6 rounded-xl border border-gray-700/50">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Personal Information
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-300 break-all">{selectedStudent.student.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-300">{selectedStudent.student.contactNumber}</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-300">{selectedStudent.student.nationality}</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-300">Enrolled: {new Date(selectedStudent.student.enrolledDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/70 p-4 sm:p-6 rounded-xl border border-gray-700/50">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                          <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Academic Information
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Student ID:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.studentId}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Year:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.year}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Session:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.session}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">School:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.school}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Tech Knowledge:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.techKnowledge}/10</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-xs sm:text-sm text-gray-400">Retaker:</span>
                            <span className="font-medium text-xs sm:text-sm text-gray-300">{selectedStudent.student.isRetaker ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">Assignment Management</h3>
                      <div className="text-sm text-gray-400">
                        {selectedStudent.stats?.assignments?.completed || 0} of {selectedStudent.stats?.assignments?.total || 0} completed
                      </div>
                    </div>
                    
                    {selectedStudent.assignments && Array.isArray(selectedStudent.assignments) && selectedStudent.assignments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedStudent.assignments.map((assignment) => {
                          const studentAssignment = assignment.assignedTo && Array.isArray(assignment.assignedTo) 
                            ? assignment.assignedTo.find(at => 
                            at.student?.toString() === selectedStudent.student._id || 
                            at.user?.toString() === selectedStudent.student._id
                              )
                            : null;
                          return (
                            <div key={assignment._id} className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
                                  <p className="text-gray-300 mt-1">{assignment.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                    <span>Max Score: {assignment.maxScore}</span>
                                    <span>Type: {assignment.type}</span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  studentAssignment?.status === 'graded' ? 'bg-green-900/50 text-green-300' :
                                  studentAssignment?.status === 'submitted' ? 'bg-blue-900/50 text-blue-300' :
                                  studentAssignment?.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-gray-700 text-gray-300'
                                }`}>
                                  {studentAssignment?.status || 'assigned'}
                                </span>
                              </div>

                              {/* Submission Details */}
                              {studentAssignment && studentAssignment.status === 'submitted' && (
                                <div className="border-t border-gray-700 pt-3 sm:pt-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                      <h5 className="text-sm sm:text-base font-medium text-white mb-2">Submission Info</h5>
                                      <p className="text-xs sm:text-sm text-gray-400">
                                        Submitted: {new Date(studentAssignment.submissionDate).toLocaleDateString()}
                                      </p>
                                      {studentAssignment.isLate && (
                                        <p className="text-xs sm:text-sm text-red-400 mt-1">⚠️ Late submission</p>
                                      )}
                                      
                                      {/* Submitted Files */}
                                      {studentAssignment.submission?.attachments && Array.isArray(studentAssignment.submission.attachments) && studentAssignment.submission.attachments.length > 0 && (
                                        <div className="mt-3">
                                          <h6 className="text-xs sm:text-sm font-medium text-white mb-2">Submitted Files:</h6>
                                          <div className="space-y-2">
                                            {studentAssignment.submission.attachments.map((file, idx) => (
                                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-900/70 p-2 sm:p-3 rounded border border-gray-700 gap-2">
                                                <div className="flex items-center min-w-0 flex-1">
                                                  <DocumentTextIcon className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                                                  <div className="min-w-0 flex-1">
                                                    <span className="text-xs sm:text-sm text-gray-300 block truncate">{file.originalName}</span>
                                                    <span className="text-xs text-gray-500">
                                                      ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={() => downloadStudentFile(assignment._id, selectedStudent.student._id, file.filename, file.originalName)}
                                                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                                                >
                                                  Download
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {studentAssignment.submission?.text && (
                                        <div className="mt-3">
                                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Text Submission:</p>
                                          <div className="bg-gray-900/70 p-2 sm:p-3 rounded mt-1 max-h-24 sm:max-h-32 overflow-y-auto border border-gray-700">
                                            <p className="text-xs sm:text-sm text-gray-300">{studentAssignment.submission.text}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <h5 className="text-sm sm:text-base font-medium text-white mb-2">Grading</h5>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Score</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={assignment.maxScore}
                                            defaultValue={studentAssignment.score || ''}
                                            id={`score-${assignment._id}`}
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800/90 text-white text-sm"
                                            placeholder={`Max: ${assignment.maxScore}`}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Feedback</label>
                                          <textarea
                                            rows="3"
                                            defaultValue={studentAssignment.feedback || ''}
                                            id={`feedback-${assignment._id}`}
                                            className="w-full px-2 sm:px-3 py-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-800/90 text-white text-xs sm:text-sm"
                                            placeholder="Provide feedback to the student..."
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const score = document.getElementById(`score-${assignment._id}`).value;
                                            const feedback = document.getElementById(`feedback-${assignment._id}`).value;
                                            updateAssignmentFeedback(assignment._id, selectedStudent.student._id, parseInt(score), feedback);
                                          }}
                                          disabled={feedbackLoading}
                                          className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
                                        >
                                          {feedbackLoading ? 'Saving...' : 'Save Grade & Feedback'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show graded info */}
                              {studentAssignment && studentAssignment.status === 'graded' && (
                                <div className="border-t border-gray-700 pt-4">
                                  <div className="bg-green-900/40 p-4 rounded-xl border border-green-700/50">
                                    <h5 className="font-medium text-green-300 mb-2">Graded Assignment</h5>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-sm text-green-400">Score: </span>
                                        <span className="font-medium text-white">{studentAssignment.score}/{assignment.maxScore}</span>
                                      </div>
                                      {studentAssignment.feedback && (
                                        <div>
                                          <span className="text-sm text-green-400">Feedback: </span>
                                          <p className="text-sm bg-gray-800/70 p-2 rounded mt-1 text-gray-300">{studentAssignment.feedback}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-800/60 rounded-xl border-2 border-dashed border-gray-700/50">
                        <DocumentTextIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No assignments found for this student</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">Quiz Management</h3>
                      <div className="text-sm text-gray-400">
                        {selectedStudent.stats?.quizzes?.completed || 0} of {selectedStudent.stats?.quizzes?.total || 0} completed
                      </div>
                    </div>
                    
                    {selectedStudent.quizzes && Array.isArray(selectedStudent.quizzes) && selectedStudent.quizzes.length > 0 ? (
                      <div className="space-y-4">
                        {selectedStudent.quizzes.map((quiz) => {
                          const studentQuiz = quiz.assignedTo && Array.isArray(quiz.assignedTo)
                            ? quiz.assignedTo.find(at => 
                            at.student?.toString() === selectedStudent.student._id || 
                            at.user?.toString() === selectedStudent.student._id
                              )
                            : null;
                          return (
                            <div key={quiz._id} className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-white">{quiz.title}</h4>
                                  <p className="text-gray-300 mt-1">{quiz.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                    <span>Duration: {quiz.duration} min</span>
                                    <span>Max Score: {quiz.maxScore}</span>
                                    <span>Type: {quiz.type}</span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  studentQuiz?.status === 'graded' ? 'bg-green-900/50 text-green-300' :
                                  studentQuiz?.status === 'submitted' ? 'bg-blue-900/50 text-blue-300' :
                                  studentQuiz?.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-gray-700 text-gray-300'
                                }`}>
                                  {studentQuiz?.status || 'assigned'}
                                </span>
                              </div>

                              {/* Submission Details */}
                              {studentQuiz && studentQuiz.status === 'submitted' && (
                                <div className="border-t border-gray-700 pt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h5 className="font-medium text-white mb-2">Submission Info</h5>
                                      <p className="text-sm text-gray-400">
                                        Submitted: {new Date(studentQuiz.submissionDate).toLocaleDateString()}
                                      </p>
                                      {studentQuiz.isLate && (
                                        <p className="text-sm text-red-400 mt-1">⚠️ Late submission</p>
                                      )}
                                      {studentQuiz.timeSpent && (
                                        <p className="text-sm text-gray-400 mt-1">
                                          Time spent: {studentQuiz.timeSpent} minutes
                                        </p>
                                      )}
                                      
                                      {/* Submitted Files */}
                                      {studentQuiz.submission?.attachments && Array.isArray(studentQuiz.submission.attachments) && studentQuiz.submission.attachments.length > 0 && (
                                        <div className="mt-3">
                                          <h6 className="text-sm font-medium text-white mb-2">Submitted Files:</h6>
                                          <div className="space-y-2">
                                            {studentQuiz.submission.attachments.map((file, idx) => (
                                              <div key={idx} className="flex items-center justify-between bg-gray-900/70 p-2 rounded border border-gray-700">
                                                <div className="flex items-center">
                                                  <DocumentTextIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                  <span className="text-sm text-gray-300">{file.originalName}</span>
                                                  <span className="text-xs text-gray-500 ml-2">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                  </span>
                                                </div>
                                                <button
                                                  onClick={() => downloadQuizFile(quiz._id, selectedStudent.student._id, file.filename, file.originalName)}
                                                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                >
                                                  Download
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {studentQuiz.submission?.text && (
                                        <div className="mt-3">
                                          <p className="text-sm text-gray-400">Text Submission:</p>
                                          <div className="bg-gray-900/70 p-3 rounded mt-1 max-h-32 overflow-y-auto border border-gray-700">
                                            <p className="text-sm text-gray-300">{studentQuiz.submission.text}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-white mb-2">Grading</h5>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300">Score</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={quiz.maxScore}
                                            defaultValue={studentQuiz.score || ''}
                                            id={`quiz-score-${quiz._id}`}
                                            className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-800/90 text-white"
                                            placeholder={`Max: ${quiz.maxScore}`}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300">Feedback</label>
                                          <textarea
                                            rows="3"
                                            defaultValue={studentQuiz.feedback || ''}
                                            id={`quiz-feedback-${quiz._id}`}
                                            className="mt-1 w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-800/90 text-white"
                                            placeholder="Provide feedback to the student..."
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const score = document.getElementById(`quiz-score-${quiz._id}`).value;
                                            const feedback = document.getElementById(`quiz-feedback-${quiz._id}`).value;
                                            updateQuizFeedback(quiz._id, selectedStudent.student._id, parseInt(score), feedback);
                                          }}
                                          disabled={feedbackLoading}
                                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                                        >
                                          {feedbackLoading ? 'Saving...' : 'Save Grade & Feedback'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Show graded info */}
                              {studentQuiz && studentQuiz.status === 'graded' && (
                                <div className="border-t border-gray-700 pt-4">
                                  <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-700/50">
                                    <h5 className="font-medium text-purple-300 mb-2">Graded Quiz</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-sm text-purple-400">Score: </span>
                                        <span className="font-medium text-white">
                                          {studentQuiz.score !== undefined ? `${studentQuiz.score}/${quiz.maxScore}` : `--/${quiz.maxScore}`}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-sm text-purple-400">Percentage: </span>
                                        <span className="font-medium text-white">
                                          {studentQuiz.score !== undefined ? `${Math.round((studentQuiz.score / quiz.maxScore) * 100)}%` : '--%'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-sm text-purple-400">Graded: </span>
                                        <span className="text-sm text-gray-300">
                                          {studentQuiz.gradedDate ? new Date(studentQuiz.gradedDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-sm text-purple-400">Submitted: </span>
                                        <span className="text-sm text-gray-300">
                                          {studentQuiz.submissionDate ? new Date(studentQuiz.submissionDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                    {studentQuiz.feedback && (
                                      <div className="mt-4">
                                        <span className="text-sm text-purple-400">Feedback: </span>
                                        <p className="text-sm bg-gray-800/70 p-2 rounded mt-1 text-gray-300">{studentQuiz.feedback}</p>
                                      </div>
                                    )}
                                    
                                    {/* Show submitted files for graded quizzes too */}
                                    {studentQuiz.submission?.attachments && Array.isArray(studentQuiz.submission.attachments) && studentQuiz.submission.attachments.length > 0 && (
                                      <div className="mt-4">
                                        <h6 className="text-sm font-medium text-purple-300 mb-2">Submitted Files:</h6>
                                        <div className="space-y-2">
                                          {studentQuiz.submission.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-gray-800/70 p-2 rounded border border-purple-700/50">
                                              <div className="flex items-center">
                                                <DocumentTextIcon className="h-4 w-4 text-purple-400 mr-2" />
                                                <span className="text-sm text-gray-300">{file.originalName}</span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                  ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => downloadQuizFile(quiz._id, selectedStudent.student._id, file.filename, file.originalName)}
                                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                                              >
                                                Download
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-800/60 rounded-xl border-2 border-dashed border-gray-700/50">
                        <QuestionMarkCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No quizzes found for this student</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-700/80 flex justify-end space-x-3 mt-auto">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 sm:px-4 py-2 text-gray-300 bg-gray-700/80 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement; 