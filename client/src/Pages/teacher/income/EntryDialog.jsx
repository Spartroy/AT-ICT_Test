import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Dialog, DialogHeader, useToast } from '../../../components/portal/PortalUI';
import { api } from '../../../lib/api';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { apiError } from '../modals/form';

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayOf = (d) => (d ? new Date(d).toISOString().slice(0, 10) : today());

/**
 * Add or edit a manual income or expense. The source / category is free text:
 * pick one you used before or type a new one and it is remembered from then on.
 */
export default function EntryDialog({ open, kind, entry, suggestions = [], onClose, onSaved }) {
  const toast = useToast();
  const expense = kind === 'expense';
  const [v, setV] = useState({ amount: '', label: '', date: today(), note: '', student: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const students = useApi(open && !expense ? `${API_ENDPOINTS.TEACHER.STUDENTS}?limit=500` : null, b => b.data?.students || []);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setV(entry
      ? { amount: String(entry.amount), label: entry.label, date: dayOf(entry.date), note: entry.note || '', student: entry.student?.id || '' }
      : { amount: '', label: '', date: today(), note: '', student: '' });
  }, [open, entry]);

  if (!open) return null;
  const set = (k) => (e) => setV(x => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!(Number(v.amount) > 0)) next.amount = 'Enter an amount above zero';
    if (!v.label.trim()) next.label = expense ? 'Give the expense a category' : 'Say where the money came from';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const body = { kind, amount: Number(v.amount), label: v.label.trim(), date: v.date, note: v.note.trim(), student: expense ? undefined : (v.student || undefined) };
      if (entry) await api.put(`${API_ENDPOINTS.TEACHER_INCOME}/entries/${entry.id}`, body);
      else await api.post(`${API_ENDPOINTS.TEACHER_INCOME}/entries`, body);
      toast(entry ? 'Entry saved' : expense ? 'Expense added' : 'Income added');
      onSaved?.();
      onClose();
    } catch (err) {
      setErrors({ form: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const recent = suggestions.slice(0, 8);
  return (
    <Dialog open onClose={onClose} size="sm" labelledBy="entry-title">
      <DialogHeader id="entry-title" icon={expense ? ArrowUpRight : ArrowDownLeft} title={`${entry ? 'Edit' : 'Add'} ${expense ? 'expense' : 'income'}`} sub={expense ? 'Money you spent' : 'Money that did not come through a payment plan'} onClose={onClose} />
      <form className="mbody" onSubmit={submit} noValidate>
        <div className="r2">
          <label className="fld"><span>Amount (EGP) *</span>
            <input className="inp" type="number" min="0" step="0.01" inputMode="decimal" autoFocus value={v.amount} onChange={set('amount')} placeholder="0" aria-invalid={!!errors.amount} />
            {errors.amount && <span className="fld-err">{errors.amount}</span>}
          </label>
          <label className="fld"><span>Date</span><input className="inp" type="date" value={v.date} onChange={set('date')} /></label>
        </div>
        <label className="fld"><span>{expense ? 'Category *' : 'Source *'}</span>
          <input className="inp" list="ledger-labels" value={v.label} onChange={set('label')} maxLength={60} placeholder={expense ? 'e.g. Rent, Zoom, Printing' : 'e.g. Cash, Workshop'} aria-invalid={!!errors.label} />
          <datalist id="ledger-labels">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
          {errors.label && <span className="fld-err">{errors.label}</span>}
        </label>
        {!!recent.length && (
          <div className="inc-recent" role="group" aria-label="Used before">
            {recent.map(s => <button key={s} type="button" className={`ch ${v.label === s ? 'on' : ''}`} onClick={() => setV(x => ({ ...x, label: s }))}>{s}</button>)}
          </div>
        )}
        {!expense && (
          <label className="fld"><span>Credit to a student (optional)</span>
            <select className="inp" value={v.student} onChange={set('student')}>
              <option value="">Nobody in particular</option>
              {(students.data || []).map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
            </select>
            <small className="sub">It then counts in that student's total in the top and lowest payers.</small>
          </label>
        )}
        <label className="fld"><span>Note</span><input className="inp" value={v.note} onChange={set('note')} maxLength={300} placeholder="Optional" /></label>
        {errors.form && <p className="fld-err" role="alert">{errors.form}</p>}
        <div className="mfoot"><button type="button" className="btn o" onClick={onClose}>Cancel</button><button className="btn p" disabled={busy}>{busy ? 'Saving…' : entry ? 'Save' : expense ? 'Add expense' : 'Add income'}</button></div>
      </form>
    </Dialog>
  );
}
