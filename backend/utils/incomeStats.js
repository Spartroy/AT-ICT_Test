// The numbers behind the Income dashboard. Pure functions: controllers load the data, these do the sums.
//
// Money counts when it reaches the teacher: a payment plan on the day its proof was confirmed (paidDate),
// a manual entry on the date typed in. Cancelled plans never count. Amounts are in one currency (EGP).

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;
const DAY = 86400000;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
const addMonths = (key, n) => { const [y, m] = key.split('-').map(Number); return monthKey(new Date(y, m - 1 + n, 1)); };

/** 'all', '2026' or '2026-10' → { type, key, start, end } (end is exclusive); anything else falls back to the current month. */
function parsePeriod(input, now = new Date()) {
  const raw = String(input || '').trim();
  if (raw === 'all') return { type: 'all', key: 'all', start: new Date(0), end: new Date(8640000000000000) };
  if (YEAR.test(raw)) return { type: 'year', key: raw, start: new Date(Number(raw), 0, 1), end: new Date(Number(raw) + 1, 0, 1) };
  const key = MONTH.test(raw) ? raw : monthKey(now);
  const [y, m] = key.split('-').map(Number);
  return { type: 'month', key, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

const within = (date, period) => !!date && new Date(date) >= period.start && new Date(date) < period.end;
const paidAt = (p) => p.paidDate || p.updatedAt || p.createdAt;
const idOf = (v) => String(v?._id ?? v ?? '');

/**
 * Months to chart: the 12 months ending at the chosen month, the 12 months of a chosen year,
 * or (for "all") the 12 months ending now.
 */
function trendMonths(period, now = new Date()) {
  if (period.type === 'year') return Array.from({ length: 12 }, (_, i) => `${period.key}-${String(i + 1).padStart(2, '0')}`);
  const last = period.type === 'month' ? period.key : monthKey(now);
  return Array.from({ length: 12 }, (_, i) => addMonths(last, i - 11));
}

/**
 * payments: [{ _id, student: {_id, firstName, lastName} | id, amount, status, planType, description, dueDate, paidDate, createdAt }]
 * entries:  [{ _id, kind, label, amount, date, student? }]
 * students: [{ _id, name }]  active, approved students (so students who never paid can be ranked last)
 */
function buildSummary({ payments = [], entries = [], students = [], period: periodInput = 'month', now = new Date() }) {
  const period = typeof periodInput === 'object' ? periodInput : parsePeriod(periodInput, now);
  const live = payments.filter(p => p.status !== 'cancelled');
  const paid = live.filter(p => p.status === 'paid');

  // --- income and expenses in the period
  const paidInPeriod = paid.filter(p => within(paidAt(p), period));
  const manualIncome = entries.filter(e => e.kind === 'income' && within(e.date, period));
  const expenses = entries.filter(e => e.kind === 'expense' && within(e.date, period));
  const sum = (list) => round2(list.reduce((n, x) => n + (Number(x.amount) || 0), 0));
  const fromPlans = sum(paidInPeriod);
  const fromManual = sum(manualIncome);
  const totals = { income: round2(fromPlans + fromManual), fromPlans, fromManual, expenses: sum(expenses) };
  totals.profit = round2(totals.income - totals.expenses);
  totals.margin = totals.income > 0 ? Math.round((totals.profit / totals.income) * 100) : null;

  // --- where it comes from / goes
  const bySource = {};
  const addSource = (label, amount) => { bySource[label] = round2((bySource[label] || 0) + amount); };
  paidInPeriod.forEach(p => addSource(({ monthly: 'Monthly plans', weekly: 'Weekly plans', per_session: 'Per-session plans', package: 'Packages' })[p.planType] || 'Payment plans', Number(p.amount) || 0));
  manualIncome.forEach(e => addSource(e.label, Number(e.amount) || 0));
  const expenseByCategory = {};
  expenses.forEach(e => { expenseByCategory[e.label] = round2((expenseByCategory[e.label] || 0) + (Number(e.amount) || 0)); });
  const ranked = (obj, total) => Object.entries(obj).map(([label, amount]) => ({ label, amount, share: total > 0 ? Math.round((amount / total) * 100) : 0 })).sort((a, b) => b.amount - a.amount);

  // --- month by month
  const months = trendMonths(period, now);
  const trend = months.map(key => {
    const inc = round2(
      paid.filter(p => monthKey(paidAt(p)) === key).reduce((n, p) => n + (Number(p.amount) || 0), 0)
      + entries.filter(e => e.kind === 'income' && monthKey(e.date) === key).reduce((n, e) => n + (Number(e.amount) || 0), 0)
    );
    const exp = round2(entries.filter(e => e.kind === 'expense' && monthKey(e.date) === key).reduce((n, e) => n + (Number(e.amount) || 0), 0));
    return { month: key, income: inc, expenses: exp, profit: round2(inc - exp) };
  });

  // --- who pays most / least (plan money confirmed in the period + manual income credited to them)
  const nameOf = new Map(students.map(s => [String(s._id), s.name]));
  const paidBy = new Map(students.map(s => [String(s._id), 0]));
  const credit = (id, amount) => { const k = idOf(id); if (k && paidBy.has(k)) paidBy.set(k, round2(paidBy.get(k) + amount)); };
  paidInPeriod.forEach(p => credit(p.student, Number(p.amount) || 0));
  manualIncome.filter(e => e.student).forEach(e => credit(e.student, Number(e.amount) || 0));
  const standings = [...paidBy.entries()].map(([id, amount]) => ({ id, name: nameOf.get(id) || 'Student', amount }));
  const topPayers = standings.filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const lowestPayers = [...standings].sort((a, b) => a.amount - b.amount || a.name.localeCompare(b.name)).slice(0, 5);

  // --- who still owes (open plans, whatever the period)
  const nowMs = now.getTime();
  const open = live.filter(p => ['pending', 'overdue'].includes(p.status));
  const outstanding = open.map(p => {
    const due = p.dueDate ? new Date(p.dueDate).getTime() : null;
    const daysLate = due !== null && due < nowMs ? Math.floor((nowMs - due) / DAY) : 0;
    const student = p.student && typeof p.student === 'object' ? p.student : null;
    return {
      id: String(p._id),
      studentId: idOf(p.student),
      name: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : (nameOf.get(idOf(p.student)) || 'Student'),
      description: p.description || '',
      amount: Number(p.amount) || 0,
      dueDate: p.dueDate || null,
      daysLate
    };
  }).sort((a, b) => b.daysLate - a.daysLate || b.amount - a.amount);
  const outstandingTotal = sum(outstanding);
  const overdueTotal = sum(outstanding.filter(o => o.daysLate > 0));

  // --- collection rate: of the plans that fell due in the period (not cancelled), how much money has come in
  const dueInPeriod = live.filter(p => within(p.dueDate, period));
  const billed = sum(dueInPeriod);
  const collected = sum(dueInPeriod.filter(p => p.status === 'paid'));
  const daysToPay = paidInPeriod.filter(p => p.createdAt).map(p => (new Date(paidAt(p)) - new Date(p.createdAt)) / DAY);
  const collection = {
    billed,
    collected,
    rate: billed > 0 ? Math.round((collected / billed) * 100) : null,
    avgDaysToPay: daysToPay.length ? Math.round((daysToPay.reduce((n, d) => n + d, 0) / daysToPay.length) * 10) / 10 : null
  };

  // --- forecast: open plans (pending, overdue or waiting for review) due next calendar month, plus what is already overdue
  const nextKey = addMonths(monthKey(now), 1);
  const dueNext = live.filter(p => ['pending', 'overdue', 'review'].includes(p.status) && p.dueDate && monthKey(p.dueDate) === nextKey);
  const carry = live.filter(p => ['pending', 'overdue'].includes(p.status) && p.dueDate && new Date(p.dueDate) < new Date(now.getFullYear(), now.getMonth() + 1, 1) && monthKey(p.dueDate) !== nextKey);
  const forecast = { month: nextKey, expected: sum(dueNext), count: dueNext.length, carryOver: sum(carry), carryCount: carry.length };

  return {
    period: { type: period.type, key: period.key },
    totals,
    bySource: ranked(bySource, totals.income),
    expenseByCategory: ranked(expenseByCategory, totals.expenses),
    trend,
    topPayers,
    lowestPayers,
    outstanding: { total: outstandingTotal, overdue: overdueTotal, count: outstanding.length, items: outstanding.slice(0, 12) },
    collection,
    forecast
  };
}

/** CSV text for the period: every confirmed plan payment, manual income and expense, newest first. */
function buildCsv({ payments = [], entries = [], period: periodInput = 'month', now = new Date() }) {
  const period = typeof periodInput === 'object' ? periodInput : parsePeriod(periodInput, now);
  const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = [];
  payments.filter(p => p.status === 'paid' && within(paidAt(p), period)).forEach(p => {
    const st = p.student && typeof p.student === 'object' ? `${p.student.firstName || ''} ${p.student.lastName || ''}`.trim() : '';
    rows.push({ date: new Date(paidAt(p)), type: 'Income', label: p.description || p.planType || 'Payment plan', student: st, amount: Number(p.amount) || 0, note: '' });
  });
  entries.filter(e => within(e.date, period)).forEach(e => {
    const st = e.student && typeof e.student === 'object' ? `${e.student.firstName || ''} ${e.student.lastName || ''}`.trim() : '';
    rows.push({ date: new Date(e.date), type: e.kind === 'income' ? 'Income' : 'Expense', label: e.label, student: st, amount: Number(e.amount) || 0, note: e.note || '' });
  });
  rows.sort((a, b) => b.date - a.date);
  const head = ['Date', 'Type', 'Source / category', 'Student', 'Amount (EGP)', 'Note'];
  const lines = rows.map(r => [r.date.toISOString().slice(0, 10), r.type, r.label, r.student, (r.type === 'Expense' ? -r.amount : r.amount).toFixed(2), r.note].map(cell).join(','));
  return `﻿${[head.join(','), ...lines].join('\r\n')}\r\n`;
}

module.exports = { parsePeriod, monthKey, addMonths, trendMonths, buildSummary, buildCsv };
