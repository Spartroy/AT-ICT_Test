const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const LedgerEntry = require('../models/LedgerEntry');
const User = require('../models/User');
const { buildSummary, buildCsv, parsePeriod } = require('../utils/incomeStats');
const { cleanEntry } = require('../validators/ledger');

const fail = (res, status, message, extra = {}) => res.status(status).json({ status: 'error', message, ...extra });
const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

const studentName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Student');

const loadMoney = async () => {
  const [payments, entries, people] = await Promise.all([
    Payment.find({ status: { $ne: 'cancelled' } }).populate('student', 'firstName lastName').lean(),
    LedgerEntry.find({}).populate('student', 'firstName lastName').lean(),
    User.find({ role: 'student', registrationStatus: 'approved', isActive: true }).select('firstName lastName').lean()
  ]);
  return { payments, entries, students: people.map(s => ({ _id: s._id, name: studentName(s) })) };
};

/** GET /api/teacher/income/summary?period=2026-10|2026|all */
exports.summary = async (req, res) => {
  try {
    const { payments, entries, students } = await loadMoney();
    const summary = buildSummary({ payments, entries, students, period: req.query.period });
    const labels = (kind) => [...new Set(entries.filter(e => e.kind === kind).map(e => e.label))].sort((a, b) => a.localeCompare(b));
    return ok(res, { ...summary, suggestions: { income: labels('income'), expense: labels('expense') }, proofsWaiting: payments.filter(p => p.status === 'review').length });
  } catch (err) {
    console.error('Income summary error:', err);
    return fail(res, 500, 'Could not load the income dashboard');
  }
};

const shapeProof = (p) => ({
  id: p._id,
  student: { id: p.student?._id || p.student, name: studentName(p.student) },
  description: p.description || '',
  planType: p.planType,
  amount: p.amount,
  currency: p.currency || 'EGP',
  dueDate: p.dueDate || null,
  uploadedAt: p.paymentProof?.uploadedAt || p.updatedAt,
  proofPath: p.paymentProof?.path || null,
  earlierRejection: p.lastRejection?.reason || null
});

/** GET /api/teacher/income/proofs — transfer screenshots waiting for the teacher, oldest first. */
exports.proofs = async (req, res) => {
  try {
    const waiting = await Payment.find({ status: 'review' }).populate('student', 'firstName lastName').sort({ 'paymentProof.uploadedAt': 1 }).lean();
    return ok(res, { proofs: waiting.map(shapeProof) });
  } catch (err) {
    console.error('Income proofs error:', err);
    return fail(res, 500, 'Could not load the payment proofs');
  }
};

const shapeEntry = (e) => ({
  id: e._id,
  kind: e.kind,
  label: e.label,
  amount: e.amount,
  currency: e.currency || 'EGP',
  date: e.date,
  note: e.note || '',
  student: e.student ? { id: e.student._id || e.student, name: studentName(e.student) } : null
});

/** GET /api/teacher/income/entries?kind=income|expense&period=… */
exports.listEntries = async (req, res) => {
  try {
    const query = {};
    if (['income', 'expense'].includes(req.query.kind)) query.kind = req.query.kind;
    if (req.query.period) {
      const p = parsePeriod(req.query.period);
      query.date = { $gte: p.start, $lt: p.end };
    }
    const entries = await LedgerEntry.find(query).populate('student', 'firstName lastName').sort({ date: -1, createdAt: -1 }).limit(500).lean();
    const all = await LedgerEntry.find({}).select('kind label').lean();
    const labels = (kind) => [...new Set(all.filter(e => e.kind === kind).map(e => e.label))].sort((a, b) => a.localeCompare(b));
    return ok(res, { entries: entries.map(shapeEntry), suggestions: { income: labels('income'), expense: labels('expense') } });
  } catch (err) {
    console.error('List entries error:', err);
    return fail(res, 500, 'Could not load the entries');
  }
};

const checkStudent = async (value) => {
  if (!value.student) return null;
  if (!mongoose.isValidObjectId(value.student) || !(await User.exists({ _id: value.student, role: 'student' }))) return 'That student was not found';
  return null;
};

/** POST /api/teacher/income/entries */
exports.createEntry = async (req, res) => {
  try {
    const { value, errors } = cleanEntry(req.body);
    if (errors) return fail(res, 400, errors[0].msg, { errors });
    const bad = await checkStudent(value);
    if (bad) return fail(res, 400, bad);
    const entry = await LedgerEntry.create({ ...value, createdBy: req.user.id });
    await entry.populate('student', 'firstName lastName');
    return ok(res, { entry: shapeEntry(entry) }, 201);
  } catch (err) {
    console.error('Create entry error:', err);
    return fail(res, 500, 'Could not save the entry');
  }
};

/** PUT /api/teacher/income/entries/:id */
exports.updateEntry = async (req, res) => {
  try {
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry) return fail(res, 404, 'Entry not found');
    const { value, errors } = cleanEntry({ kind: entry.kind, ...req.body });
    if (errors) return fail(res, 400, errors[0].msg, { errors });
    const bad = await checkStudent(value);
    if (bad) return fail(res, 400, bad);
    entry.set({ ...value, kind: entry.kind });
    if (!value.student) entry.student = undefined;
    await entry.save();
    await entry.populate('student', 'firstName lastName');
    return ok(res, { entry: shapeEntry(entry) });
  } catch (err) {
    console.error('Update entry error:', err);
    return fail(res, 500, 'Could not save the entry');
  }
};

/** DELETE /api/teacher/income/entries/:id */
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await LedgerEntry.findByIdAndDelete(req.params.id);
    if (!entry) return fail(res, 404, 'Entry not found');
    return ok(res, {});
  } catch (err) {
    console.error('Delete entry error:', err);
    return fail(res, 500, 'Could not delete the entry');
  }
};

/** GET /api/teacher/income/export?period=… — CSV for the teacher's records or accountant. */
exports.exportCsv = async (req, res) => {
  try {
    const { payments, entries } = await loadMoney();
    const period = parsePeriod(req.query.period);
    const csv = buildCsv({ payments, entries, period });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="income-${period.key}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('Income export error:', err);
    return fail(res, 500, 'Could not export');
  }
};
