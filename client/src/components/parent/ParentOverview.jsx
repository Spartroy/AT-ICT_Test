import React, { useState, useEffect } from 'react';
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
  ExclamationTriangleIcon,
  StarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

const STATUS_CONFIG = {
  graded:    { label: 'Graded',    color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-700/40' },
  submitted: { label: 'Submitted', color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-700/40' },
  late:      { label: 'Late',      color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/40' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/40' },
  assigned:  { label: 'Pending',   color: 'text-gray-400',   bg: 'bg-gray-800/40',   border: 'border-gray-700/40' }
};

const getProgressBarColor = (pct) => {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-blue-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const ParentOverview = ({ parentData, selectedChild, stats, onRefresh }) => {
  const [activity, setActivity] = useState([]);
  const [sectionStats, setSectionStats] = useState({ theory: null, practical: null });
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (selectedChild?.student?._id) {
      fetchChildActivity(selectedChild.student._id);
    }
  }, [selectedChild?.student?._id]);

  const fetchChildActivity = async (childId) => {
    try {
      setActivityLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.PARENT.BASE}/child/${childId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();

      const assignments = data.data.assignments || [];
      const quizzes = data.data.quizzes || [];

      // Build unified recent activity (last 5 items by date)
      const events = [
        ...assignments.map(a => ({
          id: a._id,
          kind: 'assignment',
          title: a.title,
          status: a.status,
          score: a.score,
          maxScore: a.maxScore,
          isLate: a.isLate,
          date: a.submissionDate || a.dueDate
        })),
        ...quizzes.map(q => ({
          id: q._id,
          kind: 'quiz',
          title: q.title,
          status: q.status,
          score: q.score,
          maxScore: q.maxScore,
          isLate: q.isLate,
          date: q.submissionDate || q.startDate
        }))
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

      setActivity(events);

      // Compute theory vs practical stats from graded assignments
      const theoryItems = assignments.filter(a => a.status === 'graded' && a.score != null);
      const practicalItems = quizzes.filter(q => q.status === 'graded' && q.score != null);

      const calcAvg = (items) => {
        if (!items.length) return null;
        const pct = items.map(i => i.maxScore > 0 ? (i.score / i.maxScore) * 100 : 0);
        return Math.round(pct.reduce((s, v) => s + v, 0) / pct.length);
      };

      setSectionStats({
        assignments: { avg: calcAvg(theoryItems), count: theoryItems.length },
        quizzes: { avg: calcAvg(practicalItems), count: practicalItems.length }
      });
    } catch (err) {
      console.error('Error fetching child activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-16 text-gray-400">
        <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-1">No Child Selected</h3>
        <p className="text-sm">Please select a child to view their progress.</p>
      </div>
    );
  }

  const childName = selectedChild.student?.user?.firstName || selectedChild.student?.firstName || 'Your child';
  const overallProgress = selectedChild.student?.overallProgress || 0;
  const currentGrade = selectedChild.student?.currentGrade || 'N/A';
  const targetGrade = selectedChild.student?.targetGrade || 'A*';

  const totalAssignments = stats?.assignments?.totalAssignments || 0;
  const completedAssignments = stats?.assignments?.completedAssignments || 0;
  const pendingAssignments = totalAssignments - completedAssignments;
  const avgAssignmentScore = Math.round(stats?.assignments?.avgScore || 0);

  const totalQuizzes = stats?.quizzes?.totalQuizzes || 0;
  const completedQuizzes = stats?.quizzes?.completedQuizzes || 0;
  const avgQuizScore = Math.round(stats?.quizzes?.avgScore || 0);

  // Dynamic insights derived entirely from real data
  const insights = [];

  if (overallProgress >= 80) {
    insights.push({ type: 'success', icon: TrophyIcon, title: 'Excellent Progress', message: `${childName} is performing above the 80% threshold with ${overallProgress}% overall progress. Keep it up!` });
  } else if (overallProgress >= 50) {
    insights.push({ type: 'info', icon: ArrowTrendingUpIcon, title: 'Good Progress', message: `${childName} is at ${overallProgress}% overall progress — on a positive trajectory. Consistent practice will push scores higher.` });
  } else if (overallProgress > 0) {
    insights.push({ type: 'warning', icon: ExclamationTriangleIcon, title: 'Needs Attention', message: `Overall progress is at ${overallProgress}%. Review graded work together and identify areas to focus on.` });
  }

  if (pendingAssignments > 0) {
    insights.push({ type: 'warning', icon: ClockIcon, title: `${pendingAssignments} Pending Assignment${pendingAssignments > 1 ? 's' : ''}`, message: `${childName} has ${pendingAssignments} assignment${pendingAssignments > 1 ? 's' : ''} not yet submitted. Ensure they are completed before the due dates.` });
  }

  if (avgAssignmentScore >= 80) {
    insights.push({ type: 'success', icon: StarIcon, title: 'Strong Assignment Scores', message: `Average assignment score is ${avgAssignmentScore}%. ${childName} is demonstrating solid understanding of the material.` });
  } else if (avgAssignmentScore > 0 && avgAssignmentScore < 60) {
    insights.push({ type: 'warning', icon: ExclamationTriangleIcon, title: 'Assignment Scores Need Work', message: `Average assignment score is ${avgAssignmentScore}%. Consider reviewing feedback comments on graded work to understand weak areas.` });
  }

  if (insights.length === 0) {
    insights.push({ type: 'info', icon: ChartBarIcon, title: 'Getting Started', message: `No graded work yet. Once ${childName} starts submitting assignments and quizzes, insights will appear here automatically.` });
  }

  const insightStyle = { success: { bg: 'bg-green-900/30', border: 'border-green-700/40', icon: 'text-green-400', text: 'text-green-200', title: 'text-green-300' }, warning: { bg: 'bg-yellow-900/30', border: 'border-yellow-700/40', icon: 'text-yellow-400', text: 'text-yellow-200', title: 'text-yellow-300' }, info: { bg: 'bg-blue-900/30', border: 'border-blue-700/40', icon: 'text-blue-400', text: 'text-blue-200', title: 'text-blue-300' } };

  const summaryCards = [
    { title: 'Assignments', completed: completedAssignments, total: totalAssignments, icon: DocumentTextIcon, color: 'blue' },
    { title: 'Quizzes', completed: completedQuizzes, total: totalQuizzes, icon: AcademicCapIcon, color: 'green' },
    { title: 'Avg Assignment Score', value: avgAssignmentScore, icon: TrophyIcon, color: 'yellow', isScore: true },
    { title: 'Overall Progress', value: overallProgress, icon: ChartBarIcon, color: 'purple', isScore: true }
  ];

  return (
    <div className="space-y-6 lg:space-y-8">

      {/* Child Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#CA133E]/15 to-gray-900/60 rounded-xl p-5 lg:p-6 border border-[#CA133E]/30"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">{childName}'s Progress Summary</h2>
            <p className="text-gray-400 text-sm">Year {selectedChild.student?.year} · {selectedChild.student?.session} Session</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-300">
                <TrophyIcon className="h-4 w-4 text-yellow-400" />
                Current: <span className="font-semibold text-white">{currentGrade}</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                Target: <span className="font-semibold text-white">{targetGrade}</span>
              </span>
            </div>
          </div>
          <div className="text-center sm:text-right flex-shrink-0">
            <div className="text-4xl font-bold text-white">{overallProgress}%</div>
            <div className="text-gray-400 text-sm mt-0.5">Overall Progress</div>
            <div className="mt-2 w-28 sm:ml-auto bg-gray-700 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(overallProgress)}`} style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          const pct = card.isScore ? card.value : (card.total > 0 ? Math.round((card.completed / card.total) * 100) : 0);
          const display = card.isScore ? `${card.value}%` : `${card.completed}/${card.total}`;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-gray-900/60 rounded-xl p-4 sm:p-5 border border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-gray-800 border border-gray-700">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{display}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.title}</div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${getProgressBarColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">{pct}%</div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Real Performance Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/60 rounded-xl border border-gray-700 p-5 lg:p-6"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-400" />
            Academic Performance
          </h3>

          {/* Grade comparison */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Current vs Target Grade</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">{currentGrade}</span>
                <span className="text-gray-500">→</span>
                <span className="text-lg font-bold text-green-400">{targetGrade}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{overallProgress}%</div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
          </div>

          {/* Real score bars */}
          <div className="space-y-3">
            {sectionStats.assignments?.count > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300 w-36 flex-shrink-0">Assignments Avg</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getProgressBarColor(sectionStats.assignments.avg)}`} style={{ width: `${sectionStats.assignments.avg}%` }} />
                </div>
                <span className="text-sm font-medium text-white w-10 text-right">{sectionStats.assignments.avg}%</span>
              </div>
            )}
            {sectionStats.quizzes?.count > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300 w-36 flex-shrink-0">Quizzes Avg</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${getProgressBarColor(sectionStats.quizzes.avg)}`} style={{ width: `${sectionStats.quizzes.avg}%` }} />
                </div>
                <span className="text-sm font-medium text-white w-10 text-right">{sectionStats.quizzes.avg}%</span>
              </div>
            )}
            {!sectionStats.assignments?.count && !sectionStats.quizzes?.count && (
              <p className="text-sm text-gray-500 py-2">No graded work yet — performance breakdown will appear once assignments and quizzes are graded.</p>
            )}
          </div>
        </motion.div>

        {/* Dynamic Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/60 rounded-xl border border-gray-700 p-5 lg:p-6"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
            Insights & Recommendations
          </h3>
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const s = insightStyle[insight.type];
              const Icon = insight.icon;
              return (
                <div key={i} className={`p-3 rounded-xl border ${s.bg} ${s.border}`}>
                  <div className={`flex items-center gap-1.5 ${s.title} font-medium text-sm mb-1`}>
                    <Icon className={`h-4 w-4 ${s.icon}`} />
                    {insight.title}
                  </div>
                  <p className={`text-xs ${s.text}`}>{insight.message}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity — real data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/60 rounded-xl border border-gray-700 p-5 lg:p-6"
      >
        <h3 className="text-base font-semibold text-white mb-4">Recent Activity</h3>

        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-10 w-10 mx-auto mb-2 text-gray-700" />
            <p className="text-sm">No activity yet. Assignments and quizzes will appear here once submitted.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map(item => {
              const cfg = STATUS_CONFIG[item.isLate ? 'late' : item.status] || STATUS_CONFIG.assigned;
              const Icon = item.kind === 'quiz' ? AcademicCapIcon : DocumentTextIcon;
              const scoreLabel = item.score != null ? `${item.score}/${item.maxScore}` : null;

              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{item.kind} · {formatRelativeTime(item.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {scoreLabel && <div className="text-sm font-bold text-white">{scoreLabel}</div>}
                    <div className={`text-xs font-medium ${cfg.color}`}>{item.isLate ? 'Late' : cfg.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ParentOverview;
