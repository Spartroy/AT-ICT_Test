import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ClipboardCheck, Clock, History, ListChecks, MessageSquare, ShieldCheck, Video } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { Empty, Ic, fmtDate, initials } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { clock, useLiveFeed } from '../../components/portal/LiveFeed';
import { useTeacher } from '../teacher/TeacherPortal';
import { useTeacherChange } from '../teacher/modals/form';
import { hasNoAccess } from './access';
import { describeAction, dueInfo, queueCards, sortTasks, todaysSessions } from './dashboardLogic';

const TONE = { late: 'c-rd', soon: 'c-am', ok: 'c-gy', none: 'c-gy' };

/** Tasks the teacher left for assistants. Ticking one tells the teacher who did it. */
function Tasks() {
  const toast = useToast();
  const tasks = useApi('/api/assistant/tasks', b => b.data?.tasks || []);
  const rows = useMemo(() => sortTasks(tasks.data || []), [tasks.data]);

  const toggle = async (t) => {
    try {
      await api.put(`/api/assistant/tasks/${t._id}/done`, { done: !t.done });
      tasks.reload();
    } catch (err) {
      toast(err.message || "Couldn't update the task");
    }
  };

  return (
    <div className="card" id="tasks">
      <h3><Ic as={ListChecks} />Tasks from the teacher</h3>
      {tasks.data && !rows.length && <Empty icon={CheckCircle2}>Nothing assigned right now.</Empty>}
      {rows.map(t => {
        const due = dueInfo(t);
        return (
          <label className="act-r" key={t._id} style={{ cursor: 'pointer', opacity: t.done ? 0.6 : 1 }}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</b>
              {t.note && <small style={{ display: 'block', whiteSpace: 'normal' }}>{t.note}</small>}
            </div>
            <span className={`chip ${TONE[due.tone]}`}>{due.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Assistant dashboard: a work queue (what needs doing now), not an overview of the school. */
export default function AssistantDashboard() {
  const { base, me, assistant, can, counts, chats, openModal } = useTeacher();
  const permissions = assistant?.permissions || {};
  const feed = useLiveFeed();
  const subs = useApi(can('submissions') ? '/api/teacher/submissions?status=needs&limit=6' : null, b => b.data || {});
  const activity = useApi('/api/assistant/activity', b => b.data?.entries || []);
  const tasks = useApi('/api/assistant/tasks', b => b.data?.tasks || []);
  useTeacherChange(['assignment', 'quiz', 'schedule'], () => { subs.reload(); });

  const needs = subs.data?.submissions || [];
  const late = needs.filter(s => s.late).length;
  const today = todaysSessions(feed.sessions, feed.now);
  const unread = (chats?.data || []).filter(s => s.unreadCount > 0);
  const openTasks = (tasks.data || []).filter(t => !t.done).length;
  const cards = queueCards({ permissions, base, needsGrading: counts.needsGrading, lateCount: late, unreadChats: counts.unreadChats, liveToday: today.length, openTasks });
  const waiting = cards.reduce((n, c) => n + (c.n || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="hero">
        <div>
          <h1 className="big">{greeting}, <em>{me.firstName || 'there'}.</em></h1>
          <p className="sub">
            {hasNoAccess(permissions)
              ? 'The teacher has not given you access to anything yet. Ask them to open Settings → Assistants.'
              : waiting ? `${waiting} ${waiting === 1 ? 'item is' : 'items are'} in your queue today.` : 'Your queue is clear.'}
          </p>
        </div>
      </div>

      <div className="att">
        {cards.map(c => (
          <Link key={c.id} className={`attc ${c.n ? 'hot' : ''}`} to={c.to}>
            <span className="attn">{c.n ?? 0}</span>
            <span className="attt"><b>{c.title}</b><small>{c.sub}</small></span>
            <Ic as={ChevronRight} />
          </Link>
        ))}
      </div>

      <div className="g2h">
        <div className="col-stack">
          <Tasks />

          {can('submissions') && (
            <div className="card">
              <h3><Ic as={ClipboardCheck} />To grade<span className="chip c-rd" style={{ marginLeft: 6 }}>{counts.needsGrading || 0}</span></h3>
              {subs.data && !needs.length && <Empty icon={CheckCircle2}>Nothing waiting to be graded.</Empty>}
              {needs.slice(0, 5).map(s => (
                <div className="act-r" key={s.id}>
                  <span className="av" aria-hidden="true">{initials(s.student?.name)}</span>
                  <div><b>{s.student?.name}</b><small>{s.assignment?.title}{s.late && <> · <span className="bad">Late</span></>} · {fmtDate(s.submittedAt)}</small></div>
                  <div className="act-b"><Link className="btn p sm" to={`${base}/work/submissions?status=needs&sel=${s.id}`}>Grade</Link></div>
                </div>
              ))}
              {(counts.needsGrading || 0) > 5 && <Link className="btn o sm" style={{ marginTop: 8 }} to={`${base}/work/submissions?status=needs`}>See all {counts.needsGrading} →</Link>}
            </div>
          )}
        </div>

        <div className="col-stack">
          {can('live') && (
            <div className="card">
              <h3><Ic as={Video} />Classes today</h3>
              {!today.length && <Empty icon={Clock}>No classes today.</Empty>}
              {today.map(s => (
                <div className="act-r" key={s.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{s.title}</b>
                    <small>{s.status === 'live' ? 'Live now' : clock(s.startsAt)} · {s.durationMin} min</small>
                  </div>
                  {can('live', 'edit') && <button type="button" className="btn o sm" onClick={() => openModal('attendance', { session: s })}><Ic as={ClipboardCheck} />Attendance</button>}
                </div>
              ))}
            </div>
          )}

          {can('chat') && (
            <div className="card">
              <h3><Ic as={MessageSquare} />Waiting for a reply<span className="chip c-am" style={{ marginLeft: 6 }}>{unread.length}</span></h3>
              {!unread.length && <Empty icon={CheckCircle2}>No unread messages.</Empty>}
              {unread.slice(0, 5).map(s => (
                <div className="act-r" key={s._id || s.id}>
                  <span className="av" aria-hidden="true">{initials(s.fullName)}</span>
                  <div><b>{s.fullName}</b><small>{s.unreadCount} unread</small></div>
                  <div className="act-b"><Link className="btn p sm" to={`${base}/inbox/chat`}>Reply</Link></div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3><Ic as={History} />What you did recently</h3>
            {activity.data && !activity.data.length && <Empty icon={ShieldCheck}>Nothing yet. Your changes are listed here and visible to the teacher.</Empty>}
            {(activity.data || []).slice(0, 6).map(e => (
              <div className="act-r" key={e._id}>
                <div style={{ flex: 1, minWidth: 0 }}><b>{describeAction(e)}</b></div>
                <small>{fmtDate(e.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
