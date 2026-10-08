import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ClipboardCheck, GraduationCap, CreditCard, Inbox as InboxIcon, Trophy, CheckCircle2, Clock, Upload, ExternalLink, LayoutGrid } from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';
import AnnouncementFeed from '../../components/portal/AnnouncementFeed';
import { Empty, ErrorNote, Ic, Loading, PageHead, Ring, Stat, fmtDate, fmtDateTime } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import Seo from '../../components/Seo';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';

const BASE = '/parent-dashboard';
const TITLES = { '': 'Home', homework: 'Homework', quizzes: 'Quizzes', payments: 'Payments', inbox: 'Inbox' };
const INSTAPAY_LINK = 'https://ipn.eg/S/spartroy/instapay/2BjJKk';
const DONE = ['submitted', 'graded'];
const STATUS = { assigned: 'Not submitted', in_progress: 'In progress', submitted: 'Awaiting grade', graded: 'Graded', late: 'Late' };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
};

/** Parent portal: the shared portal shell with the child's progress, work, payments and announcements. */
export default function ParentPortal() {
  const location = useLocation();
  const me = storedUser();
  const dash = useApi(API_ENDPOINTS.PARENT.DASHBOARD, b => b.data || {});
  const child = dash.data?.primaryChild?.student;
  const progress = useApi(child?._id ? `${API_ENDPOINTS.PARENT.BASE}/child/${child._id}/progress` : null, b => b.data || {});
  const payments = useApi(API_ENDPOINTS.PARENT.PAYMENTS, b => b.data?.payments || []);

  const section = location.pathname.replace(BASE, '').split('/')[1] || '';
  const childName = child ? `${child.user?.firstName || ''} ${child.user?.lastName || ''}`.trim() : '';
  const due = (payments.data || []).filter(p => p.status !== 'paid').length;
  const nav = [
    { to: BASE, end: true, label: 'Home', icon: HomeIcon },
    { to: `${BASE}/homework`, label: 'Homework', icon: ClipboardCheck },
    { to: `${BASE}/quizzes`, label: 'Quizzes', icon: GraduationCap },
    { to: `${BASE}/payments`, label: 'Payments', icon: CreditCard, badge: due },
    { to: `${BASE}/inbox`, label: 'Inbox', icon: InboxIcon }
  ];

  let body;
  if (dash.loading && !dash.data) body = <Loading label="Loading your child's progress…" />;
  else if (dash.error) body = <ErrorNote error={dash.error} onRetry={dash.reload} />;
  else if (!child) body = <div className="card"><Empty icon={LayoutGrid}>No student is linked to this account yet. Ask the teacher to link your child.</Empty></div>;
  else {
    body = (
      <Routes>
        <Route index element={<ParentHome child={child} childName={childName} stats={dash.data?.stats} progress={progress} payments={payments} />} />
        <Route path="homework" element={<WorkList kind="assignments" progress={progress} />} />
        <Route path="quizzes" element={<WorkList kind="quizzes" progress={progress} />} />
        <Route path="payments" element={<Payments payments={payments} />} />
        <Route path="inbox" element={<><PageHead title="Announcements" /><AnnouncementFeed /></>} />
        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Seo title={`${TITLES[section] || 'Parent'} · Parent portal`} path={location.pathname} noIndex />
      <PortalShell
        variant="parent"
        nav={nav}
        title={TITLES[section] || 'Home'}
        tagline="Parent portal"
        user={{ name: [me.firstName, me.lastName].filter(Boolean).join(' ') || 'Parent', sub: childName ? `Parent of ${childName.split(' ')[0]}` : 'Parent' }}
      >
        {body}
      </PortalShell>
    </>
  );
}

function ParentHome({ child, childName, stats, progress, payments }) {
  const a = stats?.assignments || {};
  const q = stats?.quizzes || {};
  const assignments = progress.data?.assignments || [];
  const graded = assignments.filter(x => x.status === 'graded' && x.maxScore);
  const avg = graded.length ? Math.round(graded.reduce((n, x) => n + x.score / x.maxScore, 0) / graded.length * 100) : 0;
  const upcoming = assignments.filter(x => !DONE.includes(x.status)).sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate)).slice(0, 4);
  const recent = [...graded].sort((x, y) => new Date(y.dueDate) - new Date(x.dueDate)).slice(0, 4);
  const unpaid = (payments.data || []).filter(p => p.status !== 'paid');

  return (
    <>
      <div className="hero">
        <div>
          <h1 className="big">{childName.split(' ')[0]}'s progress, <em>at a glance.</em></h1>
          <p className="sub">{[child.year && `Year ${child.year}`, child.session, child.studentId && `ID ${child.studentId}`].filter(Boolean).join(' · ')}</p>
          <p className="sub">Target grade <b className="tx">{child.targetGrade}</b>{child.currentGrade && child.currentGrade !== 'N/A' ? <> · Current <b className="tx">{child.currentGrade}</b></> : null}</p>
        </div>
        <Ring p={child.overallProgress || 0} size={140} fs="1.7rem" w={12} label={`Overall progress ${child.overallProgress || 0}%`} />
      </div>
      <div className="g4">
        <Stat icon={ClipboardCheck} label="Homework" value={`${a.completedAssignments || 0}/${a.totalAssignments || 0}`} ring={<Ring p={pct(a.completedAssignments, a.totalAssignments)} color="var(--phase-1)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={GraduationCap} label="Quizzes" value={`${q.completedQuizzes || 0}/${q.totalQuizzes || 0}`} ring={<Ring p={pct(q.completedQuizzes, q.totalQuizzes)} color="var(--phase-3)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={Trophy} label="Avg. score" value={`${avg}%`} ring={<Ring p={avg} color="var(--dark-warn)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={CreditCard} label="Payments due" value={unpaid.length} note={unpaid.length ? <span className="bad">Action needed</span> : <span className="ok">All paid ✓</span>} />
      </div>
      <div className="g2">
        <div className="card">
          <h3><Ic as={Clock} />Coming up</h3>
          {progress.loading && !progress.data && <Loading />}
          {progress.data && !upcoming.length && <Empty icon={CheckCircle2}>Nothing due right now.</Empty>}
          {upcoming.map(x => (
            <div className="next" key={x._id}>
              <div className={`tm ${new Date(x.dueDate) < new Date() ? 'bad' : ''}`}>{fmtDate(x.dueDate, { day: 'numeric', month: 'numeric' })}<small>{new Date(x.dueDate) < new Date() ? 'Overdue' : 'Due'}</small></div>
              <div><h4>{x.title}</h4><p>{STATUS[x.status] || x.status}</p></div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><Ic as={Trophy} />Recent grades</h3>
          {progress.data && !recent.length && <Empty icon={Trophy}>No grades yet.</Empty>}
          {recent.map(x => (
            <div className="next" key={x._id}>
              <div className="tm ok">{pct(x.score, x.maxScore)}%<small>{x.score}/{x.maxScore}</small></div>
              <div><h4>{x.title}</h4><p>{x.feedback || 'No feedback'}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WorkList({ kind, progress }) {
  const items = progress.data?.[kind] || [];
  const isQuiz = kind === 'quizzes';
  const done = items.filter(x => DONE.includes(x.status)).length;
  return (
    <>
      <PageHead title={isQuiz ? 'Quizzes' : 'Homework'} />
      {progress.loading && !progress.data && <Loading />}
      {progress.error && <ErrorNote error={progress.error} onRetry={progress.reload} />}
      {progress.data && (
        <div className="card work-sum-p">
          <div className="sum"><span className="ok"><Ic as={CheckCircle2} />{done} completed</span><span className="bad"><Ic as={Clock} />{items.length - done} pending</span></div>
        </div>
      )}
      {progress.data && !items.length && <Empty icon={isQuiz ? GraduationCap : ClipboardCheck}>Nothing here yet.</Empty>}
      {items.map(x => (
        <div className="row" key={x._id}>
          <div className="hd">
            <span className="ic"><Ic as={isQuiz ? GraduationCap : ClipboardCheck} /></span>
            <div>
              <h4>
                {x.title}
                <span className={`chip ${x.status === 'graded' ? 'c-pr' : DONE.includes(x.status) ? 'c-th' : 'c-gy'}`}>{STATUS[x.status] || x.status}</span>
                {x.isLate && <span className="chip c-rd">Late</span>}
              </h4>
              <div className="meta">
                {isQuiz
                  ? <><span>Date <b>{fmtDate(x.startDate)}</b></span><span>Time <b>{x.startTime || '—'}</b></span><span>Duration <b>{x.duration} min</b></span></>
                  : <><span>Due <b>{fmtDateTime(x.dueDate)}</b></span>{x.submissionDate && <span>Submitted <b>{fmtDateTime(x.submissionDate)}</b></span>}</>}
              </div>
              {x.feedback && <p className="sub" style={{ marginTop: 6 }}>Feedback: {x.feedback}</p>}
            </div>
            <div className="sc"><div><small>Score</small><b className={x.status === 'graded' ? 'ok' : ''}>{x.score ?? '—'}/{x.maxScore}</b>{x.status === 'graded' && <em>{pct(x.score, x.maxScore)}%</em>}</div></div>
          </div>
        </div>
      ))}
    </>
  );
}

function Payments({ payments }) {
  const toast = useToast();
  const [proof, setProof] = useState({});
  const [busy, setBusy] = useState(null);
  const list = payments.data || [];

  const upload = async (p) => {
    const file = proof[p._id];
    if (!file) return toast('Attach a screenshot of your InstaPay transfer first');
    setBusy(p._id);
    try {
      const fd = new FormData();
      fd.append('paymentProof', file);
      await api.post(API_ENDPOINTS.PARENT.PAY_INSTAPAY(p._id), fd);
      toast('Proof sent — the teacher will confirm it');
      payments.reload();
    } catch (err) {
      toast(err.message || "Couldn't upload the proof");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHead title="Payments" />
      {payments.loading && !payments.data && <Loading />}
      {payments.error && <ErrorNote error={payments.error} onRetry={payments.reload} />}
      {payments.data && !list.length && <div className="card"><Empty icon={CreditCard}>No payment plans yet.</Empty></div>}
      {list.map(p => (
        <div className="card pay-card" key={p._id}>
          <div className="pay-row">
            <div>
              <h3 style={{ margin: 0 }}>{p.description || 'Payment'} <span className={`chip ${p.status === 'paid' ? 'c-pr' : p.status === 'overdue' ? 'c-rd' : 'c-am'}`}>{p.status}</span></h3>
              <p className="sub">{p.sessions ? `${p.perSessionRate} × ${p.sessions} sessions · ` : ''}Due {fmtDate(p.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <b className="pay-total">{Number(p.amount || 0).toLocaleString()} {p.currency || 'EGP'}</b>
          </div>
          {p.status !== 'paid' && (
            p.paymentProof?.path ? (
              <p className="sub" style={{ marginTop: 10 }}><Ic as={Clock} /> Proof uploaded {fmtDate(p.paymentProof.uploadedAt)} — waiting for the teacher to confirm.</p>
            ) : (
              <div className="pay-actions">
                <a className="btn o sm" href={INSTAPAY_LINK} target="_blank" rel="noreferrer"><Ic as={ExternalLink} />Pay with InstaPay</a>
                <label className="btn o sm pay-file"><Ic as={Upload} />{proof[p._id] ? proof[p._id].name : 'Attach transfer screenshot'}
                  <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setProof(x => ({ ...x, [p._id]: e.target.files[0] }))} />
                </label>
                <button type="button" className="btn p sm" disabled={busy === p._id || !proof[p._id]} onClick={() => upload(p)}>{busy === p._id ? 'Sending…' : 'Send proof'}</button>
              </div>
            )
          )}
        </div>
      ))}
    </>
  );
}
