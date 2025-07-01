import React from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ParentOverview = ({ parentData, selectedChild, stats }) => {
  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Selected</h3>
        <p className="text-gray-500">Please select a child to view their progress.</p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Assignments',
      completed: stats?.assignments?.completedAssignments || 0,
      total: stats?.assignments?.totalAssignments || 0,
      avgScore: stats?.assignments?.avgScore || 0,
      icon: DocumentTextIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Quizzes',
      completed: stats?.quizzes?.completedQuizzes || 0,
      total: stats?.quizzes?.totalQuizzes || 0,
      avgScore: stats?.quizzes?.avgScore || 0,
      icon: AcademicCapIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Attendance',
      completed: stats?.attendance?.present || 0,
      total: stats?.attendance?.total || 0,
      avgScore: stats?.attendance?.percentage || 0,
      icon: CalendarDaysIcon,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Overall Progress',
      completed: selectedChild?.student?.overallProgress || 0,
      total: 100,
      avgScore: selectedChild?.student?.overallProgress || 0,
      icon: ChartBarIcon,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade.includes('A')) return 'text-green-600';
    if (grade.includes('B')) return 'text-blue-600';
    if (grade.includes('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Child Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {selectedChild.student.user.firstName}'s Progress Summary
            </h2>
            <p className="text-blue-100 mb-4">
              Tracking your child's academic journey at AT-ICT
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <TrophyIcon className="h-5 w-5" />
                <span>Current: <span className="font-semibold">{selectedChild.student.currentGrade || 'N/A'}</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5" />
                <span>Target: <span className="font-semibold">{selectedChild.student.targetGrade || 'A*'}</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5" />
                <span>Year: <span className="font-semibold">{selectedChild.student.year}</span></span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{selectedChild.student.overallProgress || 0}%</div>
            <div className="text-blue-100 text-sm">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          const completionPercentage = card.total > 0 ? (card.completed / card.total) * 100 : 0;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${card.bgColor} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-white`}>
                  <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {card.title === 'Overall Progress' ? `${card.completed}%` : `${card.completed}/${card.total}`}
                  </div>
                  <div className="text-sm text-gray-600">{card.title}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(completionPercentage)}`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Average Score */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Score:</span>
                <span className="font-medium text-gray-900">
                  {card.avgScore ? `${Math.round(card.avgScore)}%` : 'N/A'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Academic Performance & Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Academic Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrophyIcon className="h-5 w-5 mr-2 text-green-600" />
            Academic Performance
          </h3>
          
          <div className="space-y-4">
            {/* Grade Comparison */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Current vs Target Grade</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-lg font-bold ${getGradeColor(selectedChild.student.currentGrade)}`}>
                    {selectedChild.student.currentGrade || 'N/A'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-lg font-bold text-green-600">
                    {selectedChild.student.targetGrade || 'A*'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedChild.student.overallProgress || 0}%
                </div>
                <div className="text-xs text-gray-500">To Target</div>
              </div>
            </div>

            {/* Subject Performance */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Subject Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Computer Science Theory</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Practical Applications</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">78%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Programming Tasks</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">72%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Insights & Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
            Insights & Recommendations
          </h3>
          
          <div className="space-y-4">
            {/* Positive Feedback */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700 mb-1">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Great Progress!</span>
              </div>
              <p className="text-sm text-green-600">
                {selectedChild.student.user.firstName} is consistently performing well in theory subjects. 
                Keep up the excellent work!
              </p>
            </div>

            {/* Areas for Improvement */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-700 mb-1">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Focus Areas</span>
              </div>
              <p className="text-sm text-yellow-600">
                Consider additional practice in programming tasks to improve practical skills.
              </p>
            </div>

            {/* Attendance Note */}
            {stats?.attendance?.percentage < 90 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-700 mb-1">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">Attendance</span>
                </div>
                <p className="text-sm text-blue-600">
                  Regular attendance will help maintain consistent progress. Current: {stats.attendance.percentage}%
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center text-purple-700 mb-1">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Next Steps</span>
              </div>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Complete pending assignments for better practice</li>
                <li>• Review quiz feedback for weak areas</li>
                <li>• Schedule extra help sessions if needed</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">Submitted Assignment: Database Design</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <span className="text-green-600 font-medium text-sm">On Time</span>
          </div>
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">Completed Quiz: Data Structures</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
            <span className="text-blue-600 font-medium text-sm">87%</span>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
            <ClockIcon className="h-5 w-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">Upcoming Assignment: Programming Project</p>
              <p className="text-xs text-gray-500">Due in 3 days</p>
            </div>
            <span className="text-yellow-600 font-medium text-sm">Pending</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentOverview; 