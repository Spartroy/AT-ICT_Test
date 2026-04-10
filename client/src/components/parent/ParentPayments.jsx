import React, { useState, useEffect, useRef } from 'react';
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
  PhotoIcon,
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

const INSTAPAY_LINK = 'https://ipn.eg/S/spartroy/instapay/2BjJKk';

const ParentPayments = () => {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [payingId, setPayingId]       = useState(null);
  const [payPanel, setPayPanel]       = useState(null); // { id, type: 'instapay' | 'card' } | null
  const [instapayFile, setInstapayFile] = useState(null);
  const [cardForm, setCardForm]       = useState({ name: '', number: '', expiry: '', cvc: '' });
  const prevPayPanelRef = useRef(null);

  useEffect(() => {
    const prev = prevPayPanelRef.current;
    prevPayPanelRef.current = payPanel;

    if (payPanel?.type !== 'instapay') setInstapayFile(null);
    if (payPanel?.type !== 'card') {
      setCardForm({ name: '', number: '', expiry: '', cvc: '' });
    } else if (payPanel.id !== prev?.id || prev?.type !== 'card') {
      setCardForm({ name: '', number: '', expiry: '', cvc: '' });
    }
  }, [payPanel]);

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

  const submitInstapayWithProof = async (paymentId) => {
    if (!instapayFile) {
      showError('Please attach a screenshot of your InstaPay transfer.');
      return;
    }
    setPayingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('paymentProof', instapayFile);
      const res = await fetch(API_ENDPOINTS.PARENT.PAY_INSTAPAY(paymentId), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Payment submitted with proof. Thank you!');
        setPayPanel(null);
        setInstapayFile(null);
        fetchPayments();
      } else {
        showError(data.message || 'Could not submit payment');
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const submitCardPayment = async (paymentId) => {
    const { name, number, expiry, cvc } = cardForm;
    if (!name.trim() || !number.trim() || !expiry.trim() || !cvc.trim()) {
      showError('Please fill in all card fields to continue (demo checkout — no real charge).');
      return;
    }
    setPayingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PARENT.PAY(paymentId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethod: 'card' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Payment recorded. Card gateway is not live yet — this only marks the plan as paid in the app.');
        setPayPanel(null);
        fetchPayments();
      } else {
        showError(data.message || 'Could not record payment');
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
                    {p.perSessionRate != null && p.sessions != null && (
                      <span className="text-gray-300 text-sm self-center">
                        {Number(p.perSessionRate).toLocaleString()} EGP × {p.sessions} sessions
                      </span>
                    )}
                    {p.sessions && p.perSessionRate == null && <span>{p.sessions} sessions included</span>}
                    {p.status === 'paid' && p.paymentProof?.path && (
                      <a
                        href={`${API_ENDPOINTS.BASE_URL}${p.paymentProof.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium self-center"
                      >
                        View payment screenshot
                      </a>
                    )}
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
                      onClick={() =>
                        setPayPanel(
                          payPanel?.id === p._id && payPanel?.type === 'instapay' ? null : { id: p._id, type: 'instapay' },
                        )
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        payPanel?.id === p._id && payPanel?.type === 'instapay'
                          ? 'bg-emerald-800/50 text-emerald-200 border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
                      }`}
                    >
                      <QrCodeIcon className="h-4 w-4" />
                      InstaPay
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPayPanel(payPanel?.id === p._id && payPanel?.type === 'card' ? null : { id: p._id, type: 'card' })
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        payPanel?.id === p._id && payPanel?.type === 'card'
                          ? 'bg-indigo-800/50 text-indigo-200 border-indigo-500/60 ring-1 ring-indigo-500/30'
                          : 'bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-700/50'
                      }`}
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      Card
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

              <AnimatePresence>
                {payPanel?.id === p._id && payPanel?.type === 'instapay' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                      <p className="text-emerald-300 font-semibold text-sm">Pay via InstaPay</p>
                      <p className="text-gray-300 text-xs">Send <strong className="text-white">{p.amount.toLocaleString()} EGP</strong> using the link below, then upload a screenshot of the InstaPay confirmation and submit.</p>
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
                      <div>
                        <span className="text-xs font-semibold text-emerald-200/90 uppercase tracking-wide block mb-2">InstaPay screenshot (required)</span>
                        <label
                          htmlFor={`instapay-proof-${p._id}`}
                          className="flex items-center gap-3 px-4 py-3 bg-gray-900/70 border border-dashed border-emerald-600/50 rounded-xl text-sm text-gray-300 hover:border-emerald-500/70 transition-colors cursor-pointer"
                        >
                          <PhotoIcon className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                          <span className="flex-1 truncate">
                            {instapayFile ? instapayFile.name : 'Tap to choose PNG, JPG, or WEBP'}
                          </span>
                        </label>
                        <input
                          id={`instapay-proof-${p._id}`}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setInstapayFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-gray-500 text-xs mt-1">A clear screenshot of the successful transfer helps verify your payment.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPayPanel(null)}
                          className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl text-sm hover:bg-gray-700/80 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitInstapayWithProof(p._id)}
                          disabled={payingId === p._id || !instapayFile}
                          className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {payingId === p._id ? 'Uploading…' : 'Submit payment + proof'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {payPanel?.id === p._id && payPanel?.type === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                      <p className="text-indigo-300 font-semibold text-sm">Pay with card (demo)</p>
                      <p className="text-gray-400 text-xs">
                        Enter details for a future checkout. No real charge — submitting marks this plan as paid for your records.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Name on card</label>
                          <input
                            type="text"
                            autoComplete="cc-name"
                            value={cardForm.name}
                            onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="As shown on card"
                            className="w-full px-3 py-2 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 text-sm focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Card number</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={cardForm.number}
                            onChange={e => setCardForm(f => ({ ...f, number: e.target.value }))}
                            placeholder="0000 0000 0000 0000"
                            className="w-full px-3 py-2 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 text-sm font-mono focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Expiry</label>
                          <input
                            type="text"
                            autoComplete="cc-exp"
                            value={cardForm.expiry}
                            onChange={e => setCardForm(f => ({ ...f, expiry: e.target.value }))}
                            placeholder="MM / YY"
                            className="w-full px-3 py-2 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 text-sm focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">CVC</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cardForm.cvc}
                            onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value }))}
                            placeholder="•••"
                            className="w-full px-3 py-2 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-200 text-sm focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPayPanel(null)}
                          className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl text-sm hover:bg-gray-700/80 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitCardPayment(p._id)}
                          disabled={payingId === p._id}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 border border-indigo-500/50"
                        >
                          {payingId === p._id ? 'Recording…' : 'Submit payment'}
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
