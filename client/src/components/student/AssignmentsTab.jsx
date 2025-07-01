import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  DocumentTextIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ArrowPathIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const AssignmentsTab = ({ studentData, stats }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAssignments, setExpandedAssignments] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    
    // Set up auto-refresh every 30 seconds to check for grade updates
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing assignments...');
      fetchAssignments(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAssignments = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.ASSIGNMENTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📚 Assignment data received:', data.data.assignments);
        
        // Log scores for debugging
        data.data.assignments.forEach(assignment => {
          if (assignment.studentData?.score !== undefined) {
            console.log(`📊 ${assignment.title}: Score ${assignment.studentData.score}/${assignment.maxScore}, Status: ${assignment.studentData.status}`);
          }
        });
        
        setAssignments(data.data.assignments);
        setError('');
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const manualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchAssignments();
  };

  const toggleAssignmentExpansion = (assignmentId) => {
    setExpandedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleFileChange = (assignmentId, files) => {
    setSelectedFiles(prev => ({
      ...prev,
      [assignmentId]: Array.from(files)
    }));
  };

  const submitAssignment = async (assignmentId) => {
    const files = selectedFiles[assignmentId] || [];
    
    if (files.length === 0) {
      alert('Please select files to submit');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_ENDPOINTS.STUDENT.ASSIGNMENTS}/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('✅ Assignment submitted successfully!');
        setSelectedFiles(prev => ({ ...prev, [assignmentId]: [] }));
        fetchAssignments(); // Refresh assignments
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('❌ Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'text-green-400';
      case 'submitted': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'late': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score, maxScore) => {
    if (score === undefined || score === null) return 'text-gray-400';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatScore = (score, maxScore, status) => {
    if (status === 'graded' && score !== undefined && score !== null) {
      return `${score}/${maxScore}`;
    }
    return `--/${maxScore}`;
  };

  const getScorePercentage = (score, maxScore) => {
    if (score === undefined || score === null) return null;
    return Math.round((score / maxScore) * 100);
  };

  // Calculate assignment statistics
  const completedCount = assignments.filter(a => 
    a.studentData?.status === 'submitted' || a.studentData?.status === 'graded'
  ).length;
  const pendingCount = assignments.filter(a => 
    a.studentData?.status === 'assigned' || a.studentData?.status === 'in_progress'
  ).length;

  if (loading && assignments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/50 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-700/50 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 rounded-xl shadow-sm p-6 animate-pulse backdrop-blur-sm border-2 border-gray-600/50">
            <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800/60 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-[20pt] font-bold text-white">Assignments</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm sm:text-base lg:text-[14pt]">
            <span className="text-green-400 flex items-center">
              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              {completedCount} Completed
            </span>
            <span className="text-red-400 flex items-center">
              <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              {pendingCount} Pending
            </span>
          </div>
        </div>
        <button
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <ArrowPathIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded-xl text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-3 sm:space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-gray-800/60 rounded-xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm border-2 border-dashed border-gray-600/50">
            <DocumentTextIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">No Assignments</h3>
            <p className="text-sm sm:text-base text-gray-400">Your assignments will appear here once they're assigned.</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const isExpanded = expandedAssignments.has(assignment._id);
            
            return (
              <motion.div
                key={assignment._id}
                layout
                className="bg-gray-900/70 backdrop-blur-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-700/50"
              >
                <div className="p-4 sm:p-6">
                  {/* Condensed Card Header - Always Visible */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0 mt-1 sm:mt-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg lg:text-[18pt] font-semibold text-white truncate">
                            {assignment.title}
                          </h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${
                            assignment.studentData?.status === 'graded' ? 'bg-green-900/50 text-green-300' :
                            assignment.studentData?.status === 'submitted' ? 'bg-blue-900/50 text-blue-300' :
                            assignment.studentData?.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-red-900/50 text-red-300'
                          }`}>
                            {assignment.studentData?.status === 'graded' ? 'Graded' :
                             assignment.studentData?.status === 'submitted' ? 'Submitted' :
                             assignment.studentData?.status === 'in_progress' ? 'In Progress' :
                             'Not Started'}
                          </span>
                        </div>
                        
                        {/* Condensed Info Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm lg:text-[12pt] text-gray-400">
                          <span className="flex items-center">
                            <span className="text-gray-500">Due:</span>
                            <span className="ml-1 text-red-300">
                              {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </span>
                          <span className="hidden sm:flex items-center">
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-1 text-gray-300">{assignment.type}</span>
                          </span>
                          <span className="hidden lg:flex items-center">
                            <span className="text-gray-500">Section:</span>
                            <span className="ml-1 text-gray-300">{assignment.section}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score and Expand Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Current Score Display */}
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Score</div>
                        <div className={`text-lg sm:text-xl font-bold ${getScoreColor(assignment.studentData?.score, assignment.maxScore)}`}>
                          {formatScore(assignment.studentData?.score, assignment.maxScore, assignment.studentData?.status)}
                        </div>
                        {assignment.studentData?.status === 'graded' && assignment.studentData?.score !== undefined && (
                          <div className={`text-xs sm:text-sm font-medium ${getScoreColor(assignment.studentData?.score, assignment.maxScore)}`}>
                            {getScorePercentage(assignment.studentData?.score, assignment.maxScore)} %
                          </div>
                        )}
                      </div>
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleAssignmentExpansion(assignment._id)}
                        className="flex items-center space-x-1 px-2 sm:px-3 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-colors"
                      >
                        <span className="text-xs sm:text-sm">{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-700 pt-4 mt-4 overflow-hidden"
                      >
                        {/* Description */}
                        {assignment.description && (
                          <div className="mb-4">
                            <p className="text-sm sm:text-base text-gray-300">{assignment.description}</p>
                          </div>
                        )}

                        {/* Detailed Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-[12pt] text-gray-400">
                          <div>
                            <span className="text-gray-500">Max Score:</span>
                            <span className="ml-1 text-gray-300">{assignment.maxScore}</span>
                          </div>
                          <div className="sm:hidden">
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-1 text-gray-300">{assignment.type}</span>
                          </div>
                          <div className="lg:hidden">
                            <span className="text-gray-500">Section:</span>
                            <span className="ml-1 text-gray-300">{assignment.section}</span>
                          </div>
                          {assignment.difficulty && (
                            <div>
                              <span className="text-gray-500">Difficulty:</span>
                              <span className="ml-1 text-gray-300">{assignment.difficulty}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-1 text-gray-300">
                              {new Date(assignment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          {/* Instructions */}
                          <div>
                            <h4 className="text-sm sm:text-base lg:text-[14pt] font-medium text-white mb-2">Instructions</h4>
                            <div className="bg-gray-800/70 p-3 sm:p-4 rounded-xl max-h-32 overflow-y-auto">
                              <p className="text-xs sm:text-sm lg:text-[12pt] text-gray-300">
                                {assignment.instructions || 'No specific instructions provided.'}
                              </p>
                            </div>
                          </div>

                          {/* Submission Section */}
                          <div>
                            <h4 className="text-sm sm:text-base lg:text-[14pt] font-medium text-white mb-2">Submission</h4>

                            {/* Show submission status */}
                            {assignment.studentData?.status === 'graded' ? (
                              <div className="bg-green-900/40 p-3 sm:p-4 rounded-xl border border-green-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                                  <span className="text-green-300 font-medium text-sm sm:text-base">Assignment Graded</span>
                                </div>
                                <div className="space-y-2 text-xs sm:text-sm">
                                  <div>
                                    <span className="text-green-400">Score: </span>
                                    <span className="font-medium text-white">
                                      {assignment.studentData?.score}/{assignment.maxScore} : 
                                      ({getScorePercentage(assignment.studentData?.score, assignment.maxScore)} %)
                                    </span>
                                  </div>
                                  {assignment.studentData?.feedback && (
                                    <div>
                                      <span className="text-green-400">Feedback: </span>
                                      <p className="text-gray-300 bg-gray-800/70 p-2 rounded mt-1">
                                        {assignment.studentData.feedback}
                                      </p>
                                    </div>
                                  )}
                                  {assignment.studentData?.gradedDate && (
                                    <div>
                                      <span className="text-green-400">Graded: </span>
                                      <span className="text-gray-300">
                                        {new Date(assignment.studentData.gradedDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : assignment.studentData?.status === 'submitted' ? (
                              <div className="bg-blue-900/40 p-3 sm:p-4 rounded-xl border border-blue-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                                  <span className="text-blue-300 font-medium text-sm sm:text-base">Awaiting Grade</span>
                                </div>
                                <p className="text-blue-200 text-xs sm:text-sm">
                                  Submitted on {new Date(assignment.studentData.submissionDate).toLocaleDateString()}
                                  {assignment.studentData?.isLate && <span className="text-red-400 ml-2">(Late submission)</span>}
                                </p>
                              </div>
                            ) : (
                              /* Upload Section */
                              <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 sm:p-6 text-center">
                                <CloudArrowUpIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400 mb-4 text-sm sm:text-base">Upload your assignment files</p>
                                
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => handleFileChange(assignment._id, e.target.files)}
                                  className="hidden"
                                  id={`file-${assignment._id}`}
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                                />
                                <label
                                  htmlFor={`file-${assignment._id}`}
                                  className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors text-sm sm:text-base"
                                >
                                  <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span>Choose Files</span>
                                </label>
                                
                                {selectedFiles[assignment._id] && selectedFiles[assignment._id].length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-xs sm:text-sm text-gray-400 mb-2">Selected files:</p>
                                    <div className="space-y-1">
                                      {selectedFiles[assignment._id].map((file, index) => (
                                        <div key={index} className="text-xs sm:text-sm text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => submitAssignment(assignment._id)}
                                      disabled={submitting}
                                      className="mt-3 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm sm:text-base w-full sm:w-auto"
                                    >
                                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                                    </button>
                                  </div>
                                )}
                                
                                <p className="text-xs text-gray-500 mt-4">
                                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignmentsTab; 