import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Play, GraduationCap, Trophy, Clock, Inbox as InboxIcon, CalendarDays, Megaphone, RefreshCw } from 'lucide-react';
import { useStudent } from './StudentPortal';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Ic, Ring, Stat, Empty, initials, fmtDate } from '../../components/portal/kit';
import { WEEK, weekFromSchedule, typeChip, shortTime, sessionsAhead } from './scheduleUtils';

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const MEDALS = ['a1', 'a2', 'a3'];

export default function Home() {
  const { base, me, stats, student, leaderboard } = useStudent();
  const assignments = useApi(API_ENDPOINTS.STUDENT.ASSIGNMENTS, b => b.data?.assignments || []);
  const schedule = useApi(API_ENDPOINTS.STUDENT.SCHEDULE, b => b.data || {});
  const announcements = useApi(API_ENDPOINTS.ANNOUNCEMENTS.BASE, b => b.data?.announcements || []);

  const progress = student?.studentInfo?.overallProgress || 0;
  const a = stats?.assignments || {};
  const q = stats?.quizzes || {};
  const ann = stats?.announcements || {};
  const pending = a.pendingAssignments || 0;

  const graded = (assignments.data || []).filter(x => x.studentData?.status === 'graded' && x.maxScore);
  const avg = graded.length ? Math.round(graded.reduce((s, x) => s + (x.studentData.score || 0) / x.maxScore, 0) / graded.length * 100) : 0;

  const week = useMemo(() => weekFromSchedule(schedule.data?.schedule), [schedule.data]);
  const todayIdx = (new Date().getDay() + 6) % 7;

  const upNext = useMemo(() => {
    const sessions = sessionsAhead(schedule.data?.schedule, 2).map(s => ({ kind: 'session', ...s }));
    const due = (assignments.data || [])
      .filter(x => ['assigned', 'in_progress'].includes(x.studentData?.status))
      .sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate))
      .slice(0, 2)
      .map(x => ({ kind: 'work', ...x }));
    return [...sessions, ...due];
  }, [schedule.data, assignments.data]);

  const latest = (announcements.data || [])[0];

  return (
    <>
      <div className="hero">
        <div>
          <span className="eb">Welcome back</span>
          <h1 className="big">Hi {me.firstName} — let's get that <em>A*.</em></h1>
          <p className="sub">You're {progress}% through this term's plan. Keep the streak alive.</p>
          <div className="acts">
            <Link className="btn p" to={`${base}/work`}><Ic as={ClipboardCheck} />{pending ? `${pending} assignment${pending === 1 ? '' : 's'} pending` : 'All work submitted'}</Link>
            <Link className="btn o" to={`${base}/learn/videos`}><Ic as={Play} />Continue learning</Link>
          </div>
        </div>
        <Ring p={progress} color="var(--crimson-glow)" size={140} fs="1.7rem" w={12} label={`Term plan ${progress}% complete`} />
      </div>

      <div className="g4">
        <Stat icon={ClipboardCheck} label="Assignments" value={`${a.completedAssignments || 0}/${a.totalAssignments || 0}`}
          note={pending ? <span className="bad">{pending} pending</span> : <span className="ok">All done ✓</span>}
          ring={<Ring p={pct(a.completedAssignments, a.totalAssignments)} color="var(--phase-1)" size={72} fs=".95rem" w={6} />} />
        <Stat icon={GraduationCap} label="Quizzes" value={`${q.completedQuizzes || 0}/${q.totalQuizzes || 0}`}
          note={q.totalQuizzes ? (q.pendingQuizzes ? <span className="bad">{q.pendingQuizzes} to take</span> : <span className="ok">All done ✓</span>) : <span className="faint">None yet</span>}
          ring={<Ring p={pct(q.completedQuizzes, q.totalQuizzes)} color="var(--ink-300)" size={72} fs=".95rem" w={6} />} />
        <Stat icon={Megaphone} label="Announcements" value={`${(ann.totalAnnouncements || 0) - (ann.unreadAnnouncements || 0)}/${ann.totalAnnouncements || 0}`}
          note={ann.unreadAnnouncements ? <span className="bad">{ann.unreadAnnouncements} unread</span> : <span className="ok">All read ✓</span>}
          ring={<Ring p={pct((ann.totalAnnouncements || 0) - (ann.unreadAnnouncements || 0), ann.totalAnnouncements)} color="var(--phase-3)" size={72} fs=".95rem" w={6} />} />
        <Stat icon={Trophy} label="Avg. score" value={`${avg}%`}
          note={<span className={graded.length ? 'ok' : 'faint'}>{graded.length ? `${graded.length} graded` : 'Nothing graded yet'}</span>}
          ring={<Ring p={avg} color="var(--dark-warn)" size={72} fs=".95rem" w={6} />} />
      </div>

      <div className="g2">
        <div className="card">
          <h3><Ic as={Clock} />Up next<Link className="lk" to={`${base}/schedule`}>Full schedule →</Link></h3>
          {!upNext.length && <Empty icon={CalendarDays}>Nothing scheduled yet.</Empty>}
          {upNext.map((item, i) => item.kind === 'session' ? (
            <div className="next" key={`s${i}`}>
              <div className="tm">{shortTime(item.startTime)}<small>{item.when}</small></div>
              <div>
                <h4>{item.topic || `${item.type === 'practical' ? 'Practical' : 'Theory'} session`}</h4>
                <p>{item.startTime} – {item.endTime} · <span className={`chip ${typeChip(item.type)}`}>{item.type}</span></p>
              </div>
            </div>
          ) : (
            <div className="next" key={item._id}>
              <div className={`tm ${new Date(item.dueDate) < new Date() ? 'bad' : ''}`}>{fmtDate(item.dueDate, { day: 'numeric', month: 'numeric' })}<small>{new Date(item.dueDate) < new Date() ? 'Overdue' : 'Due'}</small></div>
              <div><h4>{item.title}</h4><p>{[item.difficulty, item.section].filter(Boolean).join(' · ')}</p></div>
              <Link className="btn o sm" to={`${base}/work/assignments`}>View</Link>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><Ic as={Trophy} />Leaderboard<button type="button" className="lk" aria-label="Refresh leaderboard" onClick={leaderboard.reload}><Ic as={RefreshCw} /></button></h3>
          {!(leaderboard.data || []).length && <Empty icon={Trophy}>Complete assignments to earn points.</Empty>}
          {(leaderboard.data || []).map((l, i) => {
            const mine = String(l._id) === String(me._id);
            return (
              <div className={`lb ${mine ? 'me2' : ''}`} key={l._id}>
                <i>0{i + 1}</i>
                <span className={`av ${MEDALS[i] || ''}`} aria-hidden="true">{initials(`${l.firstName} ${l.lastName}`)}</span>
                <b className={mine ? 'lb-me' : ''}>{l.firstName} {l.lastName}{mine ? ' (you)' : ''}</b>
                <span className="pt">{l.points}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="g2 g2-rev">
        <div className="card">
          <h3><Ic as={InboxIcon} />Latest announcement<Link className="lk" to={`${base}/inbox`}>View all →</Link></h3>
          {latest ? (
            <Link className="ann" style={{ margin: 0 }} to={`${base}/inbox/announcements?open=${latest._id}`}>
              <h4>{latest.title} <span className="chip c-th">{latest.type}</span></h4>
              <p className="clamp2">{latest.content}</p>
              <div className="m"><span>{fmtDate(latest.createdAt)}</span><span>{latest.createdBy ? `${latest.createdBy.firstName} ${latest.createdBy.lastName}` : ''}</span></div>
            </Link>
          ) : <Empty icon={Megaphone}>No announcements yet.</Empty>}
        </div>
        <div className="card">
          <h3><Ic as={CalendarDays} />This week</h3>
          <div className="week" id="wk">
            {WEEK.map((d, i) => (
              <div className={`wd ${i === todayIdx ? 'today' : ''}`} key={d}>
                <small>{d.slice(0, 3)}</small>
                {week[i].length ? week[i].map((s, k) => (
                  <div className={`ev ${s.type === 'practical' ? 'pr' : 'th'}`} key={k} title={`${s.type} · ${s.startTime} – ${s.endTime}${s.topic ? ` · ${s.topic}` : ''}`}>
                    <b>{s.type === 'practical' ? 'PR' : 'TH'}</b>{shortTime(s.startTime, true)}
                  </div>
                )) : <span className="no" aria-label="No sessions">—</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
