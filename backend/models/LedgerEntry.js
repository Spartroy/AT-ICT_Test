const mongoose = require('mongoose');

// A manual money entry the teacher types in, next to what comes from payment plans:
//   income  – cash, a workshop, anything outside a payment plan (optionally credited to a student)
//   expense – rent, software, ads… The label (source / category) is free text, created the first time it is used.
const ledgerEntrySchema = new mongoose.Schema({
  kind: { type: String, enum: ['income', 'expense'], required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 60 }, // source (income) or category (expense)
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'EGP' },
  date: { type: Date, required: true, default: Date.now, index: true },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  // Income only: credit the money to a student so it counts in their total
  student: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ledgerEntrySchema.index({ kind: 1, date: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
