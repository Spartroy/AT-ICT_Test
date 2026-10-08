import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ClipboardCheck, GraduationCap, Star, User, Mail, CalendarDays, Users, Eye, Plus, Key, CheckCircle2, X, Trophy } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, Ic, Loading, ErrorNote, Stat, fmtDate, initials } from '../../components/portal/kit';
import { Dialog, useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { apiError } from './modals/form';

const TABS = [
  { id: 'sum', label: 'Summary', icon: LayoutGrid },
  { id: 'asg', label: 'Assignments', icon: ClipboardCheck },
  { id: 'quiz', label: 'Quizzes', icon: GraduationCap },
  { id: 'pay', label: 'Payments', icon: Star }
];
const known = (v) => v !== null && v !== undefined && v !== '' && v !== 'N/A' && v !== 'Not assigned';
const PLAN_LABEL = { monthly: 'Monthly', weekly: 'Weekly', per_session: 'Per session', package: 'Package' };

/** Wide student modal: Summary / Assignments / Quizzes / Payments. */
export default function StudentModal({ studentId, onClose, onCredentials }) {
  const [tab, setTab] = useState('sum');
  const detail = useApi(studentId ? `${API_ENDPOINTS.TEACHER.STUDENTS}/${studentId}` : null, b => b.data || {});
  const navigate = useNavigate();
  const { base } = useTeacher();
  if (!studentId) return null;
  const d = detail.data || {};
  const s = d.student;
  const myEntry = (item) => (item.assignedTo || []).find(e => String(e.student?._id || e.student) === String(studentId)) || {};

  return (
    <Dialog open onClose={() => { setTab('sum'); onClose(); }} size="wide" labelledBy="stu-title">
      <div className="mh big">
        <span className="av" style={{ width: 60, height: 60, fontSize: '1.1rem' }} aria-hidden="true">{initials(s ? `${s.firstName} ${s.lastName}` : '')}</span>
        <div>
          <h3 id="stu-title">{s ? `${s.firstName} ${s.lastName}` : 'Loading…'}</h3>
          {s && <p className="sub">{s.email}</p>}
          {s && <><span className={`chip ${s.registrationStatus === 'approved' ? 'c-pr' : 'c-am'}`}>{s.registrationStatus}</span> <span className={`chip ${s.isActive ? 'c-pr' : 'c-gy'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></>}
        </div>
        <button type="button" className="ib x" aria-label="Close" onClick={onClose}><Ic as={X} /></button>
      </div>
      <div className="mtabs" role="tablist" aria-label="Student sections">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <Ic as={t.icon} />{t.label}{t.id === 'asg' && d.assignments ? ` (${d.assignments.length})` : t.id === 'quiz' && d.quizzes ? ` (${d.quizzes.length})` : ''}
          </button>
        ))}
      </div>
      <div className="mbody stu-body">
        {detail.loading && !detail.data && <Loading />}
        {detail.error && <ErrorNote error={detail.error} onRetry={detail.reload} />}
        {s && tab === 'sum' && <Summary d={d} />}
        {s && tab === 'asg' && (
          <div className="tbl">
            {!d.assignments?.length && <Empty icon={ClipboardCheck}>No assignments.</Empty>}
            {(d.assignments || []).map(a => {
              const e = myEntry(a);
              const handed = ['submitted', 'graded'].includes(e.status);
              return (
                <div className="trow" key={a._id}>
                  <span className="lic"><Ic as={ClipboardCheck} /></span>
                  <div className="lmain"><b>{a.title}</b><small>Due {fmtDate(a.dueDate, { day: 'numeric', month: 'numeric', year: 'numeric' })} · max {a.maxScore} · {a.type}</small></div>
                  {e.status === 'graded' ? <span className="chip c-pr">{e.score}/{a.maxScore}</span> : <span className={`chip ${handed ? 'c-am' : 'c-gy'}`}>{handed ? 'Submitted' : e.status || 'assigned'}</span>}
                  {handed && (
                    <button type="button" className="btn o sm" onClick={() => { onClose(); navigate(`${base}/work/submissions?status=all&sel=${a._id}:${studentId}`); }}>
                      <Ic as={Eye} />Open submission
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {s && tab === 'quiz' && (
          <div className="tbl">
            {!d.quizzes?.length && <Empty icon={GraduationCap}>No quizzes.</Empty>}
            {(d.quizzes || []).map(q => {
              const e = myEntry(q);
              return (
                <div className="trow" key={q._id}>
                  <span className="lic"><Ic as={GraduationCap} /></span>
                  <div className="lmain"><b>{q.title}</b><small>{q.duration} min · max {q.maxScore} · {q.type}</small></div>
                  <span className={`chip ${e.status === 'graded' ? 'c-pr' : 'c-gy'}`}>{e.status === 'graded' ? `${e.score}/${q.maxScore}` : e.status || 'assigned'}</span>
                </div>
              );
            })}
          </div>
        )}
        {s && tab === 'pay' && <Payments student={s} onCredentials={onCredentials} />}
      </div>
      <div className="mfoot" style={{ padding: '0 24px 20px' }}><button type="button" className="btn o" onClick={onClose}>Close</button></div>
    </Dialog>
  );
}

function Summary({ d }) {
  const s = d.student;
  const a = d.stats?.assignments || {};
  const q = d.stats?.quizzes || {};
  const graded = (d.assignments || []).map(x => ({ x, e: (x.assignedTo || []).find(e => String(e.student?._id || e.student) === String(s._id)) })).filter(({ x, e }) => e?.status === 'graded' && x.maxScore);
  const avg = graded.length ? Math.round(graded.reduce((n, { x, e }) => n + e.score / x.maxScore, 0) / graded.length * 100) : 0;
  const academic = [['Student ID', s.studentId], ['School type', s.schoolType === 'royal' ? 'Royal College' : known(s.schoolType) ? 'Center / other' : 'N/A'], [s.schoolType === 'royal' ? 'Class' : 'Year', s.schoolType === 'royal' ? s.royalClass : s.year], ['Session', s.session], ['School', s.school], ['Target grade', s.targetGrade]];
  return (
    <>
      <div className="g4" style={{ marginBottom: 14 }}>
        <Stat icon={LayoutGrid} label="Progress" value={`${s.overallProgress || 0}%`} />
        <Stat icon={ClipboardCheck} label="Assignments" value={`${a.completed ?? 0}/${a.total ?? 0}`} />
        <Stat icon={GraduationCap} label="Quizzes" value={`${q.completed ?? 0}/${q.total ?? 0}`} />
        <Stat icon={Trophy} label="Score" value={`${avg}%`} />
      </div>
      <div className="g2e">
        <div className="card">
          <h3><Ic as={User} />Personal information</h3>
          <p className="ir"><Ic as={Mail} />{s.email}</p>
          <p className="ir"><Ic as={CalendarDays} />Enrolled: {fmtDate(s.enrolledDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="ir"><Ic as={Users} />Parent: {d.parentInfo?.email ? `${d.parentInfo.email}` : 'Not set up'}{known(s.parentContactNumber) ? ` · ${s.parentContactNumber}` : ''}</p>
          {known(s.nationality) && <p className="ir"><Ic as={User} />{s.nationality}</p>}
        </div>
        <div className="card">
          <h3><Ic as={GraduationCap} />Academic information</h3>
          {academic.map(([k, v]) => <div className="kvr" key={k}><span>{k}</span><b>{known(v) ? v : 'N/A'}</b></div>)}
        </div>
      </div>
    </>
  );
}

function Payments({ student, onCredentials }) {
  const toast = useToast();
  const confirm = useConfirm();
  const pays = useApi(API_ENDPOINTS.TEACHER.STUDENT_PAYMENTS(student._id), b => b.data?.payments || []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ planType: 'monthly', amount: '', sessions: '', perSessionRate: '', dueDate: '', description: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const perSession = ['per_session', 'package'].includes(form.planType);

  const add = async (e) => {
    e.preventDefault();
    const amount = perSession ? Number(form.sessions) * Number(form.perSessionRate) : Number(form.amount);
    if (!(amount > 0)) { setError(perSession ? 'Enter sessions and a rate per session' : 'Enter an amount'); return; }
    try {
      await api.post(API_ENDPOINTS.TEACHER.STUDENT_PAYMENTS(student._id), {
        planType: form.planType, amount, description: form.description.trim() || undefined, dueDate: form.dueDate || undefined,
        ...(perSession && { sessions: Number(form.sessions), perSessionRate: Number(form.perSessionRate) })
      });
      toast('Payment plan added');
      setAdding(false);
      setForm({ planType: 'monthly', amount: '', sessions: '', perSessionRate: '', dueDate: '', description: '' });
      setError('');
      pays.reload();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const markPaid = async (p) => {
    try {
      await api.put(API_ENDPOINTS.TEACHER.PAYMENT(p._id), { status: 'paid' });
      toast('Marked as paid');
      pays.reload();
    } catch (err) { toast(apiError(err)); }
  };
  const remove = async (p) => {
    if (!(await confirm({ title: 'Delete this payment plan?', confirmLabel: 'Delete' }))) return;
    try {
      await api.del(API_ENDPOINTS.TEACHER.PAYMENT(p._id));
      pays.reload();
    } catch (err) { toast(apiError(err)); }
  };
  const resetPw = async () => {
    if (!(await confirm({ title: `Reset ${student.firstName}'s password?`, confirmLabel: 'Reset password' }))) return;
    try {
      const res = await api.post(API_ENDPOINTS.TEACHER.RESET_STUDENT_PASSWORD(student._id), {});
      onCredentials?.({ title: `Temporary password for ${student.firstName}`, email: student.email, password: res.data.tempPassword });
    } catch (err) { toast(apiError(err)); }
  };

  return (
    <>
      <div className="pay-head">
        <h3 style={{ margin: 0 }}><Ic as={Star} />Payment plans</h3>
        <div className="ph-actions">
          <button type="button" className="btn o sm" onClick={resetPw}><Ic as={Key} />Reset password</button>
          <button type="button" className="btn p sm" onClick={() => setAdding(a => !a)}><Ic as={Plus} />Add plan</button>
        </div>
      </div>
      {adding && (
        <form className="card" style={{ marginBottom: 12 }} onSubmit={add}>
          <small className="lbl" style={{ color: 'var(--cr)' }}>New payment plan</small>
          <div className="r2">
            <label className="fld"><span>Plan type</span><select className="inp" value={form.planType} onChange={set('planType')}>{Object.entries(PLAN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            {perSession ? (
              <div className="r2">
                <label className="fld"><span>Sessions</span><input className="inp" type="number" min="1" value={form.sessions} onChange={set('sessions')} /></label>
                <label className="fld"><span>EGP / session</span><input className="inp" type="number" min="0" value={form.perSessionRate} onChange={set('perSessionRate')} /></label>
              </div>
            ) : (
              <label className="fld"><span>Amount (EGP)</span><input className="inp" type="number" min="1" value={form.amount} onChange={set('amount')} placeholder="e.g. 500" /></label>
            )}
          </div>
          <div className="r2">
            <label className="fld"><span>Due date</span><input className="inp" type="date" value={form.dueDate} onChange={set('dueDate')} /></label>
            <label className="fld"><span>Description</span><input className="inp" value={form.description} onChange={set('description')} placeholder="e.g. November package" /></label>
          </div>
          {error && <p className="fld-err">{error}</p>}
          <div className="mfoot"><button type="button" className="btn o sm" onClick={() => setAdding(false)}>Cancel</button><button className="btn p sm">Save plan</button></div>
        </form>
      )}
      {pays.loading && !pays.data && <Loading />}
      {pays.data && !pays.data.length && <Empty icon={Star}>No payment plans yet.</Empty>}
      {(pays.data || []).map(p => (
        <div className="trow" key={p._id}>
          <div className="lmain">
            <b>{p.description || 'Payment'} <span className="chip c-gy">{PLAN_LABEL[p.planType] || p.planType}</span> <span className={`chip ${p.status === 'paid' ? 'c-pr' : p.status === 'overdue' ? 'c-rd' : 'c-am'}`}>{p.status}</span></b>
            <small><b className="tx pay-amt">{Number(p.amount || 0).toLocaleString()} {p.currency || 'EGP'}</b> {p.sessions ? `${p.perSessionRate} × ${p.sessions} sessions` : ''} · Due {fmtDate(p.dueDate, { day: 'numeric', month: 'numeric', year: 'numeric' })}</small>
          </div>
          {p.status !== 'paid' && <button type="button" className="btn g sm" onClick={() => markPaid(p)}><Ic as={CheckCircle2} />Mark paid</button>}
          <button type="button" className="btn o sm dng" onClick={() => remove(p)}><Ic as={X} />Delete</button>
        </div>
      ))}
    </>
  );
}
