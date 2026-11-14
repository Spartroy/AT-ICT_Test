const mongoose = require('mongoose');
const TheoryQuestion = require('../models/TheoryQuestion');
const TheoryQuiz = require('../models/TheoryQuiz');
const TheoryAttempt = require('../models/TheoryAttempt');
const User = require('../models/User');
const groups = require('../services/groups');
const { notify } = require('../services/notifications');
const bank = require('../services/theoryQuiz/bank');
const { CATEGORIES } = require('../services/theoryQuiz/categories');
const { generate, availability, toItem, uid, usable, plain } = require('../services/theoryQuiz/generator');
const { itemScore, totals, roundHalf, clamp, gradeAttempt } = require('../services/theoryQuiz/grader');
const ai = require('../services/theoryQuiz/aiGrader');
const cheat = require('../services/theoryQuiz/cheat');
const svc = require('../services/theoryQuiz/quizService');
const { sanitizeQuestion } = require('../validators/theoryQuestion');

const fail = (res, error, what) => {
  console.error(`Theory quiz ${what} error:`, error);
  res.status(500).json({ status: 'error', message: `Server error ${what}` });
};
const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });
const isId = (v) => mongoose.isValidObjectId(v);
const asArray = (v) => (Array.isArray(v) ? v : []);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---- meta + bank ------------------------------------------------------------------------------------------------

/** Pool of bank questions for a scope: { chapters: ['1','6a'], topics: ['1|Software'] }. */
async function poolFor(scope = {}) {
  await bank.ensureBank();
  const keys = asArray(scope.chapters).map(String);
  const picked = asArray(scope.topics).map(String);
  const filter = keys.length ? { chapterKey: { $in: keys } } : {};
  const all = await TheoryQuestion.find(filter).lean();
  const chosen = {};
  picked.forEach(t => { const [k, ...rest] = t.split('|'); (chosen[k] ||= new Set()).add(rest.join('|')); });
  return all.filter(q => !chosen[q.chapterKey] || chosen[q.chapterKey].has(q.topic));
}

// @route GET /api/theory-quiz/teacher/meta
const getMeta = async (req, res) => {
  try {
    await bank.ensureBank();
    const all = await TheoryQuestion.find({}).select('chapterKey topic category type command difficulty marks hidden dupOf needsContext contextNote imageUrl items').lean();
    const chapters = bank.chapters().map(c => {
      const mine = all.filter(q => q.chapterKey === c.key);
      const ok = mine.filter(usable);
      return { ...c, total: mine.length, usable: ok.length, marks: ok.reduce((n, q) => n + q.marks, 0), topics: c.topics.map(t => ({ title: t, usable: ok.filter(q => q.topic === t).length, total: mine.filter(q => q.topic === t).length })) };
    });
    res.json({ status: 'success', data: { chapters, categories: CATEGORIES, phases: [1, 2, 3].map(p => ({ phase: p, label: `Phase ${p}`, chapters: chapters.filter(c => c.phase === p).map(c => c.key) })), ai: ai.enabled() } });
  } catch (err) { fail(res, err, 'loading the quiz generator'); }
};

// @route GET /api/theory-quiz/teacher/bank
const listBank = async (req, res) => {
  try {
    await bank.ensureBank();
    const { chapter, topic, category, difficulty, search, show = 'all' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, parseInt(req.query.limit, 10) || 30);
    const q = {};
    if (chapter) q.chapterKey = String(chapter);
    if (topic) q.topic = String(topic);
    if (category) q.category = String(category);
    if (difficulty) q.difficulty = String(difficulty);
    if (show === 'hidden') q.hidden = true;
    const and = [];
    if (show === 'issues') and.push({ $or: [{ needsContext: true, imageUrl: '', contextNote: '' }, { dupOf: { $ne: null } }] });
    if (show === 'mine') q.source = 'teacher';
    if (search) {
      const re = new RegExp(escapeRe(String(search).slice(0, 80)), 'i');
      and.push({ $or: [{ lead: re }, { model: re }, { 'items.text': re }, { 'parts.text': re }, { qNo: re }] });
    }
    const filter = and.length ? { ...q, $and: and } : q;
    const [questions, total] = await Promise.all([
      TheoryQuestion.find(filter).sort({ chapter: 1, chapterKey: 1, srcId: 1, createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      TheoryQuestion.countDocuments(filter)
    ]);
    res.json({ status: 'success', data: { questions, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { fail(res, err, 'loading the question bank'); }
};

const saveQuestion = async (req, res, existing) => {
  try {
    const { doc, error } = sanitizeQuestion({ ...req.body, ...(existing ? { type: existing.type } : {}) }, bank.chapters(), existing);
    if (error) return bad(res, error);
    if (existing) {
      // The "needs a picture" flag clears once a picture or the missing scenario is attached
      doc.needsContext = existing.needsContext && !doc.imageUrl && !doc.contextNote;
      Object.assign(existing, doc, { edited: true });
      existing.markModified('items');
      existing.markModified('parts');
      await existing.save();
      return res.json({ status: 'success', data: { question: existing } });
    }
    const created = await TheoryQuestion.create({ ...doc, source: 'teacher', createdBy: req.user.id });
    return res.status(201).json({ status: 'success', data: { question: created } });
  } catch (err) { return fail(res, err, 'saving the question'); }
};
const createQuestion = (req, res) => saveQuestion(req, res, null);
const updateQuestion = async (req, res) => {
  if (!isId(req.params.id)) return bad(res, 'Unknown question', 404);
  const q = await TheoryQuestion.findById(req.params.id);
  if (!q) return bad(res, 'Unknown question', 404);
  return saveQuestion(req, res, q);
};
const deleteQuestion = async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, 'Unknown question', 404);
    const q = await TheoryQuestion.findById(req.params.id);
    if (!q) return bad(res, 'Unknown question', 404);
    if (q.source === 'teacher') { await q.deleteOne(); return res.json({ status: 'success', message: 'Question deleted' }); }
    q.hidden = true; // the Classified ones are never deleted, only hidden
    await q.save();
    return res.json({ status: 'success', message: 'Question hidden from new quizzes', data: { question: q } });
  } catch (err) { return fail(res, err, 'deleting the question'); }
};

// ---- generating ------------------------------------------------------------------------------------------------

// @route POST /api/theory-quiz/teacher/scope  { chapters, topics }
const scopeAvailability = async (req, res) => {
  try {
    const pool = await poolFor(req.body.scope || req.body);
    res.json({ status: 'success', data: { availability: availability(pool), questions: pool.filter(usable).length } });
  } catch (err) { fail(res, err, 'checking the scope'); }
};

/** Bank ids already used in this teacher's other quizzes, so a fresh quiz leans on questions not seen recently. */
async function recentlyUsed(teacherId) {
  const quizzes = await TheoryQuiz.find({ createdBy: teacherId, status: { $ne: 'draft' } }).select('items.bankId').sort({ createdAt: -1 }).limit(20).lean();
  return new Set(quizzes.flatMap(q => (q.items || []).map(i => i.bankId)).filter(Boolean));
}

// @route POST /api/theory-quiz/teacher/generate  { scope, counts, difficulty }
const generateItems = async (req, res) => {
  try {
    const pool = await poolFor(req.body.scope);
    const { items, shortages } = generate({ pool, counts: req.body.counts || {}, difficulty: req.body.difficulty, preferNot: await recentlyUsed(req.user.id) });
    if (!items.length) return bad(res, 'No questions match that scope and mix. Choose more chapters or lower the counts.');
    res.json({ status: 'success', data: { items, shortages, totalMarks: items.reduce((n, i) => n + i.marks, 0) } });
  } catch (err) { fail(res, err, 'generating the quiz'); }
};

// @route POST /api/theory-quiz/teacher/swap  { scope, category, exclude: [bankId], difficulty }
const swapItem = async (req, res) => {
  try {
    const pool = await poolFor(req.body.scope);
    const { items } = generate({ pool, counts: { [req.body.category]: 1 }, difficulty: req.body.difficulty, exclude: new Set(asArray(req.body.exclude).map(String)) });
    if (!items.length) return bad(res, 'No other question of that type is left in this scope', 404);
    res.json({ status: 'success', data: { item: items[0] } });
  } catch (err) { fail(res, err, 'swapping the question'); }
};

// @route POST /api/theory-quiz/teacher/item  { bankId, presentation } - add one specific bank question
const itemFromBank = async (req, res) => {
  try {
    if (!isId(req.body.bankId)) return bad(res, 'Unknown question', 404);
    const q = await TheoryQuestion.findById(req.body.bankId).lean();
    if (!q) return bad(res, 'Unknown question', 404);
    res.json({ status: 'success', data: { item: toItem(q) } });
  } catch (err) { fail(res, err, 'adding the question'); }
};

// ---- quizzes ----------------------------------------------------------------------------------------------------

/** Rebuilds the stored snapshots from the bank so a request can only choose questions and marks, never rewrite answers. */
async function buildItems(specs) {
  const ids = asArray(specs).map(s => s.bankId).filter(isId);
  const found = await TheoryQuestion.find({ _id: { $in: ids } }).lean();
  const byId = new Map(found.map(q => [String(q._id), q]));
  const items = [];
  for (const s of asArray(specs)) {
    const q = byId.get(String(s.bankId));
    if (!q) return { error: 'One of the questions no longer exists. Remove it and try again.' };
    const marks = Number(s.marks);
    if (!Number.isFinite(marks) || marks <= 0 || marks > 60) return { error: 'Every question needs marks between 0.5 and 60' };
    const wb = s.presentation === 'wordbank' ? asArray(s.wordbank).map(w => String(w).slice(0, 80)).slice(0, 30) : undefined;
    const item = toItem(q, { presentation: s.presentation === 'wordbank' ? 'wordbank' : 'default', marks: Math.round(marks * 2) / 2, wordbank: wb });
    if (s.presentation === 'wordbank' && (!wb || wb.length < item.items.length)) return { error: 'A word bank question needs its words' };
    item.uid = typeof s.uid === 'string' && /^[a-f0-9]{6,12}$/.test(s.uid) ? s.uid : uid();
    items.push(item);
  }
  return { items };
}

function cleanSettings(s = {}) {
  const dt = (v) => (v ? new Date(v) : undefined);
  const out = {
    durationMin: clamp(Math.round(Number(s.durationMin) || 30), 1, 300),
    opensAt: dt(s.opensAt),
    closesAt: dt(s.closesAt),
    shuffleQuestions: !!s.shuffleQuestions,
    fullscreen: !!s.fullscreen,
    warnOnLeave: s.warnOnLeave !== false,
    blockPaste: s.blockPaste !== false,
    pledge: s.pledge !== false,
    passMark: clamp(Math.round(Number(s.passMark) || 50), 0, 100)
  };
  if ((out.opensAt && Number.isNaN(out.opensAt.getTime())) || (out.closesAt && Number.isNaN(out.closesAt.getTime()))) return { error: 'Enter valid open and close times' };
  if (out.opensAt && out.closesAt && out.closesAt <= out.opensAt) return { error: 'The quiz must close after it opens' };
  return { settings: out };
}

async function cleanAudience(body = {}) {
  const a = body.audience || {};
  if (a.mode === 'groups' || a.mode === 'selected') {
    const r = await groups.resolveAudience({ assignToAll: false, groups: a.mode === 'groups' ? a.groups : [], selectedStudents: a.mode === 'selected' ? a.students : [] });
    if (r.error) return { error: r.error };
    return { audience: { all: false, groups: r.groups, students: a.mode === 'selected' ? r.studentIds : [] } };
  }
  return { audience: { all: true, groups: [], students: [] } };
}

const summary = (quiz, attempts = []) => {
  const done = attempts.filter(a => a.status !== 'in_progress');
  const graded = done.filter(a => a.status === 'graded');
  return {
    _id: quiz._id, title: quiz.title, description: quiz.description, status: quiz.status, mode: quiz.mode, totalMarks: quiz.totalMarks, questions: quiz.items.length,
    settings: quiz.settings, audience: quiz.audience, scope: quiz.scope, publishedAt: quiz.publishedAt, createdAt: quiz.createdAt, updatedAt: quiz.updatedAt,
    stats: {
      started: attempts.length, submitted: done.length, toReview: done.filter(a => a.status === 'submitted').length,
      average: graded.length ? Math.round((graded.reduce((n, a) => n + (a.maxScore ? a.score / a.maxScore : 0), 0) / graded.length) * 100) : null,
      flagged: done.filter(a => a.integrity && ['medium', 'high'].includes(a.integrity.risk)).length
    }
  };
};

// @route POST /api/theory-quiz/teacher/quizzes
const createQuiz = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim().slice(0, 200);
    if (!title) return bad(res, 'Give the quiz a title');
    const built = await buildItems(req.body.items);
    if (built.error) return bad(res, built.error);
    if (!built.items.length) return bad(res, 'Add at least one question');
    const s = cleanSettings(req.body.settings);
    if (s.error) return bad(res, s.error);
    const a = await cleanAudience(req.body);
    if (a.error) return bad(res, a.error);
    const quiz = await TheoryQuiz.create({
      title, description: String(req.body.description || '').slice(0, 1000), mode: req.body.mode === 'paper' ? 'paper' : 'online',
      items: built.items, totalMarks: roundHalf(built.items.reduce((n, i) => n + i.marks, 0)), scope: req.body.scope || {},
      settings: s.settings, audience: a.audience, createdBy: req.user.id
    });
    res.status(201).json({ status: 'success', data: { quiz: summary(quiz) } });
  } catch (err) { fail(res, err, 'saving the quiz'); }
};

const findOwn = async (req, res) => {
  if (!isId(req.params.id)) { bad(res, 'Unknown quiz', 404); return null; }
  const quiz = await TheoryQuiz.findById(req.params.id);
  if (!quiz) { bad(res, 'Unknown quiz', 404); return null; }
  return quiz;
};

// @route GET /api/theory-quiz/teacher/quizzes
const listQuizzes = async (req, res) => {
  try {
    const quizzes = await TheoryQuiz.find({}).sort({ createdAt: -1 }).limit(200);
    const attempts = await TheoryAttempt.find({ quiz: { $in: quizzes.map(q => q._id) } }).select('quiz status score maxScore integrity').lean();
    res.json({ status: 'success', data: { quizzes: quizzes.map(q => summary(q, attempts.filter(a => String(a.quiz) === String(q._id)))) } });
  } catch (err) { fail(res, err, 'loading the quizzes'); }
};

// @route GET /api/theory-quiz/teacher/quizzes/:id
const getQuiz = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    const attempts = await TheoryAttempt.find({ quiz: quiz._id }).select('status score maxScore integrity').lean();
    res.json({ status: 'success', data: { quiz: { ...summary(quiz, attempts), items: quiz.items } } });
  } catch (err) { fail(res, err, 'loading the quiz'); }
};

// @route PUT /api/theory-quiz/teacher/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    const attempted = await TheoryAttempt.countDocuments({ quiz: quiz._id });
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim().slice(0, 200);
      if (!title) return bad(res, 'Give the quiz a title');
      quiz.title = title;
    }
    if (req.body.description !== undefined) quiz.description = String(req.body.description).slice(0, 1000);
    if (req.body.items) {
      if (attempted) return bad(res, 'Students have already started this quiz, so its questions can no longer change');
      const built = await buildItems(req.body.items);
      if (built.error) return bad(res, built.error);
      if (!built.items.length) return bad(res, 'Add at least one question');
      quiz.items = built.items;
      quiz.totalMarks = roundHalf(built.items.reduce((n, i) => n + i.marks, 0));
      quiz.markModified('items');
    }
    if (req.body.mode && !attempted) quiz.mode = req.body.mode === 'paper' ? 'paper' : 'online';
    if (req.body.settings) {
      const s = cleanSettings({ ...quiz.settings.toObject?.(), ...req.body.settings });
      if (s.error) return bad(res, s.error);
      quiz.settings = s.settings;
    }
    if (req.body.audience) {
      const a = await cleanAudience(req.body);
      if (a.error) return bad(res, a.error);
      quiz.audience = a.audience;
    }
    await quiz.save();
    res.json({ status: 'success', data: { quiz: summary(quiz) } });
  } catch (err) { fail(res, err, 'updating the quiz'); }
};

// @route POST /api/theory-quiz/teacher/quizzes/:id/publish   body: { publish: true|false }
const publishQuiz = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    if (req.body.publish === false) {
      if (await TheoryAttempt.countDocuments({ quiz: quiz._id })) { quiz.status = 'closed'; } else { quiz.status = 'draft'; quiz.publishedAt = undefined; }
      await quiz.save();
      return res.json({ status: 'success', data: { quiz: summary(quiz) } });
    }
    if (!quiz.items.length) return bad(res, 'Add at least one question first');
    const wasPublished = quiz.status === 'published';
    quiz.status = 'published';
    quiz.publishedAt = quiz.publishedAt || new Date();
    await quiz.save();
    if (!wasPublished) {
      const roster = await svc.rosterOf(quiz);
      notify(roster.map(s => s._id), { type: 'hw_assigned', title: quiz.mode === 'paper' ? 'New paper quiz' : 'New quiz', body: quiz.title, url: '/student-dashboard/work/quizzes', dedupeKey: `tq:${quiz._id}` });
    }
    return res.json({ status: 'success', data: { quiz: summary(quiz) } });
  } catch (err) { return fail(res, err, 'publishing the quiz'); }
};

// @route DELETE /api/theory-quiz/teacher/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    await TheoryAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ status: 'success', message: 'Quiz deleted' });
  } catch (err) { fail(res, err, 'deleting the quiz'); }
};

// ---- attempts, review, paper marks -------------------------------------------------------------------------------

const personOf = (u) => (u ? { _id: u._id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim(), group: u.studentInfo?.group || null, studentId: u.studentInfo?.studentId || '' } : null);

// @route GET /api/theory-quiz/teacher/quizzes/:id/attempts
const listAttempts = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    await svc.sweepExpired(quiz);
    const [roster, attempts] = await Promise.all([svc.rosterOf(quiz), TheoryAttempt.find({ quiz: quiz._id }).populate('student', 'firstName lastName studentInfo.group studentInfo.studentId')]);
    const byStudent = new Map(attempts.map(a => [String(a.student?._id), a]));
    const rows = roster.map(s => {
      const a = byStudent.get(String(s._id));
      return {
        student: personOf(s),
        attemptId: a?._id || null,
        status: a ? a.status : 'not_started',
        mode: a?.mode,
        score: a ? a.score : null,
        max: a ? a.maxScore : quiz.totalMarks,
        submittedAt: a?.submittedAt || null,
        startedAt: a?.startedAt || null,
        autoSubmitted: !!a?.autoSubmitted,
        aiMarked: !!a?.aiMarked,
        risk: a?.integrity?.risk || null,
        flags: a?.integrity?.flags?.length || 0
      };
    });
    // Anyone who attempted but is no longer in the audience still shows
    attempts.filter(a => !roster.some(s => String(s._id) === String(a.student?._id))).forEach(a => rows.push({ student: personOf(a.student), attemptId: a._id, status: a.status, score: a.score, max: a.maxScore, submittedAt: a.submittedAt, risk: a.integrity?.risk || null, flags: a.integrity?.flags?.length || 0 }));
    res.json({ status: 'success', data: { attempts: rows } });
  } catch (err) { fail(res, err, 'loading the results'); }
};

// @route GET /api/theory-quiz/teacher/quizzes/:id/attempts/:aid
const getAttempt = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz || !isId(req.params.aid)) return;
    const attempt = await TheoryAttempt.findOne({ _id: req.params.aid, quiz: quiz._id }).populate('student', 'firstName lastName studentInfo.group studentInfo.studentId');
    if (!attempt) return bad(res, 'Unknown attempt', 404);
    res.json({ status: 'success', data: { quiz: { _id: quiz._id, title: quiz.title, items: quiz.items, totalMarks: quiz.totalMarks, settings: quiz.settings }, attempt: { ...attempt.toObject(), student: personOf(attempt.student) } } });
  } catch (err) { fail(res, err, 'loading the attempt'); }
};

// @route PUT /api/theory-quiz/teacher/quizzes/:id/attempts/:aid/review   { marks: { "<itemIndex>:<partIndex>": n }, confirm }
const reviewAttempt = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    const attempt = await TheoryAttempt.findOne({ _id: req.params.aid, quiz: quiz._id });
    if (!attempt) return bad(res, 'Unknown attempt', 404);
    if (attempt.status === 'in_progress') return bad(res, 'The student is still answering this quiz');
    Object.entries(req.body.marks || {}).forEach(([key, value]) => {
      const [gi, pi] = key.split(':').map(Number);
      const part = attempt.grades[gi]?.parts?.[pi];
      if (!part) return;
      part.awarded = clamp(roundHalf(Number(value) || 0), 0, part.max);
      part.source = 'teacher';
    });
    Object.entries(req.body.comments || {}).forEach(([key, value]) => {
      const [gi, pi] = key.split(':').map(Number);
      const part = attempt.grades[gi]?.parts?.[pi];
      if (part) part.feedback = String(value).slice(0, 400);
    });
    if (req.body.confirm) {
      attempt.grades.forEach(g => { g.final = true; });
      attempt.status = 'graded';
      attempt.reviewedAt = new Date();
      attempt.reviewedBy = req.user.id;
    }
    const t = totals(attempt.grades);
    attempt.score = t.score;
    attempt.maxScore = t.max;
    attempt.markModified('grades');
    await attempt.save();
    if (req.body.confirm) notify([attempt.student], { type: 'hw_graded', title: 'Your quiz was marked', body: `${quiz.title}: ${t.score}/${t.max}`, url: '/student-dashboard/work/quizzes', dedupeKey: `tqg:${attempt._id}` });
    res.json({ status: 'success', data: { score: t.score, max: t.max, status: attempt.status } });
  } catch (err) { fail(res, err, 'saving the review'); }
};

// @route POST /api/theory-quiz/teacher/quizzes/:id/attempts/:aid/ai  - ask the AI for fresh suggestions
const remarkWithAi = async (req, res) => {
  try {
    if (!ai.enabled()) return bad(res, 'AI marking is not set up on this server (add ANTHROPIC_API_KEY)', 400);
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    const attempt = await TheoryAttempt.findOne({ _id: req.params.aid, quiz: quiz._id });
    if (!attempt || attempt.status === 'in_progress') return bad(res, 'Unknown attempt', 404);
    const n = await ai.applySuggestions(quiz.items, attempt.grades);
    const t = totals(attempt.grades);
    attempt.score = t.score;
    attempt.aiMarked = attempt.aiMarked || n > 0;
    attempt.markModified('grades');
    await attempt.save();
    res.json({ status: 'success', data: { suggested: n, score: t.score } });
  } catch (err) { fail(res, err, 'asking the AI to mark'); }
};

// @route POST /api/theory-quiz/teacher/quizzes/:id/confirm-all  - accept every suggested mark on submitted attempts
const confirmAll = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    const attempts = await TheoryAttempt.find({ quiz: quiz._id, status: 'submitted' });
    for (const attempt of attempts) {
      attempt.grades.forEach(g => { g.final = true; });
      attempt.status = 'graded';
      attempt.reviewedAt = new Date();
      attempt.reviewedBy = req.user.id;
      attempt.markModified('grades');
      await attempt.save();
    }
    notify(attempts.map(a => a.student), { type: 'hw_graded', title: 'Your quiz was marked', body: quiz.title, url: '/student-dashboard/work/quizzes', dedupeKey: `tqg:${quiz._id}:${Date.now()}` });
    res.json({ status: 'success', data: { confirmed: attempts.length } });
  } catch (err) { fail(res, err, 'confirming the marks'); }
};

// @route PUT /api/theory-quiz/teacher/quizzes/:id/paper   { studentId, marks: { "<uid>": n } }
const savePaperMarks = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    if (!isId(req.body.studentId)) return bad(res, 'Choose a student');
    const student = await User.findOne({ _id: req.body.studentId, role: 'student' }).select('_id');
    if (!student) return bad(res, 'Unknown student', 404);
    const marks = req.body.marks || {};
    const grades = quiz.items.map(it => {
      const raw = marks[it.uid];
      const awarded = raw === '' || raw === undefined || raw === null ? 0 : clamp(roundHalf(Number(raw) || 0), 0, it.marks);
      return { uid: it.uid, max: it.marks, awarded, final: true, kind: 'paper', entered: raw !== '' && raw !== undefined && raw !== null };
    });
    const t = totals(grades);
    const attempt = await TheoryAttempt.findOneAndUpdate(
      { quiz: quiz._id, student: student._id },
      { $set: { mode: 'paper', status: 'graded', grades, score: t.score, maxScore: t.max, submittedAt: new Date(), reviewedAt: new Date(), reviewedBy: req.user.id }, $setOnInsert: { seed: uid(), startedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    notify([student._id], { type: 'hw_graded', title: 'Your quiz was marked', body: `${quiz.title}: ${t.score}/${t.max}`, url: '/student-dashboard/work/quizzes', dedupeKey: `tqg:${attempt._id}:${t.score}` });
    res.json({ status: 'success', data: { score: t.score, max: t.max } });
  } catch (err) { fail(res, err, 'saving the paper marks'); }
};

// @route GET /api/theory-quiz/teacher/quizzes/:id/report
const quizReport = async (req, res) => {
  try {
    const quiz = await findOwn(req, res);
    if (!quiz) return;
    await svc.sweepExpired(quiz);
    const attempts = await TheoryAttempt.find({ quiz: quiz._id, status: { $in: ['submitted', 'graded'] } }).populate('student', 'firstName lastName studentInfo.group');
    const perItem = quiz.items.map((it, i) => {
      const got = attempts.map(a => a.grades[i]).filter(Boolean);
      const avg = got.length ? got.reduce((n, g) => n + itemScore(g) / (g.max || 1), 0) / got.length : null;
      return { uid: it.uid, lead: it.lead || it.parts?.[0]?.text || '', category: it.category, topic: it.topic, difficulty: it.difficulty, marks: it.marks, answered: got.length, facility: avg === null ? null : Math.round(avg * 100) };
    });
    const topics = {};
    attempts.forEach(a => svc.perTopic(quiz.items, a.grades).forEach(t => { const x = (topics[t.topic] ||= { topic: t.topic, got: 0, max: 0 }); x.got += t.got; x.max += t.max; }));
    const scores = attempts.map(a => (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0));
    const buckets = Array.from({ length: 5 }, (_, i) => ({ label: `${i * 20}–${i === 4 ? 100 : i * 20 + 19}%`, count: scores.filter(s => (i === 4 ? s >= 80 : s >= i * 20 && s < i * 20 + 20)).length }));

    // Similar answers between two students (online attempts only)
    const online = attempts.filter(a => a.mode === 'online').map(a => ({
      id: String(a._id), name: personOf(a.student)?.name || 'Student', answers: a.answers || {},
      wrongObjective: a.grades.flatMap((g, i) => (g.rows || []).filter(r => !r.correct && r.given).map(r => ({ uid: quiz.items[i].uid + ':' + r.label, given: r.given })))
    }));
    const pairs = [];
    for (let i = 0; i < online.length; i++) {
      for (let j = i + 1; j < online.length; j++) {
        const s = cheat.similarity(online[i], online[j]);
        if (s.score >= 4) pairs.push({ a: online[i].name, b: online[j].name, score: s.score, reasons: s.reasons, attemptA: online[i].id, attemptB: online[j].id });
      }
    }
    pairs.sort((x, y) => y.score - x.score);
    res.json({
      status: 'success',
      data: {
        submitted: attempts.length,
        average: scores.length ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length) : null,
        highest: scores.length ? Math.max(...scores) : null,
        lowest: scores.length ? Math.min(...scores) : null,
        passRate: scores.length ? Math.round((scores.filter(s => s >= quiz.settings.passMark).length / scores.length) * 100) : null,
        distribution: buckets,
        items: perItem,
        topics: Object.values(topics).map(t => ({ ...t, percent: t.max ? Math.round((t.got / t.max) * 100) : 0 })).sort((a, b) => a.percent - b.percent),
        similar: pairs.slice(0, 10)
      }
    });
  } catch (err) { fail(res, err, 'building the report'); }
};

module.exports = {
  getMeta, listBank, createQuestion, updateQuestion, deleteQuestion,
  scopeAvailability, generateItems, swapItem, itemFromBank,
  createQuiz, listQuizzes, getQuiz, updateQuiz, publishQuiz, deleteQuiz,
  listAttempts, getAttempt, reviewAttempt, remarkWithAi, confirmAll, savePaperMarks, quizReport,
  _internal: { poolFor, buildItems, cleanSettings, gradeAttempt, plain }
};
