import { API_ENDPOINTS } from '../config/api';

/** Shared by the parent and teacher payment screens. Texts are English; the parent portal translates them with t(). */
export const PLAN_LABEL = { monthly: 'Monthly', weekly: 'Weekly', per_session: 'Per session', package: 'Package' };

export const STATUS_META = {
  pending: { label: 'Pending', chip: 'c-am' },
  review: { label: 'Under review', chip: 'c-th' },
  paid: { label: 'Paid', chip: 'c-pr' },
  overdue: { label: 'Overdue', chip: 'c-rd' },
  cancelled: { label: 'Cancelled', chip: 'c-gy' }
};

const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

/** Whole days from `now` to `date` (negative once it has passed). */
export const daysFromNow = (date, now = new Date()) => Math.round((dayStart(date) - dayStart(now)) / 86400000);

/** A pending payment past its due date shows as overdue even if nobody flagged it. */
export const effectiveStatus = (p, now = new Date()) =>
  p.status === 'pending' && p.dueDate && daysFromNow(p.dueDate, now) < 0 ? 'overdue' : p.status;

/** The three stops of a payment: issued, proof sent, confirmed by the teacher. */
export const paymentSteps = (p) => [
  { id: 'issued', label: 'Issued', done: true },
  { id: 'proof', label: 'Proof sent', done: ['review', 'paid'].includes(p.status) },
  { id: 'confirmed', label: 'Confirmed by teacher', done: p.status === 'paid' }
];

/** Money still to pay, money waiting for the teacher's check, and money confirmed. Cancelled plans count for nothing. */
export function paymentTotals(list = [], now = new Date()) {
  const t = { due: 0, review: 0, paid: 0, overdue: 0, currency: list[0]?.currency || 'EGP' };
  list.forEach((p) => {
    const amount = Number(p.amount) || 0;
    const s = effectiveStatus(p, now);
    if (s === 'paid') t.paid += amount;
    else if (s === 'review') t.review += amount;
    else if (s === 'pending' || s === 'overdue') { t.due += amount; if (s === 'overdue') t.overdue += amount; }
  });
  return t;
}

/** Full address of an uploaded proof (the API serves /uploads publicly). */
export const proofUrl = (path) => (path ? `${API_ENDPOINTS.BASE_URL}${path}` : null);
