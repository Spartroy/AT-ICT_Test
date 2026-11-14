const mongoose = require('mongoose');
const TheoryQuiz = require('../models/TheoryQuiz');
const TheoryAttempt = require('../models/TheoryAttempt');
const { forStudent, shuffle, seeded, uid } = require('../services/theoryQuiz/generator');
const cheat = require('../services/theoryQuiz/cheat');
const svc = require('../services/theoryQuiz/quizService');
const { totals } = require('../services/theoryQuiz/grader');

const fail = (res, error, what) => {
  console.error(`Theory quiz (student) ${what} error:`, error);
  res.status(500).json({ status: 'error', message: `Server error ${what}` });
};
const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

const antiCheat = (quiz) => ({ warnOnLeave: quiz.settings.warnOnLeave, blockPaste: quiz.settings.blockPaste, fullscreen: quiz.settings.fullscreen, pledge: quiz.settings.pledge });

/** Question order for this student: the teacher's order, or a stable shuffle when the quiz asks for one. */
const orderFor = (quiz, attempt) => {
  const idx = quiz.items.map((_, i) => i);
  return quiz.settings.shuffleQuestions ? shuffle(idx, seeded(`${attempt.seed}:order`)) : idx;
};

const payload = (quiz, attempt) => ({
  attemptId: attempt._id,
  title: quiz.title,
  description: quiz.description,
  totalMarks: quiz.totalMarks,
  durationMin: quiz.settings.durationMin,
  startedAt: attempt.startedAt,
  endsAt: attempt.endsAt,
  serverNow: new Date(),
  settings: antiCheat(quiz),
  answers: attempt.answers || {},
  items: orderFor(quiz, attempt).map(i => forStudent(quiz.items[i], attempt.seed))
});

/** Student answers can only be strings, booleans or short lists of them, and only for questions in this quiz. */
function cleanAnswers(quiz, answers) {
  const out = {};
  const known = new Set(quiz.items.map(i => i.uid));
  Object.entries(answers && typeof answers === 'object' ? answers : {}).forEach(([k, v]) => {
    if (!known.has(k)) return;
    const one = (x) => (typeof x === 'boolean' ? x : x === null || x === undefined ? '' : String(x).slice(0, 6000));
    if (Array.isArray(v)) out[k] = v.slice(0, 30).map(one);
    else if (typeof v === 'string') out[k] = v.slice(0, 6000);
  });
  return out;
}

async function loadFor(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { bad(res, 'Unknown quiz', 404); return {}; }
  const quiz = await TheoryQuiz.findById(req.params.id);
  if (!quiz || quiz.status === 'draft' || !svc.isForStudent(quiz, req.user)) { bad(res, 'Unknown quiz', 404); return {}; }
  const attempt = await TheoryAttempt.findOne({ quiz: quiz._id, student: req.user._id });
  return { quiz, attempt };
}

const stateOf = (quiz, attempt) => {
  if (attempt) {
    if (attempt.status === 'in_progress') return new Date() > attempt.endsAt ? 'submitted' : 'in_progress';
    return attempt.status; // submitted | graded
  }
  if (quiz.mode === 'paper') return 'paper';
  const w = svc.windowState(quiz);
  return w === 'ended' ? 'missed' : w;
};

// @route GET /api/theory-quiz/student/quizzes
const listQuizzes = async (req, res) => {
  try {
    const group = req.user.studentInfo?.group;
    const quizzes = await TheoryQuiz.find({
      status: { $in: ['published', 'closed'] },
      $or: [{ 'audience.all': true }, { 'audience.students': req.user._id }, ...(group ? [{ 'audience.groups': group }] : [])]
    }).sort({ publishedAt: -1 }).limit(100);
    const attempts = await TheoryAttempt.find({ student: req.user._id, quiz: { $in: quizzes.map(q => q._id) } });
    // Finish anything whose time ran out while the student was away
    for (const a of attempts) {
      if (a.status === 'in_progress' && a.endsAt < new Date(Date.now() - svc.GRACE_MS)) await svc.finalizeAttempt(quizzes.find(q => String(q._id) === String(a.quiz)), a, { auto: true });
    }
    const byQuiz = new Map(attempts.map(a => [String(a.quiz), a]));
    const out = quizzes.map(q => {
      const a = byQuiz.get(String(q._id));
      const released = !!a && a.status === 'graded';
      return {
        _id: q._id, title: q.title, description: q.description, mode: q.mode, state: stateOf(q, a),
        questions: q.items.length, totalMarks: q.totalMarks, durationMin: q.settings.durationMin,
        opensAt: q.settings.opensAt, closesAt: q.settings.closesAt, passMark: q.settings.passMark, integrity: antiCheat(q),
        attemptId: a?._id || null,
        submittedAt: a?.submittedAt || null,
        score: released ? a.score : null, max: released ? a.maxScore : null,
        awaitingReview: !!a && a.status === 'submitted'
      };
    });
    res.json({ status: 'success', data: { quizzes: out } });
  } catch (err) { fail(res, err, 'loading your quizzes'); }
};

// @route POST /api/theory-quiz/student/quizzes/:id/start
const startQuiz = async (req, res) => {
  try {
    const { quiz, attempt: existing } = await loadFor(req, res);
    if (!quiz) return undefined;
    if (quiz.mode === 'paper') return bad(res, 'This quiz is taken on paper');
    if (existing) {
      if (existing.status === 'in_progress') {
        if (new Date() > new Date(existing.endsAt.getTime() + svc.GRACE_MS)) {
          await svc.finalizeAttempt(quiz, existing, { auto: true });
          return res.status(409).json({ status: 'error', message: 'Your time ran out. The quiz was submitted for you.', data: { attemptId: existing._id, finished: true } });
        }
        existing.events.push(...cheat.cleanEvents([{ t: Math.max(0, Date.now() - existing.startedAt), type: 'resume' }]));
        await existing.save();
        return res.json({ status: 'success', data: payload(quiz, existing) });
      }
      return res.status(409).json({ status: 'error', message: 'You have already taken this quiz', data: { attemptId: existing._id, finished: true } });
    }
    const w = svc.windowState(quiz);
    if (w === 'upcoming') return bad(res, 'This quiz has not opened yet');
    if (w === 'ended') return bad(res, 'This quiz has closed');
    if (quiz.settings.pledge && req.body.pledge !== true) return bad(res, 'Please accept the honesty pledge to start');
    const startedAt = new Date();
    try {
      const attempt = await TheoryAttempt.create({ quiz: quiz._id, student: req.user._id, mode: 'online', seed: uid(), startedAt, endsAt: svc.deadlineFor(quiz, startedAt), pledgeAt: quiz.settings.pledge ? startedAt : undefined });
      return res.status(201).json({ status: 'success', data: payload(quiz, attempt) });
    } catch (err) {
      if (err.code === 11000) return bad(res, 'You have already started this quiz', 409); // double-click race
      throw err;
    }
  } catch (err) { return fail(res, err, 'starting the quiz'); }
};

async function loadAttempt(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { bad(res, 'Unknown attempt', 404); return {}; }
  const attempt = await TheoryAttempt.findOne({ _id: req.params.id, student: req.user._id });
  if (!attempt) { bad(res, 'Unknown attempt', 404); return {}; }
  const quiz = await TheoryQuiz.findById(attempt.quiz);
  if (!quiz) { bad(res, 'Unknown quiz', 404); return {}; }
  return { quiz, attempt };
}

function applyProgress(quiz, attempt, body) {
  attempt.answers = { ...(attempt.answers || {}), ...cleanAnswers(quiz, body.answers) };
  attempt.markModified('answers');
  const room = Math.max(0, 500 - attempt.events.length);
  if (room) attempt.events.push(...cheat.cleanEvents(body.events).slice(0, room));
  attempt.lastSavedAt = new Date();
}

// @route PUT /api/theory-quiz/student/attempts/:id/save
const saveProgress = async (req, res) => {
  try {
    const { quiz, attempt } = await loadAttempt(req, res);
    if (!attempt) return undefined;
    if (attempt.status !== 'in_progress') return res.json({ status: 'success', data: { finished: true, attemptId: attempt._id } });
    if (new Date() > new Date(attempt.endsAt.getTime() + svc.GRACE_MS)) {
      await svc.finalizeAttempt(quiz, attempt, { auto: true });
      return res.json({ status: 'success', data: { finished: true, attemptId: attempt._id } });
    }
    applyProgress(quiz, attempt, req.body);
    await attempt.save();
    return res.json({ status: 'success', data: { savedAt: attempt.lastSavedAt, serverNow: new Date(), endsAt: attempt.endsAt } });
  } catch (err) { return fail(res, err, 'saving your answers'); }
};

// @route POST /api/theory-quiz/student/attempts/:id/submit
const submitQuiz = async (req, res) => {
  try {
    const { quiz, attempt } = await loadAttempt(req, res);
    if (!attempt) return undefined;
    if (attempt.status === 'in_progress') {
      // Answers sent right at the deadline still count; anything later falls back to what was last saved
      if (new Date() <= new Date(attempt.endsAt.getTime() + svc.GRACE_MS)) applyProgress(quiz, attempt, req.body);
      await svc.finalizeAttempt(quiz, attempt, { auto: req.body.auto === true });
    }
    return res.json({ status: 'success', data: svc.resultForStudent(quiz, attempt) });
  } catch (err) { return fail(res, err, 'submitting the quiz'); }
};

// @route GET /api/theory-quiz/student/attempts/:id/result
const getResult = async (req, res) => {
  try {
    const { quiz, attempt } = await loadAttempt(req, res);
    if (!attempt) return undefined;
    if (attempt.status === 'in_progress') {
      if (attempt.endsAt < new Date(Date.now() - svc.GRACE_MS)) await svc.finalizeAttempt(quiz, attempt, { auto: true });
      else return bad(res, 'Finish the quiz first');
    }
    if (attempt.mode === 'paper') {
      const t = totals(attempt.grades);
      return res.json({ status: 'success', data: { paper: true, title: quiz.title, score: t.score, max: t.max, percent: t.max ? Math.round((t.score / t.max) * 100) : null, items: quiz.items.map((it, i) => ({ category: it.category, topic: it.topic, lead: it.lead || it.parts?.[0]?.text || '', awarded: attempt.grades[i]?.awarded ?? 0, max: it.marks })) } });
    }
    return res.json({ status: 'success', data: { title: quiz.title, passMark: quiz.settings.passMark, ...svc.resultForStudent(quiz, attempt) } });
  } catch (err) { return fail(res, err, 'loading your result'); }
};

module.exports = { listQuizzes, startQuiz, saveProgress, submitQuiz, getResult };
