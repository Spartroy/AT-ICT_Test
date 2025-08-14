import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ReportsMarks = ({ selectedChild, parentData }) => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    if (selectedChild?.student?._id) {
      fetchReportsData();
    }
  }, [selectedChild]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/parent/child/${selectedChild.student._id}/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Selected</h3>
        <p className="text-gray-500">Please select a child to view their reports and marks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
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

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getLetterGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A*';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const calculateOverallStats = () => {
    const assignments = reportsData?.gradedAssignments || [];
    const quizzes = reportsData?.completedQuizzes || [];
    
    if (assignments.length === 0 && quizzes.length === 0) return null;

    const assignmentScores = assignments.map(a => {
      const studentWork = a.assignedTo.find(at => at.student.toString() === selectedChild.student._id);
      return studentWork ? (studentWork.score / a.maxScore) * 100 : 0;
    });

    const quizScores = quizzes.map(q => {
      const studentQuiz = q.assignedTo.find(at => at.student.toString() === selectedChild.student._id);
      return studentQuiz ? studentQuiz.percentage : 0;
    });

    const allScores = [...assignmentScores, ...quizScores];
    const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    return {
      average: Math.round(average),
      totalAssessments: allScores.length,
      highestScore: Math.round(Math.max(...allScores)),
      lowestScore: Math.round(Math.min(...allScores))
    };
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">
        {selectedChild.student.user.firstName}'s Reports & Marks
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Reports and marks functionality will be implemented here.</p>
      </div>
    </div>
  );
};

export default ReportsMarks; 