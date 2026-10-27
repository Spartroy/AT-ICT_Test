const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['monthly', 'weekly', 'per_session', 'package'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EGP',
    },
    description: {
      type: String,
      trim: true,
    },
    sessions: {
      type: Number,
      default: null,
    },
    /** EGP per session when plan is per_session or package (used with sessions to derive amount) */
    perSessionRate: {
      type: Number,
      default: null,
    },
    /** InstaPay screenshot uploaded by the parent. It only counts once the teacher confirms it (status 'review' -> 'paid'). */
    paymentProof: {
      path: { type: String },
      originalName: { type: String },
      uploadedAt: { type: Date },
    },
    /** Set when the teacher turns a proof down, so the parent sees why and can send a new one. */
    lastRejection: {
      reason: { type: String, trim: true },
      rejectedAt: { type: Date },
      proofPath: { type: String },
    },
    /** Who confirmed the payment and when (teacher). */
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      // 'review' = the parent sent proof and the teacher has not checked it yet
      enum: ['pending', 'review', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'instapay', null],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
