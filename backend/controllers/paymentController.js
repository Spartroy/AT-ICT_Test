const Payment = require('../models/Payment');
const User = require('../models/User');
const crypto = require('crypto');

// ── Teacher: create a payment plan for a student ──────────────────────────────
const createPayment = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const { planType, amount, currency, description, sessions, dueDate, notes } = req.body;

    const payment = await Payment.create({
      student: student._id,
      createdBy: req.user.id,
      planType,
      amount,
      currency: currency || 'EGP',
      description,
      sessions: sessions || null,
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

    const allowedFields = ['planType', 'amount', 'currency', 'description', 'sessions', 'status', 'dueDate', 'notes', 'paymentMethod'];
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
    // Find the child linked to this parent
    const parent = await User.findById(req.user.id).select('parentInfo').lean();
    const childId = parent?.parentInfo?.studentId;

    if (!childId) {
      return res.status(404).json({ status: 'error', message: 'No linked student found' });
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

// ── Parent: mark a payment as paid (choose method) ───────────────────────────
const payPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!['card', 'instapay'].includes(paymentMethod)) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment method' });
    }

    // Verify the payment belongs to this parent's child
    const parent = await User.findById(req.user.id).select('parentInfo').lean();
    const childId = parent?.parentInfo?.studentId?.toString();

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }
    if (payment.student.toString() !== childId) {
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

module.exports = {
  createPayment,
  getStudentPayments,
  updatePayment,
  deletePayment,
  resetStudentPassword,
  getParentPayments,
  payPayment,
};
