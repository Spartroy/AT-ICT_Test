/**
 * @fileoverview Weekly report logic (pure functions, no database)
 * @description Week maths, turning a student's assignments and quizzes into the report's lesson rows, and the
 * totals. The controller loads the data; everything that decides what the report says lives here so it can be tested.
 */

const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_LESSONS = 3;
const MAX_LESSONS = 6;
const DEFAULT_ATTITUDE = ['Punctuality', 'Respect', 'Focus', 'Teamwork'];

/** Monday 00:00 UTC of the week containing `input` (a Date, ISO string or yyyy-mm-dd). null when it is not a date. */
const weekStartOf = (input) => {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay(); // 0 = Sunday
  const back = (day + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
};

const weekEnd = (start) => new Date(start.getTime() + 7 * DAY);

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** What a student's entry on an assignment/quiz means for the report. `due` is when it was due / took place. */
const rowFor = (item, entry, due, now = new Date()) => {
  const e = entry || {};
  const handed = ['submitted', 'graded'].includes(e.status);
  let state = 'none';
  if (handed) state = e.isLate ? 'late' : 'done';
  else if (due && new Date(due) < now) state = 'missed';
  return {
    title: item.title,
    refId: item._id,
    state,
    mark: e.status === 'graded' ? num(e.score) : null,
    max: num(item.maxScore)
  };
};

const empty = () => ({ title: '', refId: null, state: 'none', mark: null, max: null });

/**
 * Lesson rows for one week. Homework and quizzes of the week are laid out in date order, one pair per lesson
 * (the paper form has three lessons; more work than that adds lessons, up to six).
 * assignments: [{ _id, title, dueDate, maxScore, assignedTo: [{ student, status, score, isLate }] }]
 */
const buildLessons = (studentId, assignments = [], quizzes = [], now = new Date()) => {
  const mine = (list) => list.map(item => ({
    item,
    entry: (item.assignedTo || []).find(a => String(a.student && a.student._id ? a.student._id : a.student) === String(studentId))
  })).filter(x => x.entry);
  const hw = mine(assignments).sort((a, b) => new Date(a.item.dueDate) - new Date(b.item.dueDate));
  const qz = mine(quizzes).sort((a, b) => new Date(a.item.startDate) - new Date(b.item.startDate));
  const count = Math.min(MAX_LESSONS, Math.max(DEFAULT_LESSONS, hw.length, qz.length));
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    hw: hw[i] ? rowFor(hw[i].item, hw[i].entry, hw[i].item.dueDate, now) : empty(),
    quiz: qz[i] ? rowFor(qz[i].item, qz[i].entry, qz[i].item.startDate, now) : empty(),
    contribution: 0
  }));
};

/** Marks count when entered; a missed item with a maximum counts as 0 out of its maximum. */
const countsFor = (row) => {
  if (!row) return { gained: 0, possible: 0 };
  const max = num(row.max);
  if (num(row.mark) !== null) return { gained: row.mark, possible: max || 0 };
  if (row.state === 'missed' && max) return { gained: 0, possible: max };
  return { gained: 0, possible: 0 };
};

/** Totals for the week: points gained, points possible and the percentage (null when nothing was marked). */
const totals = (lessons = []) => {
  let gained = 0;
  let possible = 0;
  lessons.forEach(l => {
    [countsFor(l.hw), countsFor(l.quiz)].forEach(c => { gained += c.gained; possible += c.possible; });
  });
  return { gained, possible, percent: possible ? Math.round((gained / possible) * 100) : null };
};

const STATES = ['none', 'done', 'late', 'missed'];
const clampNum = (v, min, max) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};
const text = (v, len) => String(v == null ? '' : v).trim().slice(0, len);

const cleanRow = (r = {}) => ({
  title: text(r.title, 200),
  refId: /^[a-f\d]{24}$/i.test(String(r.refId || '')) ? r.refId : null,
  state: STATES.includes(r.state) ? r.state : 'none',
  mark: clampNum(r.mark, 0, 10000),
  max: clampNum(r.max, 0, 10000)
});

/** Coerces untrusted editor input into the report's fields. */
const cleanReport = (body = {}) => {
  const lessons = (Array.isArray(body.lessons) ? body.lessons : []).slice(0, MAX_LESSONS).map((l, i) => ({
    number: i + 1,
    hw: cleanRow(l && l.hw),
    quiz: cleanRow(l && l.quiz),
    contribution: Math.round(clampNum(l && l.contribution, 0, 5) || 0)
  }));
  const attitude = (Array.isArray(body.attitude) ? body.attitude : []).slice(0, 8)
    .map(a => ({ label: text(a && a.label, 60), rating: Math.round(clampNum(a && a.rating, 0, 5) || 0) }))
    .filter(a => a.label);
  return {
    weekNumber: Math.round(clampNum(body.weekNumber, 1, 60) || 1),
    session: text(body.session, 40),
    lessons,
    attitude,
    comments: text(body.comments, 1500)
  };
};

/** The student's rating average across contribution and attitude (0 = nothing rated). */
const ratingAverage = (report) => {
  const vals = [...(report.lessons || []).map(l => l.contribution), ...(report.attitude || []).map(a => a.rating)].filter(v => v > 0);
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
};

module.exports = { DEFAULT_ATTITUDE, DEFAULT_LESSONS, MAX_LESSONS, weekStartOf, weekEnd, buildLessons, totals, cleanReport, ratingAverage, rowFor };
