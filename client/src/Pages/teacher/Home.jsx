import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Users, Megaphone, Trophy, LayoutGrid, AlertTriangle, Clock, ClipboardCheck, MessageSquare, CheckCircle2, UserPlus, FileText, GraduationCap, CreditCard, CalendarDays, Bell } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Accordion, Empty, Ic, Stat, initials, fmtDate, PageHead } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { useTeacherChange } from './modals/form';

const ACTIVITY_GROUPS = [
  { type: 'registration', label: 'Registrations', icon: UserPlus, verb: 'registered' },
  { type: 'assignment_submission', label: 'Submissions', icon: FileText, verb: 'submitted homework' },
  { type: 'quiz_submission', label: 'Quiz submissions', icon: GraduationCap, verb: 'submitted a quiz' },
  { type: 'message', label: 'Messages', icon: MessageSquare, verb: 'sent a message' },
  { type: 'payment', label: 'Payments', icon: CreditCard, verb: 'made a payment' },
  { type: 'attendance', label: 'Attendance', icon: CalendarDays, verb: 'checked in' },
  { type: 'grade_update', label: 'Grades', icon: CheckCircle2, verb: 'was graded' }
];
const MEDALS = ['a1', 'a2', 'a3'];

export default function Home() {
  const { base, counts, registrations, refreshBadges } = useTeacher();
  const navigate = useNavigate();
  const toast = useToast();
  const dash = useApi(API_ENDPOINTS.TEACHER.DASHBOARD, b => b.data || {});
  const subs = useApi('/api/teacher/submissions?status=all&limit=200', b => b.data || {});
  const activities = useApi(`${API_ENDPOINTS.TEACHER.ACTIVITIES}?limit=40`, b => b.data || {});
  const leaderboard = useApi(API_ENDPOINTS.LEADERBOARD.BASE, b => b.data?.leaderboard || []);
  useTeacherChange(['assignment', 'announcement', 'registration'], () => { dash.reload(); subs.reload(); });

  const needs = (subs.data?.submissions || []).filter(s => s.status === 'needs');
  const late = needs.filter(s => s.late).length;
  const graded = (subs.data?.submissions || []).filter(s => s.status === 'graded' && s.assignment.maxScore);
  const avgScore = graded.length ? Math.round(graded.reduce((n, s) => n + s.score / s.assignment.maxScore, 0) / graded.length * 100) : 0;
  const pending = registrations.data?.registrations || [];
  const overview = dash.data?.overview || {};

  const groups = useMemo(() => ACTIVITY_GROUPS
    .map(g => ({ ...g, items: (activities.data?.activities || []).filter(a => a.type === g.type) }))
    .filter(g => g.items.length), [activities.data]);

  const attention = [
    { n: counts.needsGrading, title: 'Need grading', sub: late ? `${late} late` : 'All on time', to: `${base}/work/submissions?status=needs` },
    { n: counts.pendingRegs, title: 'Pending registrations', sub: 'Review & approve', to: `${base}/students/registrations` },
    { n: late, title: 'Late submissions', sub: 'Check these first', to: `${base}/work/submissions?status=late` },
    { n: counts.unreadChats, title: 'Unread messages', sub: 'Parents & students', to: `${base}/inbox/chat` }
  ];

  const approve = async (r) => {
    try {
      await api.put(`${API_ENDPOINTS.REGISTRATION.BASE}/${r._id}/approve`, {});
      toast(`${r.firstName} ${r.lastName} approved`);
      refreshBadges();
      dash.reload();
    } catch (err) {
      toast(err.message || "Couldn't approve");
    }
  };

  const markAllRead = async () => {
    const ids = (activities.data?.activities || []).filter(a => !a.isRead).map(a => a._id);
    try {
      await api.put(`${API_ENDPOINTS.TEACHER.ACTIVITIES}/mark-read`, { activityIds: ids });
      activities.reload();
      toast('All marked as read');
    } catch (err) {
      toast(err.message || "Couldn't update");
    }
  };

  const nameOf = (a) => (a.student ? `${a.student.firstName || ''} ${a.student.lastName || ''}`.trim() : a.title);

  return (
    <>
      <PageHead title={<>Welcome back, <span className="hl">Maestro.</span></>}>
        <p className="sub">{overview.totalStudents ?? '—'} students enrolled</p>
      </PageHead>

      <div className="att">
        {attention.map(a => (
          <Link key={a.title} className={`attc ${a.n ? 'hot' : ''}`} to={a.to}>
            <span className="attn">{a.n ?? 0}</span>
            <span className="attt"><b>{a.title}</b><small>{a.sub}</small></span>
            <Ic as={ChevronRight} />
          </Link>
        ))}
      </div>

      <div className="g4">
        <Stat icon={Users} label="Total students" value={overview.totalStudents ?? '—'} />
        <Stat icon={Megaphone} label="Active announcements" value={overview.activeAnnouncements ?? '—'} />
        <Stat icon={Trophy} label="Avg. score" value={`${avgScore}%`} />
        <Stat icon={LayoutGrid} label="Avg. progress" value={`${Math.round(dash.data?.performance?.avgProgress || 0)}%`} />
      </div>

      <div className="g2h">
        <div className="col-stack">
          <div className="card">
            <h3><Ic as={AlertTriangle} />Needs your action<span className="chip c-rd" style={{ marginLeft: 6 }}>{needs.length + pending.length}</span></h3>
            {!needs.length && !pending.length && <Empty icon={CheckCircle2}>You're all caught up.</Empty>}
            {pending.slice(0, 4).map(r => (
              <div className="act-r" key={r._id}>
                <span className="av" aria-hidden="true">{initials(`${r.firstName} ${r.lastName}`)}</span>
                <div><b>{r.firstName} {r.lastName}</b><small>New registration · {fmtDate(r.createdAt, { day: 'numeric', month: 'numeric', year: 'numeric' })}</small></div>
                <div className="act-b">
                  <button type="button" className="btn o sm" onClick={() => navigate(`${base}/students/registrations?open=${r._id}`)}>View</button>
                  <button type="button" className="btn g sm" onClick={() => approve(r)}>Approve</button>
                </div>
              </div>
            ))}
            {needs.slice(0, 4).map(s => (
              <div className="act-r" key={s.id}>
                <span className="av" aria-hidden="true">{initials(s.student.name)}</span>
                <div><b>{s.student.name}</b><small>{s.assignment.title}{s.late && <> · <span className="bad">Late</span></>} · {fmtDate(s.submittedAt)}</small></div>
                <div className="act-b"><Link className="btn p sm" to={`${base}/work/submissions?status=needs&sel=${s.id}`}>Grade</Link></div>
              </div>
            ))}
            {needs.length > 4 && <Link className="btn o sm" style={{ marginTop: 8 }} to={`${base}/work/submissions?status=needs`}>See all {needs.length} →</Link>}
          </div>

          <div className="card">
            <h3><Ic as={Clock} />Recent activity{!!activities.data?.unreadCount && <button type="button" className="lk" onClick={markAllRead}>Mark all read</button>}</h3>
            {!groups.length && <Empty icon={Bell}>Nothing new.</Empty>}
            {groups.map(g => (
              <Accordion
                key={g.type}
                count={g.items.length}
                head={<><span className="n act-n"><Ic as={g.icon} /></span><span><h4>{g.label}</h4></span></>}
              >
                <div className="act-list">
                  {g.items.map(a => (
                    <div className={`lg-r ${a.isRead ? '' : 'unread'}`} key={a._id}>
                      <span className="av" style={{ width: 30, height: 30, fontSize: '.7rem' }} aria-hidden="true">{initials(nameOf(a))}</span>
                      <span>{a.description || `${nameOf(a)} ${g.verb}`}</span>
                      <small>{fmtDate(a.createdAt, { day: 'numeric', month: 'numeric', year: 'numeric' })}</small>
                    </div>
                  ))}
                </div>
              </Accordion>
            ))}
          </div>
        </div>

        <div className="card">
          <h3><Ic as={Trophy} />Leaderboard{leaderboard.data?.[0]?.sessionLabel && <span className="chip c-gy" style={{ marginLeft: 6 }}>{leaderboard.data[0].sessionLabel}</span>}</h3>
          {!(leaderboard.data || []).length && <Empty icon={Trophy}>No points yet this session.</Empty>}
          {(leaderboard.data || []).map((l, i) => (
            <div className="lb" key={l._id}>
              <i>0{i + 1}</i>
              <span className={`av ${MEDALS[i] || ''}`} aria-hidden="true">{initials(`${l.firstName} ${l.lastName}`)}</span>
              <b>{l.firstName} {l.lastName}</b>
              <span className="pt">{l.points}</span>
            </div>
          ))}
          <Link className="btn o sm" style={{ marginTop: 10 }} to={`${base}/work/submissions`}><Ic as={ClipboardCheck} />Open submissions</Link>
        </div>
      </div>
    </>
  );
}
