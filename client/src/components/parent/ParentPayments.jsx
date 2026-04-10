import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QrCodeIcon,
  CreditCardIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';
import { showError, showSuccess } from '../../utils/toast';

const PLAN_LABELS = { monthly: 'Monthly', weekly: 'Weekly', per_session: 'Per Session', package: 'Package' };

const STATUS_CFG = {
  pending: { label: 'Pending',   icon: ClockIcon,               cls: 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' },
  paid:    { label: 'Paid',      icon: CheckCircleIcon,          cls: 'bg-green-900/30 text-green-300 border border-green-700/50'   },
  overdue: { label: 'Overdue',   icon: ExclamationTriangleIcon,  cls: 'bg-red-900/30 text-red-300 border border-red-700/50'         },
  cancelled:{ label: 'Cancelled',icon: XCircleIcon,              cls: 'bg-gray-700/50 text-gray-400 border border-gray-600/50'      },
};

const INSTAPAY_LINK = 'https://instapay.example.com/at-ict';

const ParentPayments = () => {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [payingId, setPayingId]       = useState(null);
  const [showInstapay, setShowInstapay] = useState(null); // paymentId

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PARENT.PAYMENTS, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') setPayments(data.data.payments || []);
      else showError(data.message || 'Failed to load payments');
    } catch {
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handlePay = async (paymentId, method) => {
    setPayingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PARENT.PAY(paymentId), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Payment marked as paid!');
        setShowInstapay(null);
        fetchPayments();
      } else {
        showError(data.message || 'Payment failed');
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const pending  = payments.filter(p => p.status === 'pending');
  const paid     = payments.filter(p => p.status === 'paid');
  const overdue  = payments.filter(p => p.status === 'overdue');
  const totalDue = pending.reduce((s, p) => s + p.amount, 0) + overdue.reduce((s, p) => s + p.amount, 0);

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
        <Icon className="h-3.5 w-3.5" />{cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <CurrencyDollarIcon className="h-7 w-7 text-[#CA133E]" />
            Payment Plans
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage your child's tuition payments</p>
        </div>
        <button
          type="button"
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-medium transition-colors border border-white/15"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Due',   value: `${totalDue.toLocaleString()} EGP`, color: totalDue > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Pending',     value: pending.length,  color: 'text-yellow-400' },
            { label: 'Paid',        value: paid.length,     color: 'text-green-400'  },
            { label: 'Overdue',     value: overdue.length,  color: overdue.length > 0 ? 'text-red-400' : 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black mb-0.5 ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Payments list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl py-16 text-center">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No payment plans yet</p>
          <p className="text-gray-600 text-sm mt-1">Your teacher will add payment plans here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map(p => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-white font-semibold">{p.description || PLAN_LABELS[p.planType]}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">
                      {PLAN_LABELS[p.planType]}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="text-white font-bold text-xl">{p.amount.toLocaleString()} <span className="text-sm font-normal text-gray-400">EGP</span></span>
                    {p.sessions && <span>{p.sessions} sessions included</span>}
                    {p.dueDate && <span>Due: {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    {p.paidDate && <span className="text-green-400">Paid: {new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                  {p.notes && <p className="text-gray-500 text-xs">{p.notes}</p>}
                </div>

                {/* Payment buttons */}
                {(p.status === 'pending' || p.status === 'overdue') && (
                  <div className="flex gap-2 flex-shrink-0">
                    {/* InstaPay */}
                    <button
                      type="button"
                      onClick={() => setShowInstapay(showInstapay === p._id ? null : p._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-sm font-medium transition-colors border border-emerald-700/50"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                      InstaPay
                    </button>
                    {/* Card */}
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-700/40 text-gray-500 rounded-xl text-sm font-medium border border-gray-600/50 cursor-not-allowed"
                      title="Card payments coming soon"
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      Card
                      <span className="text-xs bg-gray-600/50 px-1.5 py-0.5 rounded-full">Soon</span>
                    </button>
                  </div>
                )}
                {p.status === 'paid' && (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <CheckCircleIcon className="h-5 w-5" />
                    {p.paymentMethod === 'instapay' ? 'Paid via InstaPay' : p.paymentMethod === 'card' ? 'Paid via Card' : 'Paid'}
                  </div>
                )}
              </div>

              {/* InstaPay panel */}
              <AnimatePresence>
                {showInstapay === p._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                      <p className="text-emerald-300 font-semibold text-sm">Pay via InstaPay</p>
                      <p className="text-gray-300 text-xs">Send <strong className="text-white">{p.amount.toLocaleString()} EGP</strong> to the link below, then click "I've Paid" to confirm.</p>
                      <div className="flex items-center gap-2 bg-gray-900/60 border border-emerald-700/40 rounded-xl px-3 py-2">
                        <LinkIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <a href={INSTAPAY_LINK} target="_blank" rel="noopener noreferrer" className="text-emerald-300 text-sm font-mono hover:underline truncate flex-1">
                          {INSTAPAY_LINK}
                        </a>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(INSTAPAY_LINK)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 ml-2 flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowInstapay(null)}
                          className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl text-sm hover:bg-gray-700/80 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePay(p._id, 'instapay')}
                          disabled={payingId === p._id}
                          className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {payingId === p._id ? 'Confirming…' : "I've Paid — Confirm"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentPayments;
