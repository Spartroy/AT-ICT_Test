/**
 * @fileoverview Weekly performance reports
 * @description The digital version of the paper "Weekly Performance Report". Teachers and assistants fill one report
 * per student per week; homework and quiz marks are pulled from the site, the rest (communication, comments)
 * is typed in. Published reports show up for the student and their parents.
 */

const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const WeeklyReport = require('../models/WeeklyReport');
const { notify } = require('../services/notifications');
const {
  DEFAULT_ATTITUDE, weekStartOf, weekEnd, buildLessons, totals, cleanReport, ratingAverage
} = require('../services/weeklyReport');

const isId = (v) => /^[a-f\d]{24}$/i.test(String(v || ''));
const fullName = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const studentCard = (u) => ({
  _id: u._id,
  name: fullName(u),
  studentId: u.studentInfo && u.studentInfo.studentId,
  group: (u.studentInfo && u.studentInfo.group) || null,
  session: (u.studentInfo && u.studentInfo.session) || '',
  year: (u.studentInfo && u.studentInfo.year) || ''
});

const summary = (r) => r && ({
  _id: r._id, status: r.status, gained: r.gained, possible: r.possible,
  percent: r.possible ? Math.round((r.gained / r.possible) * 100) : null, weekNumber: r.weekNumber, publishedAt: r.publishedAt
});

/** Reads ?weekStart=yyyy-mm-dd (any day of the week) and returns that week's Monday, or sends a 400. */
const weekFrom = (value, res) => {
  const start = weekStartOf(value);
  if (!start) {
    res.status(400).json({ status: 'error', message: 'Choose a valid week' });
    return null;
  }
  return start;
};

/** The assignments and quizzes of a week for the given students (one query each, not one per student). */
const loadWork = async (studentIds, start) => {
  const end = weekEnd(start);
  const [assignments, quizzes] = await Promise.all([
    Assignment.find({ 'assignedTo.student': { $in: studentIds }, dueDate: { $gte: start, $lt: end }, isActive: { $ne: false } })
      .select('title dueDate maxScore assignedTo.student assignedTo.status assignedTo.score assignedTo.isLate').lean(),
    Quiz.find({ 'assignedTo.student': { $in: studentIds }, startDate: { $gte: start, $lt: end }, isActive: { $ne: false } })
      .select('title startDate maxScore assignedTo.student assignedTo.status assignedTo.score assignedTo.isLate').lean()
  ]);
  return { assignments, quizzes };
};

/** Week number to suggest: the one other reports of this week use, else one more than the latest earlier week. */
const suggestWeekNumber = async (start) => {
  const same = await WeeklyReport.findOne({ weekStart: start }).select('weekNumber').lean();
  if (same) return same.weekNumber;
  const last = await WeeklyReport.findOne({ weekStart: { $lt: start } }).sort({ weekStart: -1 }).select('weekNumber').lean();
  return last ? last.weekNumber + 1 : 1;
};

const blankReport = (student, start, weekNumber, lessons) => ({
  student: student._id,
  weekStart: start,
  weekNumber,
  session: (student.studentInfo && student.studentInfo.session) || '',
  lessons,
  attitude: DEFAULT_ATTITUDE.map(label => ({ label, rating: 0 })),
  comments: ''
});

const withTotals = (fields) => {
  const t = totals(fields.lessons);
  return { ...fields, gained: t.gained, possible: t.possible };
};

// @route GET /api/teacher/reports?weekStart=&group=&search=
// The roster for a week: every active student with the state of their report.
const roster = async (req, res, next) => {
  try {
    const start = weekFrom(req.query.weekStart, res);
    if (!start) return undefined;
    const query = { role: 'student', isActive: true };
    if (req.query.group === 'none') query['studentInfo.group'] = { $in: [null, ''] };
    else if (req.query.group) query['studentInfo.group'] = String(req.query.group).toUpperCase().slice(0, 6);
    if (req.query.search) {
      const rx = { $regex: escapeRegex(String(req.query.search).slice(0, 100)), $options: 'i' };
      query.$or = [{ firstName: rx }, { lastName: rx }, { 'studentInfo.studentId': rx }];
    }
    const students = await User.find(query).select('firstName lastName studentInfo').sort({ firstName: 1, lastName: 1 }).limit(1000).lean();
    const reports = await WeeklyReport.find({ weekStart: start, student: { $in: students.map(s => s._id) } })
      .select('student status gained possible weekNumber publishedAt').lean();
    const byStudent = new Map(reports.map(r => [String(r.student), r]));
    const weekNumber = await suggestWeekNumber(start);
    res.json({
      status: 'success',
      data: {
        weekStart: start,
        weekEnd: new Date(weekEnd(start).getTime() - 1),
        weekNumber,
        students: students.map(s => ({ ...studentCard(s), report: summary(byStudent.get(String(s._id))) || null }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/teacher/reports/:studentId?weekStart=
// The saved report (if any) plus what the site knows about that week, so the form can show "from the website" values.
const detail = async (req, res, next) => {
  try {
    const start = weekFrom(req.query.weekStart, res);
    if (!start) return undefined;
    if (!isId(req.params.studentId)) return res.status(400).json({ status: 'error', message: 'Invalid student' });
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' }).select('firstName lastName studentInfo').lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });
    const [saved, work, weekNumber] = await Promise.all([
      WeeklyReport.findOne({ student: student._id, weekStart: start }).lean(),
      loadWork([student._id], start),
      suggestWeekNumber(start)
    ]);
    const lessons = buildLessons(student._id, work.assignments, work.quizzes);
    res.json({
      status: 'success',
      data: {
        student: studentCard(student),
        weekStart: start,
        report: saved || null,
        fromSite: withTotals(blankReport(student, start, weekNumber, lessons))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/teacher/reports/:studentId  { weekStart, weekNumber, session, lessons, attitude, comments, publish? }
const save = async (req, res, next) => {
  try {
    const start = weekFrom(req.body.weekStart, res);
    if (!start) return undefined;
    if (!isId(req.params.studentId)) return res.status(400).json({ status: 'error', message: 'Invalid student' });
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' }).select('_id').lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

    const fields = withTotals(cleanReport(req.body));
    const existing = await WeeklyReport.findOne({ student: student._id, weekStart: start });
    const wasPublished = existing && existing.status === 'published';
    const publish = req.body.publish === true || (req.body.publish === undefined && wasPublished);
    const update = {
      ...fields,
      updatedBy: req.user._id,
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? (wasPublished ? existing.publishedAt : new Date()) : null
    };
    const doc = await WeeklyReport.findOneAndUpdate(
      { student: student._id, weekStart: start },
      { $set: update, $setOnInsert: { createdBy: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );
    if (publish && !wasPublished) await tellFamily([doc]);
    res.json({ status: 'success', data: { report: doc } });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/teacher/reports/autofill  { weekStart, group?, studentIds? }
// Creates a draft for every student who has none yet, pre-filled from their homework and quizzes.
const autofill = async (req, res, next) => {
  try {
    const start = weekFrom(req.body.weekStart, res);
    if (!start) return undefined;
    const query = { role: 'student', isActive: true };
    if (Array.isArray(req.body.studentIds) && req.body.studentIds.length) query._id = { $in: req.body.studentIds.filter(isId).slice(0, 1000) };
    else if (req.body.group === 'none') query['studentInfo.group'] = { $in: [null, ''] };
    else if (req.body.group) query['studentInfo.group'] = String(req.body.group).toUpperCase().slice(0, 6);

    const students = await User.find(query).select('firstName lastName studentInfo').limit(1000).lean();
    const have = new Set((await WeeklyReport.find({ weekStart: start, student: { $in: students.map(s => s._id) } }).select('student').lean()).map(r => String(r.student)));
    const todo = students.filter(s => !have.has(String(s._id)));
    if (!todo.length) return res.json({ status: 'success', data: { created: 0, skipped: students.length } });

    const [work, weekNumber] = await Promise.all([loadWork(todo.map(s => s._id), start), suggestWeekNumber(start)]);
    const docs = todo.map(s => withTotals({
      ...blankReport(s, start, weekNumber, buildLessons(s._id, work.assignments, work.quizzes)),
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id
    }));
    // A report created in the meantime by someone else is kept: unordered insert skips the duplicate and carries on
    const result = await WeeklyReport.insertMany(docs, { ordered: false }).catch(err => (err.insertedDocs ? err.insertedDocs : Promise.reject(err)));
    const created = Array.isArray(result) ? result.length : 0;
    res.json({ status: 'success', data: { created, skipped: students.length - created } });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/teacher/reports/publish  { weekStart, studentIds?, publish? }
// Publishes (or takes back) the drafts of a week in one go.
const publish = async (req, res, next) => {
  try {
    const start = weekFrom(req.body.weekStart, res);
    if (!start) return undefined;
    const on = req.body.publish !== false;
    const filter = { weekStart: start, status: on ? 'draft' : 'published' };
    if (Array.isArray(req.body.studentIds) && req.body.studentIds.length) filter.student = { $in: req.body.studentIds.filter(isId).slice(0, 1000) };
    const reports = await WeeklyReport.find(filter);
    if (!reports.length) return res.json({ status: 'success', data: { changed: 0 } });
    await WeeklyReport.updateMany({ _id: { $in: reports.map(r => r._id) } }, on
      ? { $set: { status: 'published', publishedAt: new Date(), updatedBy: req.user._id } }
      : { $set: { status: 'draft', publishedAt: null, updatedBy: req.user._id } });
    if (on) await tellFamily(reports);
    res.json({ status: 'success', data: { changed: reports.length } });
  } catch (err) {
    next(err);
  }
};

/** Pushes "your weekly report is ready" to the student and their linked parents. Never throws. */
async function tellFamily(reports) {
  try {
    const ids = reports.map(r => r.student);
    const parents = await User.find({ role: 'parent', isActive: { $ne: false }, 'parentInfo.children.studentId': { $in: ids } }).select('parentInfo.children.studentId').lean();
    for (const r of reports) {
      const parentIds = parents.filter(p => (p.parentInfo.children || []).some(c => String(c.studentId) === String(r.student))).map(p => p._id);
      const dedupeKey = `report:${r._id}:${r.publishedAt ? new Date(r.publishedAt).getTime() : Date.now()}`;
      await notify([r.student], { type: 'weekly_report', title: `Your Week ${r.weekNumber} report is ready`, body: 'See how your week went.', url: '/student-dashboard/work/reports', dedupeKey });
      if (parentIds.length) await notify(parentIds, { type: 'weekly_report', title: `Week ${r.weekNumber} report is ready`, body: 'Your child\'s weekly performance report is published.', url: '/parent-dashboard/reports', dedupeKey: `${dedupeKey}:p` });
    }
  } catch (err) {
    console.error('Weekly report notification error:', err.message);
  }
}

/** Published reports of a student, newest week first, in the shape the report card shows. */
const publishedFor = async (studentId) => {
  const rows = await WeeklyReport.find({ student: studentId, status: 'published' }).sort({ weekStart: -1 }).limit(60).lean();
  return rows.map(r => ({ ...r, percent: r.possible ? Math.round((r.gained / r.possible) * 100) : null, rating: ratingAverage(r) }));
};

// @route GET /api/student/reports
const mine = async (req, res, next) => {
  try {
    res.json({ status: 'success', data: { reports: await publishedFor(req.user._id) } });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/parent/child/:childId/weekly-reports
const forChild = async (req, res, next) => {
  try {
    const parent = await User.findById(req.user.id).select('role parentInfo');
    const allowed = parent && parent.parentInfo && (parent.parentInfo.children || []).some(c => String(c.studentId) === String(req.params.childId));
    if (!allowed) return res.status(403).json({ status: 'error', message: 'Unauthorized access to child data' });
    const child = await User.findById(req.params.childId).select('firstName lastName').lean();
    res.json({ status: 'success', data: { student: child && { name: fullName(child) }, reports: await publishedFor(req.params.childId) } });
  } catch (err) {
    next(err);
  }
};

module.exports = { roster, detail, save, autofill, publish, mine, forChild };
