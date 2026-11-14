// Shared database logic for theory quizzes: who a quiz is for, finishing an attempt, and what a student may see of it.
const User = require('../../models/User');
const TheoryAttempt = require('../../models/TheoryAttempt');
const { gradeAttempt, itemScore, totals, roundHalf } = require('./grader');
const ai = require('./aiGrader');
const cheat = require('./cheat');

const ACTIVE_STUDENT = { role: 'student', registrationStatus: 'approved', isActive: true };
const GRACE_MS = 20000; // a save/submit this long after the deadline still counts (slow connections)

/** Active students a quiz is for. */
async function rosterOf(quiz) {
  const a = quiz.audience || {};
  const filter = a.all ? ACTIVE_STUDENT : { ...ACTIVE_STUDENT, $or: [{ _id: { $in: a.students || [] } }, { 'studentInfo.group': { $in: a.groups || [] } }] };
  return User.find(filter).select('firstName lastName studentInfo.group studentInfo.studentId').sort({ firstName: 1, lastName: 1 });
}

/** Is this student in the quiz's audience? */
const isForStudent = (quiz, user) => {
  const a = quiz.audience || {};
  if (a.all) return true;
  if ((a.students || []).some(s => String(s) === String(user._id))) return true;
  return !!user.studentInfo?.group && (a.groups || []).includes(user.studentInfo.group);
};

/** open / upcoming / ended for the quiz window. */
function windowState(quiz, now = new Date()) {
  const { opensAt, closesAt } = quiz.settings || {};
  if (quiz.status === 'closed') return 'ended';
  if (opensAt && now < opensAt) return 'upcoming';
  if (closesAt && now > closesAt) return 'ended';
  return 'open';
}

/** The moment an attempt started now must end: its duration, but never after the window closes. */
function deadlineFor(quiz, startedAt = new Date()) {
  const byDuration = new Date(startedAt.getTime() + quiz.settings.durationMin * 60000);
  return quiz.settings.closesAt && quiz.settings.closesAt < byDuration ? quiz.settings.closesAt : byDuration;
}

const perTopic = (items, grades) => {
  const by = {};
  items.forEach((it, i) => {
    const key = it.topic || 'Other';
    const g = grades[i];
    if (!g) return;
    by[key] ||= { topic: key, chapterKey: it.chapterKey, got: 0, max: 0 };
    by[key].got += itemScore(g);
    by[key].max += g.max;
  });
  return Object.values(by).map(t => ({ ...t, got: roundHalf(t.got) }));
};

/**
 * Marks and closes an attempt. Objective items are final immediately; written ones get a suggested mark
 * (AI when configured, keywords otherwise) and wait for the teacher.
 */
async function finalizeAttempt(quiz, attempt, { auto = false } = {}) {
  if (attempt.status !== 'in_progress') return attempt;
  const grades = gradeAttempt(quiz.items, attempt.answers);
  let aiCount = 0;
  try { aiCount = await ai.applySuggestions(quiz.items, grades); } catch (err) { console.error('AI marking failed:', err.message); }
  const d = cheat.discipline(attempt.events);
  attempt.penalty = d.penalty;
  attempt.sentOff = d.sentOff;
  const t = totals(grades, d.penalty);
  const now = new Date();
  const spentMs = Math.max(0, Math.min(now, attempt.endsAt || now) - attempt.startedAt);
  attempt.grades = grades;
  attempt.score = t.score;
  attempt.maxScore = t.max;
  attempt.aiMarked = aiCount > 0;
  attempt.submittedAt = now;
  attempt.autoSubmitted = auto;
  attempt.status = t.pending ? 'submitted' : 'graded';
  attempt.integrity = cheat.summarise(attempt.events, { durationMs: quiz.settings.durationMin * 60000, spentMs, suggestedMs: quiz.settings.durationMin * 60000, scoreRatio: t.max ? t.score / t.max : null });
  attempt.markModified('grades');
  attempt.markModified('integrity');
  await attempt.save();
  return attempt;
}

/** Closes any attempt whose time ran out while the student was away. */
async function sweepExpired(quiz) {
  const stale = await TheoryAttempt.find({ quiz: quiz._id, status: 'in_progress', endsAt: { $lt: new Date(Date.now() - GRACE_MS) } });
  for (const a of stale) await finalizeAttempt(quiz, a, { auto: true });
  return stale.length;
}

/** What a student may see of a finished attempt: objective marks at once, written ones only once confirmed. */
function resultForStudent(quiz, attempt) {
  const reviewed = attempt.status === 'graded';
  const items = quiz.items.map((it, i) => {
    const g = attempt.grades[i] || { max: it.marks };
    const open = g.final || reviewed;
    const base = { uid: it.uid, type: it.type, category: it.category, topic: it.topic, lead: it.lead, marks: it.marks, pending: !open };
    if (!open) return { ...base, awaiting: true, answer: attempt.answers?.[it.uid] ?? null };
    const out = { ...base, awarded: itemScore(g), max: g.max, rows: g.rows, note: g.note };
    if (g.parts) out.parts = g.parts.map(p => ({ label: p.label, text: p.text, answer: p.answer, awarded: p.awarded, max: p.max, matched: p.matched, missed: p.missed, feedback: p.feedback, model: p.model }));
    if (it.type === 'tf' || it.type === 'tick' || it.type === 'fill' || it.type === 'match' || it.type === 'pick') {
      out.statements = (it.items || []).map(r => r.text);
      out.explanation = it.model;
    }
    return out;
  });
  const t = totals(attempt.grades.map((g, i) => (g.final || reviewed ? g : { ...g, final: false, parts: undefined, awarded: 0, max: g.max ?? quiz.items[i].marks })), attempt.penalty);
  return {
    status: attempt.status,
    reviewed,
    submittedAt: attempt.submittedAt,
    autoSubmitted: attempt.autoSubmitted,
    penalty: attempt.penalty || 0,
    sentOff: !!attempt.sentOff,
    score: reviewed ? t.score : t.objectiveScore,
    max: reviewed ? t.max : t.max,
    scoredOutOf: reviewed ? t.max : t.objectiveMax,
    awaitingReview: !reviewed && attempt.grades.some(g => !g.final),
    percent: reviewed && t.max ? Math.round((t.score / t.max) * 100) : null,
    topics: perTopic(quiz.items, attempt.grades.map((g, i) => (g.final || reviewed ? g : { ...g, parts: undefined, awarded: 0, max: g.max ?? quiz.items[i].marks }))),
    items
  };
}

module.exports = { rosterOf, isForStudent, windowState, deadlineFor, finalizeAttempt, sweepExpired, resultForStudent, perTopic, GRACE_MS, ACTIVE_STUDENT };
