import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, GraduationCap, Trophy, Clock, Inbox as InboxIcon, CalendarDays, Megaphone, RefreshCw, Video, Crown, ChevronUp, ChevronDown, Minus, Star } from 'lucide-react';
import { useStudent } from './StudentPortal';
import GroupChip from '../../components/portal/GroupChip';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Ic, Ring, Stat, Empty, initials, fmtDate } from '../../components/portal/kit';
import WeekGrid from '../../components/portal/WeekGrid';
import { startsIn, useLiveActions, useLiveFeed } from '../../components/portal/LiveFeed';
import { VIEWS, moveInfo, rowTier, myRow } from './standings';
import { weekFromSchedule, typeChip, shortTime, sessionsAhead } from './scheduleUtils';

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function Standings({ rows, loading, meId, empty }) {
  if (!rows.length) return <Empty icon={Trophy}>{loading ? 'Loading standings…' : empty}</Empty>;
  return (
    <div className="fb" role="table" aria-label="Standings">
      <div className="fb-h" role="row"><span>#</span><span>Student</span><span>Pts</span></div>
      {rows.map(l => {
        const mine = String(l._id) === String(meId);
        const { tier, crown } = rowTier(l.rank);
        const m = moveInfo(l.movement);
        return (
          <div className={`fb-r ${tier} ${mine ? 'me2' : ''}`} role="row" key={l._id}>
            <span className="fb-rk"><i>{l.rank}</i>
              <em className={`fb-mv ${m.dir}`} title={m.dir === 'same' ? 'No change' : `${m.dir === 'up' ? 'Up' : 'Down'} ${m.n} since yesterday`}>
                {m.dir === 'up' ? <ChevronUp aria-label="Moved up" /> : m.dir === 'down' ? <ChevronDown aria-label="Moved down" /> : <Minus aria-label="No change" />}
                {m.n || ''}
              </em>
            </span>
            <span className="fb-nm">
              <span className="av" aria-hidden="true">{initials(`${l.firstName} ${l.lastName}`)}</span>
              <b className={mine ? 'lb-me' : ''}>{l.firstName} {l.lastName}{mine ? ' (you)' : ''}</b>
              {crown && <Crown className="fb-crown" aria-label="Number one" />}
            </span>
            <span className="pt">{l.points}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { base, me, stats, student, group, openPointsGuide } = useStudent();
  const [view, setView] = useState('session');
  const standings = useApi(`${API_ENDPOINTS.LEADERBOARD.BASE}?view=${view}`, b => b.data?.leaderboard || []);
  const assignments = useApi(API_ENDPOINTS.STUDENT.ASSIGNMENTS, b => b.data?.assignments || []);
  const schedule = useApi(API_ENDPOINTS.STUDENT.SCHEDULE, b => b.data || {});
  const announcements = useApi(API_ENDPOINTS.ANNOUNCEMENTS.BASE, b => b.data?.announcements || []);

  const progress = student?.studentInfo?.overallProgress || 0;
  const a = stats?.assignments || {};
  const q = stats?.quizzes || {};
  const pending = a.pendingAssignments || 0;

  const points = student?.studentInfo?.points?.currentSession || 0;
  const sessionLabel = student?.studentInfo?.points?.sessionLabel || '';
  const mineRow = myRow(standings.data, me._id);

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
  const { sessions: liveSessions, now } = useLiveFeed();
  const { busy: joining, join } = useLiveActions();

  return (
    <>
      <div className="hero">
        <div>
          <h1 className="big">Hi {me.firstName} — let's get that <em>A*.</em></h1>
          <p className="sub">You're {progress}% through this term's plan. Keep the streak alive.</p>
          {group && <p className="home-group"><GroupChip code={group.code} name={group.name} /></p>}
          <div className="acts">
            <Link className="btn p" to={`${base}/work`}><Ic as={ClipboardCheck} />{pending ? `${pending} assignment${pending === 1 ? '' : 's'} pending` : 'All work submitted'}</Link>
          </div>
        </div>
        <Ring p={progress} color="var(--crimson-glow)" size={140} fs="1.7rem" w={12} label={`Term plan ${progress}% complete`} />
      </div>

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

      <div className="g4">
        <Stat icon={ClipboardCheck} label="Assignments" value={`${a.completedAssignments || 0}/${a.totalAssignments || 0}`}
          note={pending ? <span className="bad">{pending} pending</span> : <span className="ok">All done ✓</span>}
          ring={<Ring p={pct(a.completedAssignments, a.totalAssignments)} color="var(--phase-1)" size={72} fs=".95rem" w={6} />} />
        <Stat icon={GraduationCap} label="Quizzes" value={`${q.completedQuizzes || 0}/${q.totalQuizzes || 0}`}
          note={q.totalQuizzes ? (q.pendingQuizzes ? <span className="bad">{q.pendingQuizzes} to take</span> : <span className="ok">All done ✓</span>) : <span className="faint">None yet</span>}
          ring={<Ring p={pct(q.completedQuizzes, q.totalQuizzes)} color="var(--ink-300)" size={72} fs=".95rem" w={6} />} />
        <Stat icon={Star} label="Points" value={points}
          note={<span className={points ? 'ok' : 'faint'}>{sessionLabel ? `${sessionLabel} session` : points ? 'This session' : 'Earn your first points'}</span>}
          ring={<Ring p={pct(points, Math.max(points, ...(standings.data || []).map(l => l.points || 0), 1))} color="var(--dark-warn)" size={72} fs=".95rem" w={6} label="Points compared with the top student" />} />
      </div>

      <div className="card">
        <h3><Ic as={CalendarDays} />This week<Link className="lk" to={`${base}/schedule`}>Full schedule →</Link></h3>
        <WeekGrid week={week} todayIdx={todayIdx} />
      </div>

      <div className="g2">
        <div className="card">
          <h3><Ic as={Clock} />Up next<Link className="lk" to={`${base}/schedule`}>Full schedule →</Link></h3>
          {liveSessions.map(ls => {
            const live = ls.status === 'live';
            return (
              <div className={`next next-live ${live ? 'on' : ''}`} key={ls.id}>
                <div className="tm">{live ? 'LIVE' : shortTime(new Date(ls.startsAt).toTimeString().slice(0, 5))}<small>{live ? 'now' : 'soon'}</small></div>
                <div>
                  <h4>{ls.title}</h4>
                  <p>{ls.topic ? `${ls.topic} · ` : ''}{live ? 'Started — join from here' : startsIn(ls.startsAt, now)}</p>
                </div>
                {live
                  ? <button type="button" className="btn p sm" disabled={joining} onClick={() => join(ls)}><Ic as={Video} />{ls.joinedByMe ? 'Rejoin' : 'Join'}</button>
                  : <button type="button" className="btn o sm" disabled>Not started</button>}
              </div>
            );
          })}
          {!upNext.length && !liveSessions.length && <Empty icon={CalendarDays}>Nothing scheduled yet.</Empty>}
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
              <div><h4>{item.title}</h4><p>{item.section}</p></div>
              <Link className="btn o sm" to={`${base}/work/assignments`}>View</Link>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><Ic as={Trophy} />Leaderboard<button type="button" className="lk" onClick={openPointsGuide}>How points work</button><button type="button" className="lk" aria-label="Refresh leaderboard" onClick={standings.reload}><Ic as={RefreshCw} /></button></h3>
          <div className="seg fb-tabs" role="tablist" aria-label="Leaderboard view">
            {VIEWS.map(v => <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={view === v.id ? 'on' : ''} onClick={() => setView(v.id)}>{v.label}</button>)}
          </div>
          <Standings rows={standings.data || []} loading={standings.loading} meId={me._id}
            empty={view === 'group' ? 'You are not in a group yet.' : 'Complete assignments to earn points.'} />
          {mineRow && <p className="faint fb-you">You are #{mineRow.rank} with {mineRow.points} pts.</p>}
        </div>
      </div>
    </>
  );
}
