/**
 * Points calculation and award utilities for the AT-ICT gamification system.
 * The numbers live in utils/pointsRules.js (and are shown to students at GET /api/student/points).
 */

const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const { RULES, assignmentPoints, quizPoints, effortPoints, streakReached } = require('./pointsRules');

/**
 * Points for a graded assignment: grade (up to 70) + on time (20) + handed in 24h+ early (10); late work earns half the grade part.
 * (publishDate is no longer used; the same-day bonus was replaced by the early bonus.)
 * @returns {{ base, onTimeBonus, earlyBonus, bonusPoints, total, onTime }}
 */
const calculateAssignmentPoints = (score, maxScore, submissionDate, dueDate) =>
  assignmentPoints({ score, maxScore, submissionDate, dueDate });

/** Points for a graded quiz: the mark out of 100, no timing bonus. */
const calculateQuizPoints = (score, maxScore) => quizPoints({ score, maxScore });

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
  const sourceIdStr = String(payload.sourceId ?? payload.sourceKey);
  const sameItem = (h) => h.source === payload.source && String(h.sourceId ?? h.sourceKey) === sourceIdStr;

  // Check for existing entry (re-grade scenario)
  const existingIdx = points.history.findIndex(sameItem);

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
      sourceKey: payload.sourceKey,
      onTime: payload.onTime,
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
      sourceKey: payload.sourceKey,
      onTime: payload.onTime,
      title: payload.title,
      basePoints: payload.basePoints,
      bonusPoints: payload.bonusPoints,
      total: payload.total,
      awardedAt: new Date()
    });
  }

  // A third on-time homework in a row earns the streak bonus (once per homework that completes a run)
  if (payload.source === 'assignment' && payload.onTime) {
    const homework = points.history.filter(h => h.source === 'assignment');
    const alreadyPaid = points.history.some(h => h.source === 'streak' && h.sourceKey === sourceIdStr);
    if (!alreadyPaid && streakReached(homework)) {
      points.total = (points.total || 0) + RULES.streak.bonus;
      points.currentSession = (points.currentSession || 0) + RULES.streak.bonus;
      points.history.push({ source: 'streak', sourceKey: sourceIdStr, title: `${RULES.streak.length} on-time homeworks in a row`, basePoints: 0, bonusPoints: RULES.streak.bonus, total: RULES.streak.bonus, awardedAt: new Date() });
    }
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

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/**
 * Pays a self-study or attendance item once: a video marked done, a notes chapter read, a past paper practised,
 * or a live class joined. Video, notes and past papers share a daily cap. Returns the points given (0 if already paid or capped).
 * `item` is { id } for database ids or { key } for string ids (past papers).
 */
const awardEffort = async (userId, source, item, title) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') return 0;
    const points = user.studentInfo.points || (user.studentInfo.points = { total: 0, currentSession: 0, sessionLabel: '', history: [] });
    const ref = String(item.id ?? item.key);
    if (points.history.some(h => h.source === source && String(h.sourceId ?? h.sourceKey) === ref)) return 0; // each item pays once

    const since = startOfToday();
    const earnedToday = points.history
      .filter(h => RULES.effort.capped.includes(h.source) && new Date(h.awardedAt) >= since)
      .reduce((n, h) => n + (h.total || 0), 0);
    const total = effortPoints(source, earnedToday);

    // A capped (0 point) entry is still recorded, so marking the item again later can't earn it back.
    points.history.push({ source, ...(item.id ? { sourceId: item.id } : { sourceKey: item.key }), title, basePoints: total, bonusPoints: 0, total, awardedAt: new Date() });
    points.total = (points.total || 0) + total;
    points.currentSession = (points.currentSession || 0) + total;
    user.markModified('studentInfo');
    await user.save();
    return total;
  } catch (err) {
    console.warn('Non-fatal: effort points failed:', err.message);
    return 0;
  }
};

module.exports = { calculateAssignmentPoints, calculateQuizPoints, awardPoints, awardEffort };
