import React from 'react';
import { Link } from 'react-router-dom';
import { Video, ExternalLink, ClipboardCheck, Square, Clock, Play, CalendarDays } from 'lucide-react';
import { Ic } from './kit';
import { clock, startsIn, useFeaturedSession, useLiveActions, useLiveFeed } from './LiveFeed';

/**
 * Dashboard card for online classes.
 * Teacher: always shown (what's live, what's next, or a button to start one). Student: only while a class is live or about to start.
 */
export default function LiveClassCard({ onNew, onAttendance, scheduleHref }) {
  const { role, now } = useLiveFeed();
  const s = useFeaturedSession();
  const { busy, join, start, end } = useLiveActions();
  const teacher = role === 'teacher';
  if (!teacher && !s) return null;
  const live = s?.status === 'live';

  return (
    <div className={`card lvc ${live ? 'live' : ''}`}>
      <span className="lvc-ic" aria-hidden="true"><Ic as={Video} /></span>
      <div className="lvc-main">
        {s ? (
          <>
            <span className="lvc-badge">{live ? <><i aria-hidden="true" />Live now</> : <><Ic as={Clock} />{startsIn(s.startsAt, now)}</>}</span>
            <h3>{s.title}</h3>
            <small className="sub">
              {s.topic ? `${s.topic} · ` : ''}{clock(s.startedAt || s.startsAt)} · {s.durationMin} min{teacher && live ? ` · ${s.joined} entered` : ''}
            </small>
          </>
        ) : (
          <>
            <span className="lvc-badge idle">Online classes</span>
            <h3>Teach live from here</h3>
            <small className="sub">Start a class now, or hover a slot in the weekly schedule and tap Go live.</small>
          </>
        )}
      </div>
      <div className="lvc-act">
        {teacher ? (
          s ? (
            live ? (
              <>
                <button type="button" className="btn p" onClick={() => window.open(s.meetingUrl, '_blank', 'noopener,noreferrer')}><Ic as={ExternalLink} />Open meeting</button>
                <button type="button" className="btn o" onClick={() => onAttendance?.(s)}><Ic as={ClipboardCheck} />Attendance</button>
                <button type="button" className="btn o" disabled={busy} onClick={() => end(s)}><Ic as={Square} />End</button>
              </>
            ) : (
              <button type="button" className="btn p" disabled={busy} onClick={() => start(s)}><Ic as={Play} />Start now</button>
            )
          ) : (
            <button type="button" className="btn p" onClick={onNew}><Ic as={Video} />Start a live class</button>
          )
        ) : live ? (
          <button type="button" className="btn p" disabled={busy} onClick={() => join(s)}><Ic as={Video} />{s.joinedByMe ? 'Rejoin session' : 'Join session'}</button>
        ) : (
          <button type="button" className="btn o" disabled><Ic as={Clock} />Waiting for the teacher</button>
        )}
        {scheduleHref && <Link className="btn o" to={scheduleHref}><Ic as={CalendarDays} />Schedule</Link>}
      </div>
    </div>
  );
}
