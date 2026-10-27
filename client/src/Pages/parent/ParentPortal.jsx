import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ClipboardCheck, GraduationCap, CreditCard, Inbox as InboxIcon, Trophy, CheckCircle2, Clock, LayoutGrid } from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';
import AnnouncementFeed from '../../components/portal/AnnouncementFeed';
import { Empty, ErrorNote, Ic, Loading, PageHead, Ring, Stat } from '../../components/portal/kit';
import Seo from '../../components/Seo';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { LanguageProvider, LanguageToggle } from '../../i18n/LanguageContext';
import { useLang } from '../../i18n/context';
import { effectiveStatus } from '../../lib/payments';
import '../../styles/i18n.css';
import Payments from './Payments';
import ar from './ar';

const BASE = '/parent-dashboard';
const TITLES = { '': 'Home', homework: 'Homework', quizzes: 'Quizzes', payments: 'Payments', inbox: 'Inbox' };
const DICTIONARIES = { ar };
const DONE = ['submitted', 'graded'];
const STATUS = { assigned: 'Not submitted', in_progress: 'In progress', submitted: 'Awaiting grade', graded: 'Graded', late: 'Late' };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
};

/** Parent portal: the shared portal shell with the child's progress, work, payments and announcements. English or Arabic. */
export default function ParentPortal() {
  return (
    <LanguageProvider dictionaries={DICTIONARIES} storageKey="atict:lang:parent">
      <ParentApp />
    </LanguageProvider>
  );
}

function ParentApp() {
  const { t } = useLang();
  const location = useLocation();
  const me = storedUser();
  const dash = useApi(API_ENDPOINTS.PARENT.DASHBOARD, b => b.data || {});
  const child = dash.data?.primaryChild?.student;
  const progress = useApi(child?._id ? `${API_ENDPOINTS.PARENT.BASE}/child/${child._id}/progress` : null, b => b.data || {});
  const payments = useApi(API_ENDPOINTS.PARENT.PAYMENTS, b => b.data?.payments || []);

  const section = location.pathname.replace(BASE, '').split('/')[1] || '';
  const childName = child ? `${child.user?.firstName || ''} ${child.user?.lastName || ''}`.trim() : '';
  const due = (payments.data || []).filter(p => ['pending', 'overdue'].includes(effectiveStatus(p))).length;
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
  else if (!child) body = <div className="card"><Empty icon={LayoutGrid}>{t('No student is linked to this account yet. Ask the teacher to link your child.')}</Empty></div>;
  else {
    body = (
      <Routes>
        <Route index element={<ParentHome child={child} childName={childName} stats={dash.data?.stats} progress={progress} payments={payments} />} />
        <Route path="homework" element={<WorkList kind="assignments" progress={progress} />} />
        <Route path="quizzes" element={<WorkList kind="quizzes" progress={progress} />} />
        <Route path="payments" element={<Payments payments={payments} />} />
        <Route path="inbox" element={<><PageHead title={t('Announcements')} /><AnnouncementFeed /></>} />
        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Seo title={`${t(TITLES[section] || 'Parent')} · ${t('Parent portal')}`} path={location.pathname} noIndex />
      <PortalShell
        variant="parent"
        nav={nav}
        title={TITLES[section] || 'Home'}
        tagline="Parent portal"
        user={{ name: [me.firstName, me.lastName].filter(Boolean).join(' ') || t('Parent'), sub: childName ? t('Parent of {name}', { name: childName.split(' ')[0] }) : t('Parent') }}
        bellSlot={<LanguageToggle />}
      >
        {body}
      </PortalShell>
    </>
  );
}

function ParentHome({ child, childName, stats, progress, payments }) {
  const { t, fmtDate } = useLang();
  const a = stats?.assignments || {};
  const q = stats?.quizzes || {};
  const assignments = progress.data?.assignments || [];
  const graded = assignments.filter(x => x.status === 'graded' && x.maxScore);
  const avg = graded.length ? Math.round(graded.reduce((n, x) => n + x.score / x.maxScore, 0) / graded.length * 100) : 0;
  const upcoming = assignments.filter(x => !DONE.includes(x.status)).sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate)).slice(0, 4);
  const recent = [...graded].sort((x, y) => new Date(y.dueDate) - new Date(x.dueDate)).slice(0, 4);
  const unpaid = (payments.data || []).filter(p => ['pending', 'overdue'].includes(effectiveStatus(p)));

  return (
    <>
      <div className="hero">
        <div>
          <h1 className="big">{t("{name}'s progress,", { name: childName.split(' ')[0] })} <em>{t('at a glance.')}</em></h1>
          <p className="sub">{[child.year && t('Year {n}', { n: child.year }), child.session, child.studentId && `${t('ID')} ${child.studentId}`].filter(Boolean).join(' · ')}</p>
          {child.currentGrade && child.currentGrade !== 'N/A' && <p className="sub">{t('Current grade')} <b className="tx">{child.currentGrade}</b></p>}
        </div>
        <Ring p={child.overallProgress || 0} size={140} fs="1.7rem" w={12} label={`${t('Overall progress')} ${child.overallProgress || 0}%`} />
      </div>
      <div className="g4">
        <Stat icon={ClipboardCheck} label={t('Homework')} value={`${a.completedAssignments || 0}/${a.totalAssignments || 0}`} ring={<Ring p={pct(a.completedAssignments, a.totalAssignments)} color="var(--phase-1)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={GraduationCap} label={t('Quizzes')} value={`${q.completedQuizzes || 0}/${q.totalQuizzes || 0}`} ring={<Ring p={pct(q.completedQuizzes, q.totalQuizzes)} color="var(--phase-3)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={Trophy} label={t('Avg. score')} value={`${avg}%`} ring={<Ring p={avg} color="var(--dark-warn)" size={68} fs=".85rem" w={6} />} />
        <Stat icon={CreditCard} label={t('Payments due')} value={unpaid.length} note={unpaid.length ? <span className="bad">{t('Action needed')}</span> : <span className="ok">{t('All paid ✓')}</span>} />
      </div>
      <div className="g2">
        <div className="card">
          <h3><Ic as={Clock} />{t('Coming up')}</h3>
          {progress.loading && !progress.data && <Loading />}
          {progress.data && !upcoming.length && <Empty icon={CheckCircle2}>{t('Nothing due right now.')}</Empty>}
          {upcoming.map(x => (
            <div className="next" key={x._id}>
              <div className={`tm ${new Date(x.dueDate) < new Date() ? 'bad' : ''}`}>{fmtDate(x.dueDate, { day: 'numeric', month: 'numeric' })}<small>{new Date(x.dueDate) < new Date() ? t('Overdue') : t('Due')}</small></div>
              <div><h4 dir="auto">{x.title}</h4><p>{t(STATUS[x.status] || x.status)}</p></div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><Ic as={Trophy} />{t('Recent grades')}</h3>
          {progress.data && !recent.length && <Empty icon={Trophy}>{t('No grades yet.')}</Empty>}
          {recent.map(x => (
            <div className="next" key={x._id}>
              <div className="tm ok">{pct(x.score, x.maxScore)}%<small>{x.score}/{x.maxScore}</small></div>
              <div><h4>{x.title}</h4><p dir="auto">{x.feedback || t('No feedback')}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WorkList({ kind, progress }) {
  const { t, fmtDate, fmtDateTime } = useLang();
  const items = progress.data?.[kind] || [];
  const isQuiz = kind === 'quizzes';
  const done = items.filter(x => DONE.includes(x.status)).length;
  return (
    <>
      <PageHead title={isQuiz ? t('Quizzes') : t('Homework')} />
      {progress.loading && !progress.data && <Loading />}
      {progress.error && <ErrorNote error={progress.error} onRetry={progress.reload} />}
      {progress.data && (
        <div className="card work-sum-p">
          <div className="sum"><span className="ok"><Ic as={CheckCircle2} />{t('{n} completed', { n: done })}</span><span className="bad"><Ic as={Clock} />{t('{n} pending', { n: items.length - done })}</span></div>
        </div>
      )}
      {progress.data && !items.length && <Empty icon={isQuiz ? GraduationCap : ClipboardCheck}>{t('Nothing here yet.')}</Empty>}
      {items.map(x => (
        <div className="row" key={x._id}>
          <div className="hd">
            <span className="ic"><Ic as={isQuiz ? GraduationCap : ClipboardCheck} /></span>
            <div>
              <h4>
                {x.title}
                <span className={`chip ${x.status === 'graded' ? 'c-pr' : DONE.includes(x.status) ? 'c-th' : 'c-gy'}`}>{t(STATUS[x.status] || x.status)}</span>
                {x.isLate && <span className="chip c-rd">{t('Late')}</span>}
              </h4>
              <div className="meta">
                {isQuiz
                  ? <><span>{t('Date')} <b>{fmtDate(x.startDate)}</b></span><span>{t('Time')} <b>{x.startTime || '—'}</b></span><span>{t('Duration')} <b>{t('{n} min', { n: x.duration })}</b></span></>
                  : <><span>{t('Due')} <b>{fmtDateTime(x.dueDate)}</b></span>{x.submissionDate && <span>{t('Submitted')} <b>{fmtDateTime(x.submissionDate)}</b></span>}</>}
              </div>
              {x.feedback && <p className="sub" style={{ marginTop: 6 }}>{t('Feedback')}: {x.feedback}</p>}
            </div>
            <div className="sc"><div><small>{t('Score')}</small><b className={x.status === 'graded' ? 'ok' : ''}>{x.score ?? '—'}/{x.maxScore}</b>{x.status === 'graded' && <em>{pct(x.score, x.maxScore)}%</em>}</div></div>
          </div>
        </div>
      ))}
    </>
  );
}
