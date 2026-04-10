/**
 * Points calculation and award utilities for the AT-ICT gamification system.
 *
 * Assignment points formula:
 *   base    = Math.round((score / maxScore) * 50)   → max 50 pts
 *   onTime  = +10 if submissionDate <= dueDate
 *   sameDay = +20 if submission calendar day === publishDate calendar day (stacks with onTime)
 *   total   = base + onTime + sameDay               → max 80 pts
 *
 * Quiz points formula (mark only):
 *   base  = Math.round((score / maxScore) * 100)    → max 100 pts
 *   total = base
 */

const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');

/**
 * Strips time from a Date object for calendar-day comparison.
 * @param {Date} date
 * @returns {string} 'YYYY-MM-DD'
 */
const toDateString = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Calculate points for a graded assignment.
 * @param {number} score            - Student's score
 * @param {number} maxScore         - Maximum possible score
 * @param {Date}   submissionDate   - When the student submitted
 * @param {Date}   dueDate          - Assignment due date
 * @param {Date}   publishDate      - When the assignment was published/created
 * @returns {{ base: number, bonusPoints: number, onTimeBonus: number, sameDayBonus: number, total: number }}
 */
const calculateAssignmentPoints = (score, maxScore, submissionDate, dueDate, publishDate) => {
  const base = maxScore > 0 ? Math.round((score / maxScore) * 50) : 0;

  const sub = new Date(submissionDate);
  const due = new Date(dueDate);
  const pub = new Date(publishDate);

  const isOnTime = sub <= due;
  const isSameDay = toDateString(sub) === toDateString(pub);

  // Same-day submission always qualifies as on-time too
  const onTimeBonus = isOnTime || isSameDay ? 10 : 0;
  const sameDayBonus = isSameDay ? 20 : 0;

  const bonusPoints = onTimeBonus + sameDayBonus;
  const total = base + bonusPoints;

  return { base, onTimeBonus, sameDayBonus, bonusPoints, total };
};

/**
 * Calculate points for a graded quiz (mark only, no timing bonus).
 * @param {number} score    - Student's score
 * @param {number} maxScore - Maximum possible score
 * @returns {{ base: number, bonusPoints: number, total: number }}
 */
const calculateQuizPoints = (score, maxScore) => {
  const base = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { base, bonusPoints: 0, total: base };
};

/**
 * Award or update points for a student after grading.
 * Handles re-grading by diffing the old entry against the new one.
 *
 * @param {string|ObjectId} userId    - The student's User _id
 * @param {object} payload
 * @param {string}          payload.source     - 'assignment' | 'quiz'
 * @param {string|ObjectId} payload.sourceId   - Assignment or Quiz _id
 * @param {string}          payload.title      - Human-readable title for history
 * @param {number}          payload.basePoints
 * @param {number}          payload.bonusPoints
 * @param {number}          payload.total
 */
const awardPoints = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return;

  if (!user.studentInfo.points) {
    user.studentInfo.points = { total: 0, currentSession: 0, sessionLabel: '', history: [] };
  }

  const points = user.studentInfo.points;
  const sourceIdStr = payload.sourceId.toString();

  // Check for existing entry (re-grade scenario)
  const existingIdx = points.history.findIndex(
    (h) => h.sourceId && h.sourceId.toString() === sourceIdStr
  );

  if (existingIdx !== -1) {
    const old = points.history[existingIdx];
    const diff = payload.total - old.total;

    // Update totals by the difference
    points.total = Math.max(0, (points.total || 0) + diff);
    points.currentSession = Math.max(0, (points.currentSession || 0) + diff);

    // Overwrite the history entry
    points.history[existingIdx] = {
      source: payload.source,
      sourceId: payload.sourceId,
      title: payload.title,
      basePoints: payload.basePoints,
      bonusPoints: payload.bonusPoints,
      total: payload.total,
      awardedAt: new Date()
    };
  } else {
    // New entry
    points.total = (points.total || 0) + payload.total;
    points.currentSession = (points.currentSession || 0) + payload.total;

    points.history.push({
      source: payload.source,
      sourceId: payload.sourceId,
      title: payload.title,
      basePoints: payload.basePoints,
      bonusPoints: payload.bonusPoints,
      total: payload.total,
      awardedAt: new Date()
    });
  }

  // Recalculate overallProgress as average score % across all graded assignments
  try {
    const [assignments, quizzes] = await Promise.all([
      Assignment.find({ 'assignedTo.student': userId, 'assignedTo.status': 'graded' }),
      Quiz.find({ 'assignedTo.student': userId, 'assignedTo.status': 'graded' })
    ]);

    const scores = [];

    assignments.forEach((a) => {
      const entry = a.assignedTo.find((s) => s.student?.toString() === userId.toString());
      if (entry && entry.score != null && a.maxScore > 0) {
        scores.push((entry.score / a.maxScore) * 100);
      }
    });

    quizzes.forEach((q) => {
      const entry = q.assignedTo.find((s) => s.student?.toString() === userId.toString());
      if (entry && entry.score != null && q.maxScore > 0) {
        scores.push((entry.score / q.maxScore) * 100);
      }
    });

    if (scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      user.studentInfo.overallProgress = Math.min(100, Math.round(avg));
    }
  } catch (progressErr) {
    console.warn('Non-fatal: overallProgress recalculation failed:', progressErr.message);
  }

  user.markModified('studentInfo');
  await user.save();
};

module.exports = { calculateAssignmentPoints, calculateQuizPoints, awardPoints };
