import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  TrophyIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const ChildProgress = ({ selectedChild, parentData }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (selectedChild?.student?._id) {
      fetchProgressData();
    }
  }, [selectedChild, timeframe]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/parent/child/${selectedChild.student._id}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgressData(data.data);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Selected</h3>
        <p className="text-gray-500">Please select a child to view their detailed progress.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
      case 'graded':
        return CheckCircleIcon;
      case 'in_progress':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
      case 'graded':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedChild.student.user.firstName}'s Detailed Progress
          </h2>
          <p className="text-gray-600 mt-1">
            Track assignments, quizzes, and overall academic performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">View:</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="term">This Term</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {selectedChild.student.overallProgress || 0}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${selectedChild.student.overallProgress || 0}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Target: {selectedChild.student.targetGrade || 'A*'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {progressData?.assignments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Assignments</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Completed: {progressData?.assignments?.filter(a => 
              a.assignedTo.some(at => 
                at.student.toString() === selectedChild.student._id && 
                ['submitted', 'graded'].includes(at.status)
              )
            ).length || 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {progressData?.quizzes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Quizzes</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Completed: {progressData?.quizzes?.filter(q => 
              q.assignedTo.some(at => 
                at.student.toString() === selectedChild.student._id && 
                at.status === 'completed'
              )
            ).length || 0}
          </div>
        </motion.div>
      </div>

      {/* Recent Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
          Recent Assignments
        </h3>
        
        {progressData?.assignments?.length > 0 ? (
          <div className="space-y-4">
            {progressData.assignments.slice(0, 5).map((assignment, index) => {
              const studentAssignment = assignment.assignedTo.find(
                a => a.student.toString() === selectedChild.student._id
              );
              const StatusIcon = getStatusIcon(studentAssignment?.status);
              
              return (
                <motion.div
                  key={assignment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(studentAssignment?.status)}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-500">
                        {assignment.subject} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(studentAssignment?.status)}`}>
                      {studentAssignment?.status || 'Not Started'}
                    </div>
                    {studentAssignment?.score !== undefined && (
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {studentAssignment.score}/{assignment.maxScore}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No assignments found</p>
          </div>
        )}
      </motion.div>

      {/* Recent Quizzes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AcademicCapIcon className="h-5 w-5 mr-2 text-green-600" />
          Recent Quizzes
        </h3>
        
        {progressData?.quizzes?.length > 0 ? (
          <div className="space-y-4">
            {progressData.quizzes.slice(0, 5).map((quiz, index) => {
              const studentQuiz = quiz.assignedTo.find(
                q => q.student.toString() === selectedChild.student._id
              );
              
              return (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(studentQuiz?.status)}`}>
                      <AcademicCapIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                      <p className="text-sm text-gray-500">
                        {quiz.subject} • {quiz.questions?.length || 0} questions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(studentQuiz?.status)}`}>
                      {studentQuiz?.status || 'Available'}
                    </div>
                    {studentQuiz?.percentage !== undefined && (
                      <div className={`text-sm font-medium mt-1 ${getProgressColor(studentQuiz.percentage).split(' ')[0]}`}>
                        {Math.round(studentQuiz.percentage)}%
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No quizzes found</p>
          </div>
        )}
      </motion.div>

      {/* Attendance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarDaysIcon className="h-5 w-5 mr-2 text-purple-600" />
          Attendance Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progressData?.attendance?.filter(a => a.status === 'present').length || 0}
            </div>
            <div className="text-sm text-green-600">Present</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {progressData?.attendance?.filter(a => a.status === 'absent').length || 0}
            </div>
            <div className="text-sm text-red-600">Absent</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {progressData?.attendance?.filter(a => a.status === 'late').length || 0}
            </div>
            <div className="text-sm text-yellow-600">Late</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progressData?.attendance?.length > 0 
                ? Math.round((progressData.attendance.filter(a => a.status === 'present').length / progressData.attendance.length) * 100)
                : 0}%
            </div>
            <div className="text-sm text-blue-600">Rate</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChildProgress; 