import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  PaperClipIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const QuizzesTab = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuizzes, setExpandedQuizzes] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countdowns, setCountdowns] = useState({});

  // Auto-refresh quizzes every 30 seconds
  useEffect(() => {
    fetchQuizzes();
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing quizzes...');
      fetchQuizzes(true); // Silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(interval);
  }, [quizzes]);

  const fetchQuizzes = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.QUIZZES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📚 Quiz data received:', data.data.quizzes);
        
        // Log scores for debugging
        data.data.quizzes.forEach(quiz => {
          if (quiz.studentData?.score !== undefined) {
            console.log(`📊 ${quiz.title}: Score ${quiz.studentData.score}/${quiz.maxScore}, Status: ${quiz.studentData.status}`);
          }
        });
        
        setQuizzes(data.data.quizzes);
        setError('');
      } else {
        throw new Error('Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    
    quizzes.forEach(quiz => {
      // Safety check for required fields
      if (!quiz.startDate || !quiz.startTime || !quiz.duration) {
        console.warn('Quiz missing date/time data:', quiz);
        return;
      }
      
      const now = new Date();
      const quizDate = quiz.startDate.includes('T') ? quiz.startDate.split('T')[0] : quiz.startDate;
      const startDateTime = new Date(`${quizDate}T${quiz.startTime}`);
      
      // Calculate end time based on start time + duration (more reliable than endTime field)
      const endDateTime = new Date(startDateTime.getTime() + (parseInt(quiz.duration) * 60 * 1000));
      
      if (now < startDateTime) {
        // Quiz hasn't started
        const timeUntilStart = startDateTime - now;
        newCountdowns[quiz._id] = {
          type: 'until_start',
          time: timeUntilStart,
          text: formatCountdown(timeUntilStart)
        };
      } else if (now >= startDateTime && now <= endDateTime) {
        // Quiz is active
        const timeRemaining = endDateTime - now;
        newCountdowns[quiz._id] = {
          type: 'remaining',
          time: timeRemaining,
          text: formatCountdown(timeRemaining)
        };
      } else {
        // Quiz has ended
        newCountdowns[quiz._id] = {
          type: 'ended',
          time: 0,
          text: 'Quiz has ended'
        };
      }
    });
    
    setCountdowns(newCountdowns);
  };

  const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) return '00:00:00';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const manualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchQuizzes();
  };

  const toggleQuizExpansion = (quizId) => {
    setExpandedQuizzes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quizId)) {
        newSet.delete(quizId);
      } else {
        newSet.add(quizId);
      }
      return newSet;
    });
  };

  const handleFileChange = (quizId, files) => {
    setSelectedFiles(prev => ({
      ...prev,
      [quizId]: Array.from(files)
    }));
  };

  const startQuiz = async (quizId) => {
    setStarting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.STUDENT.QUIZZES}/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Quiz started successfully!');
        fetchQuizzes(); // Refresh quizzes
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('❌ Error starting quiz');
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async (quizId) => {
    const files = selectedFiles[quizId] || [];
    
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

      const response = await fetch(`${API_ENDPOINTS.STUDENT.QUIZZES}/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('✅ Quiz submitted successfully!');
        setSelectedFiles(prev => ({ ...prev, [quizId]: [] }));
        fetchQuizzes(); // Refresh quizzes
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('❌ Error submitting quiz');
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

  const getQuizAvailability = (quiz) => {
    // Safety check for required fields
    if (!quiz.startDate || !quiz.startTime || !quiz.duration) {
      console.warn('Quiz missing date/time data:', quiz);
      return 'ended'; // Default to ended if data is missing
    }
    
    const now = new Date();
    const quizDate = quiz.startDate.includes('T') ? quiz.startDate.split('T')[0] : quiz.startDate;
    const startDateTime = new Date(`${quizDate}T${quiz.startTime}`);
    
    // Calculate end time based on start time + duration (more reliable than endTime field)
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(quiz.duration) * 60 * 1000));
    
    if (now < startDateTime) return 'upcoming';
    if (now >= startDateTime && now <= endDateTime) return 'active';
    return 'ended';
  };

  // Calculate quiz stats
  const completedCount = quizzes.filter(q => 
    q.studentData?.status === 'submitted' || q.studentData?.status === 'graded'
  ).length;
  const pendingCount = quizzes.filter(q => 
    q.studentData?.status === 'assigned' || q.studentData?.status === 'in_progress'
  ).length;

  if (loading && quizzes.length === 0) {
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
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
        <div>
          <h2 className="text-[20pt] font-bold text-white">Quizzes</h2>
          <div className="flex items-center space-x-4 mt-2 text-[14pt]">
            <span className="text-green-400">
              <CheckCircleIcon className="h-5 w-5 inline mr-1" />
              {completedCount} Completed
            </span>
            <span className="text-red-400">
              <XCircleIcon className="h-5 w-5 inline mr-1" />
              {pendingCount} Pending
            </span>
          </div>
        </div>
        <button
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Quizzes List */}
      <div className="space-y-4">
        {quizzes.length === 0 ? (
          <div className="bg-gray-800/60 rounded-xl p-12 text-center shadow-2xl backdrop-blur-sm border-2 border-dashed border-gray-600/50">
            <h3 className="text-lg font-medium text-white mb-2">No Quizzes</h3>
            <p className="text-gray-400">Your quizzes will appear here once they're assigned.</p>
          </div>
        ) : (
          quizzes.map((quiz) => {
            const isExpanded = expandedQuizzes.has(quiz._id);
            const availability = getQuizAvailability(quiz);
            const countdown = countdowns[quiz._id];
            
            return (
              <motion.div
                key={quiz._id}
                layout
                className="bg-gray-900/70 backdrop-blur-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-700/50"
              >
                <div className="p-6">
                  {/* Condensed Card Header - Always Visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-[18pt] font-semibold text-white">{quiz.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            quiz.studentData?.status === 'graded' ? 'bg-green-900/50 text-green-300' :
                            quiz.studentData?.status === 'submitted' ? 'bg-blue-900/50 text-blue-300' :
                            quiz.studentData?.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-red-900/50 text-red-300'
                          }`}>
                            {quiz.studentData?.status === 'graded' ? 'Graded' :
                             quiz.studentData?.status === 'submitted' ? 'Submitted' :
                             quiz.studentData?.status === 'in_progress' ? 'In Progress' :
                             'Not Started'}
                          </span>
                        </div>
                        
                        {/* Condensed Info Row with Countdown */}
                        <div className="flex items-center space-x-6 text-[12pt] text-gray-400">
                          <span>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-1 text-gray-300">
                              {quiz.startDate ? new Date(quiz.startDate).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric'
                              }) : 'TBD'}
                            </span>
                          </span>
                          <span>
                            <span className="text-gray-500">Time:</span>
                            <span className="ml-1 text-gray-300">
                              {quiz.startTime && quiz.duration ? (() => {
                                const startDateTime = new Date(`${quiz.startDate.includes('T') ? quiz.startDate.split('T')[0] : quiz.startDate}T${quiz.startTime}`);
                                const endDateTime = new Date(startDateTime.getTime() + (parseInt(quiz.duration) * 60 * 1000));
                                const endTime = endDateTime.toTimeString().slice(0, 5);
                                return `${quiz.startTime} - ${endTime}`;
                              })() : 'TBD'}
                            </span>
                          </span>
                          <span>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-1 text-gray-300">{quiz.duration || 0}min</span>
                          </span>
                          {countdown && (
                            <span className={`px-2 py-1 rounded-xl text-sm font-medium ${
                              countdown.type === 'until_start' ? 'bg-blue-900/50 text-blue-300' :
                              countdown.type === 'remaining' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-red-900/50 text-red-300'
                            }`}>
                              {countdown.type === 'until_start' ? '⏰ Starts in: ' :
                               countdown.type === 'remaining' ? '⏱️ Ends in: ' :
                               '⏰ '}
                              {countdown.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score and Action Buttons */}
                    <div className="flex items-center space-x-4">
                      {/* Current Score Display */}
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Score</div>
                        <div className={`text-xl font-bold ${getScoreColor(quiz.studentData?.score, quiz.maxScore)}`}>
                          {formatScore(quiz.studentData?.score, quiz.maxScore, quiz.studentData?.status)}
                        </div>
                        {quiz.studentData?.status === 'graded' && quiz.studentData?.score !== undefined && (
                          <div className={`text-sm font-medium ${getScoreColor(quiz.studentData?.score, quiz.maxScore)}`}>
                            {getScorePercentage(quiz.studentData?.score, quiz.maxScore)}%
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex items-center space-x-2">
                        {quiz.studentData?.status === 'assigned' && availability === 'active' && (
                          <button
                            onClick={() => startQuiz(quiz._id)}
                            disabled={starting}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <PlayIcon className="h-4 w-4" />
                            <span>{starting ? 'Starting...' : 'Start Quiz'}</span>
                          </button>
                        )}
                        
                        {quiz.studentData?.status === 'in_progress' && availability === 'active' && (
                          <span className="px-3 py-2 bg-yellow-600 text-white rounded-xl text-sm">
                            In Progress
                          </span>
                        )}
                        
                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => toggleQuizExpansion(quiz._id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-colors"
                        >
                          <span className="text-sm">{isExpanded ? 'Hide' : 'Details'}</span>
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
                        {quiz.description && (
                          <div className="mb-4">
                            <p className="text-gray-300">{quiz.description}</p>
                          </div>
                        )}

                        {/* Detailed Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-[12pt] text-gray-400">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-1 text-gray-300">{quiz.type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Section:</span>
                            <span className="ml-1 text-gray-300">{quiz.section || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Difficulty:</span>
                            <span className="ml-1 text-gray-300">{quiz.difficulty || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Max Score:</span>
                            <span className="ml-1 text-gray-300">{quiz.maxScore || 0}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Instructions */}
                          <div>
                            <h4 className="text-[14pt] font-medium text-white mb-2">Instructions</h4>
                            <div className="bg-gray-800/70 p-4 rounded-xl max-h-32 overflow-y-auto">
                              <p className="text-gray-300 text-[12pt]">
                                {quiz.instructions || 'No specific instructions provided.'}
                              </p>
                            </div>
                          </div>

                          {/* Submission/Action Section */}
                          <div>
                            <h4 className="text-[14pt] font-medium text-white mb-2">
                              {quiz.studentData?.status === 'graded' ? 'Results' :
                               quiz.studentData?.status === 'submitted' ? 'Submitted' :
                               quiz.studentData?.status === 'in_progress' ? 'In Progress' :
                               'Quiz Action'}
                            </h4>

                            {/* Show quiz status */}
                            {quiz.studentData?.status === 'graded' ? (
                              <div className="bg-green-900/40 p-4 rounded-xl border border-green-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <TrophyIcon className="h-5 w-5 text-green-400" />
                                  <span className="text-green-300 font-medium">Quiz Graded</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-green-400">Score: </span>
                                    <span className="font-medium text-white">
                                      {quiz.studentData?.score}/{quiz.maxScore} :
                                      ({getScorePercentage(quiz.studentData?.score, quiz.maxScore)} %)
                                    </span>
                                  </div>
                                  {quiz.studentData?.feedback && (
                                    <div>
                                      <span className="text-green-400">Feedback: </span>
                                      <p className="text-gray-300 bg-gray-800/70 p-2 rounded mt-1">
                                        {quiz.studentData.feedback}
                                      </p>
                                    </div>
                                  )}
                                  {quiz.studentData?.timeSpent && (
                                    <div>
                                      <span className="text-black">Time Spent: </span>
                                      <span className="text-gray-300">{quiz.studentData.timeSpent} minutes</span>
                                    </div>
                                  )}
                                  {quiz.studentData?.gradedDate && (
                                    <div>
                                      <span className="text-green-400">Graded: </span>
                                      <span className="text-gray-300">
                                        {new Date(quiz.studentData.gradedDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : quiz.studentData?.status === 'submitted' ? (
                              <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ClockIcon className="h-5 w-5 text-blue-400" />
                                  <span className="text-blue-300 font-medium">Awaiting Grade</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <p className="text-blue-200">
                                    Submitted on {new Date(quiz.studentData.submissionDate).toLocaleDateString()}
                                    {quiz.studentData?.isLate && <span className="text-red-400 ml-2">(Late submission)</span>}
                                  </p>
                                  {quiz.studentData?.timeSpent && (
                                    <p className="text-blue-200">
                                      Time spent: {quiz.studentData.timeSpent} minutes
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : quiz.studentData?.status === 'in_progress' ? (
                              <div className="bg-yellow-900/40 p-4 rounded-xl border border-yellow-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                  <span className="text-yellow-300 font-medium">Quiz In Progress</span>
                                </div>
                                <div className="space-y-4">
                                  <p className="text-yellow-200 text-sm">
                                    Quiz started. Upload your completed files to submit.
                                  </p>
                                  
                                  {/* File Upload for In Progress Quiz */}
                                  <div className="border-2 border-dashed border-yellow-600 rounded-xl p-4 text-center">
                                    <CloudArrowUpIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-yellow-400 mb-3 text-sm">Upload your quiz files</p>
                                    
                                    <input
                                      type="file"
                                      multiple
                                      onChange={(e) => handleFileChange(quiz._id, e.target.files)}
                                      className="hidden"
                                      id={`quiz-file-${quiz._id}`}
                                      accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                                    />
                                    <label
                                      htmlFor={`quiz-file-${quiz._id}`}
                                      className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 cursor-pointer transition-colors text-sm"
                                    >
                                      <PaperClipIcon className="h-4 w-4" />
                                      <span>Choose Files</span>
                                    </label>
                                    
                                    {selectedFiles[quiz._id] && selectedFiles[quiz._id].length > 0 && (
                                      <div className="mt-3">
                                        <div className="space-y-1 mb-3">
                                          {selectedFiles[quiz._id].map((file, index) => (
                                            <div key={index} className="text-sm text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded">
                                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </div>
                                          ))}
                                        </div>
                                        <button
                                          onClick={() => submitQuiz(quiz._id)}
                                          disabled={submitting}
                                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                                        >
                                          {submitting ? 'Submitting...' : 'Submit Quiz'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Quiz not started */
                              <div className={`p-4 rounded-xl border ${
                                availability === 'upcoming' ? 'bg-blue-900/40 border-blue-700/50' :
                                availability === 'active' ? 'bg-green-900/40 border-green-700/50' :
                                'bg-red-900/40 border-red-700/50'
                              }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                  {availability === 'upcoming' ? (
                                    <>
                                      <ClockIcon className="h-5 w-5 text-blue-400" />
                                      <span className="text-blue-300 font-medium">Quiz Upcoming</span>
                                    </>
                                  ) : availability === 'active' ? (
                                    <>
                                      <PlayIcon className="h-5 w-5 text-green-400" />
                                      <span className="text-green-300 font-medium">Ready to Start</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircleIcon className="h-5 w-5 text-red-400" />
                                      <span className="text-red-300 font-medium">Quiz Ended</span>
                                    </>
                                  )}
                                </div>
                                
                                {availability === 'upcoming' && countdown && (
                                  <p className="text-blue-200 text-sm">
                                    Quiz starts in: <span className="font-mono">{countdown.text}</span>
                                  </p>
                                )}
                                
                                {availability === 'active' && (
                                  <div className="space-y-2">
                                    <p className="text-green-200 text-sm">
                                      Quiz is now available. Click "Start Quiz" to begin.
                                    </p>
                                    <div className="text-sm text-green-300">
                                      <div>• Duration: {quiz.duration} minutes</div>
                                      <div>• Max Score: {quiz.maxScore} points</div>
                                    </div>
                                  </div>
                                )}
                                
                                {availability === 'ended' && (
                                  <p className="text-red-200 text-sm">
                                    This quiz has ended and is no longer available.
                                  </p>
                                )}
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

export default QuizzesTab; 