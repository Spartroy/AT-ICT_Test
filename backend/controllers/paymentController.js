const fs = require('fs');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Parent = require('../models/Parent');
const crypto = require('crypto');

/**
 * Resolve the linked student's User _id for a parent account.
 * Matches logic in parentController.getDashboardData (Parent model + User.parentInfo.children).
 */
async function getLinkedStudentUserId(parentUserId) {
  const parentDoc = await Parent.findOne({ user: parentUserId }).populate({
    path: 'children.student',
    select: 'user',
  });
  if (parentDoc?.children?.length) {
    const primary = parentDoc.children.find((c) => c.isPrimary) || parentDoc.children[0];
    const st = primary?.student;
    const uid = st?.user?._id || st?.user;
    if (uid) return uid;
  }

  const parentUser = await User.findById(parentUserId).select('parentInfo').lean();
  const childLink =
    parentUser?.parentInfo?.children?.find((c) => c.isPrimary) || parentUser?.parentInfo?.children?.[0];
  if (childLink?.studentId) return childLink.studentId;

  return null;
}

// ── Teacher: create a payment plan for a student ──────────────────────────────
const createPayment = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const { planType, currency, description, dueDate, notes } = req.body;
    const sessionsRaw = req.body.sessions;
    const perSessionRaw = req.body.perSessionRate;
    const sessions =
      sessionsRaw !== '' && sessionsRaw != null && !Number.isNaN(Number(sessionsRaw))
        ? Number(sessionsRaw)
        : null;
    const perSessionRate =
      perSessionRaw !== '' && perSessionRaw != null && !Number.isNaN(Number(perSessionRaw))
        ? Number(perSessionRaw)
        : null;

    let amount = Number(req.body.amount);
    let sessionsToStore = sessions;
    let rateToStore = perSessionRate;

    if (planType === 'per_session' || planType === 'package') {
      if (
        perSessionRate == null ||
        Number.isNaN(perSessionRate) ||
        perSessionRate < 0 ||
        sessions == null ||
        Number.isNaN(sessions) ||
        sessions < 1
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Per-session and package plans require a valid rate per session and number of sessions.',
        });
      }
      amount = Math.round(perSessionRate * sessions * 100) / 100;
      if (!amount || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Calculated total must be greater than zero.',
        });
      }
    } else {
      if (Number.isNaN(amount) || amount < 0) {
        return res.status(400).json({ status: 'error', message: 'Valid total amount (EGP) is required.' });
      }
      sessionsToStore = null;
      rateToStore = null;
    }

    const payment = await Payment.create({
      student: student._id,
      createdBy: req.user.id,
      planType,
      amount,
      currency: currency || 'EGP',
      description,
      sessions: sessionsToStore,
      perSessionRate: rateToStore,
      dueDate: dueDate || null,
      notes,
    });

    res.status(201).json({ status: 'success', data: { payment } });
  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create payment plan' });
  }
};

// ── Teacher: list all payments for a student ──────────────────────────────────
const getStudentPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.params.studentId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ status: 'success', data: { payments } });
  } catch (error) {
    console.error('getStudentPayments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payments' });
  }
};

// ── Teacher: update a payment (amount, status, notes, etc.) ──────────────────
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }

    const allowedFields = [
      'planType',
      'amount',
      'currency',
      'description',
      'sessions',
      'perSessionRate',
      'status',
      'dueDate',
      'notes',
      'paymentMethod',
    ];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) payment[field] = req.body[field];
    });

    if (req.body.status === 'paid' && !payment.paidDate) {
      payment.paidDate = new Date();
    }

    await payment.save();
    res.json({ status: 'success', data: { payment } });
  } catch (error) {
    console.error('updatePayment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update payment' });
  }
};

// ── Teacher: cancel / delete a payment ───────────────────────────────────────
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }
    res.json({ status: 'success', message: 'Payment deleted' });
  } catch (error) {
    console.error('deletePayment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete payment' });
  }
};

// ── Teacher: force-reset a student's password ────────────────────────────────
const resetStudentPassword = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8-char hex
    student.password = tempPassword;
    await student.save();

    res.json({
      status: 'success',
      message: 'Password reset successfully',
      data: { tempPassword },
    });
  } catch (error) {
    console.error('resetStudentPassword error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
};

// ── Parent: get all payments for their child ─────────────────────────────────
const getParentPayments = async (req, res) => {
  try {
    const childId = await getLinkedStudentUserId(req.user.id);

    if (!childId) {
      return res.status(200).json({
        status: 'success',
        data: { payments: [] },
        message: 'No linked student on this parent account',
      });
    }

    const payments = await Payment.find({ student: childId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ status: 'success', data: { payments } });
  } catch (error) {
    console.error('getParentPayments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payments' });
  }
};

// ── Parent: mark a payment as paid (JSON — card placeholder only; InstaPay uses screenshot route) ──
const payPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!['card', 'instapay'].includes(paymentMethod)) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment method' });
    }
    if (paymentMethod === 'instapay') {
      return res.status(400).json({
        status: 'error',
        message: 'InstaPay requires uploading a screenshot. Use the submit button with proof attached.',
      });
    }

    const childUserId = await getLinkedStudentUserId(req.user.id);
    const childId = childUserId?.toString();

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }
    if (!childId || payment.student.toString() !== childId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.paymentMethod = paymentMethod;
    await payment.save();

    res.json({ status: 'success', data: { payment } });
  } catch (error) {
    console.error('payPayment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process payment' });
  }
};

// ── Parent: InstaPay — mark paid with screenshot proof ────────────────────────
const submitInstapayWithProof = async (req, res) => {
  const cleanupFile = () => {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  };

  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please attach an InstaPay screenshot (image).',
      });
    }
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      cleanupFile();
      return res.status(400).json({
        status: 'error',
        message: 'Proof must be an image file (PNG, JPG, WEBP, etc.).',
      });
    }

    const childUserId = await getLinkedStudentUserId(req.user.id);
    const childId = childUserId?.toString();

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      cleanupFile();
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }
    if (!childId || payment.student.toString() !== childId) {
      cleanupFile();
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    if (payment.status === 'paid') {
      cleanupFile();
      return res.status(400).json({ status: 'error', message: 'This payment is already marked paid.' });
    }

    const publicPath = `/uploads/payments/${req.file.filename}`;

    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.paymentMethod = 'instapay';
    payment.paymentProof = {
      path: publicPath,
      originalName: req.file.originalname,
      uploadedAt: new Date(),
    };
    await payment.save();

    res.json({ status: 'success', data: { payment } });
  } catch (error) {
    console.error('submitInstapayWithProof error:', error);
    cleanupFile();
    res.status(500).json({ status: 'error', message: 'Failed to submit payment' });
  }
};

module.exports = {
  createPayment,
  getStudentPayments,
  updatePayment,
  deletePayment,
  resetStudentPassword,
  getParentPayments,
  payPayment,
  submitInstapayWithProof,
};
