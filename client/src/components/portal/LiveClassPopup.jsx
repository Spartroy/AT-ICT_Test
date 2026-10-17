import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Video, ChevronDown, CalendarDays, ClipboardCheck, Square, ExternalLink, Clock } from 'lucide-react';
import { Ic } from './kit';
import { clock, startsIn, useFeaturedSession, useLiveActions, useLiveFeed } from './LiveFeed';
import { shortTime, typeChip } from '../../Pages/student/scheduleUtils';

const dismissedKey = 'liveClassDismissed';
const readDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(dismissedKey)) || []); } catch { return new Set(); }
};
const writeDismissed = (set) => {
  try { sessionStorage.setItem(dismissedKey, JSON.stringify([...set])); } catch { /* private mode */ }
};

/**
 * Floating "class is live / starting soon" card for both portals.
 * Student: a Join button that records entry, then opens the meeting. Teacher: start, open, see who is in, end.
 */
export default function LiveClassPopup({ scheduleHref, onAttendance, hideAt }) {
  const { pathname } = useLocation();
  const { role, now } = useLiveFeed();
  const s = useFeaturedSession();
  const { busy, join, start, end } = useLiveActions();
  const teacher = role === 'teacher';
  const [dismissed, setDismissed] = useState(readDismissed);
  if (!s || (hideAt && pathname.replace(/\/$/, '') === hideAt)) return null; // the dashboard card shows it there

  const key = `${s.id}:${s.status}`;
  const minimized = dismissed.has(key);
  const live = s.status === 'live';
  const setMin = (value) => setDismissed(prev => {
    const next = new Set(prev);
    if (value) next.add(key); else next.delete(key);
    writeDismissed(next);
    return next;
  });

  if (minimized) {
    return (
      <button type="button" className={`lvp-pill ${live ? 'live' : ''}`} onClick={() => setMin(false)} aria-label={`${live ? 'Live now' : 'Starting soon'}: ${s.title}. Show details`}>
        <i aria-hidden="true" />
        <span>{live ? 'Live now' : startsIn(s.startsAt, now)}</span>
        <b>{s.title}</b>
      </button>
    );
  }

  return (
    <aside className={`lvp ${live ? 'live' : ''}`} role="dialog" aria-label={live ? 'Class is live' : 'Class starting soon'}>
      <div className="lvp-top">
        <span className="lvp-badge">{live ? <><i aria-hidden="true" />Live now</> : <><Ic as={Clock} />{startsIn(s.startsAt, now)}</>}</span>
        <button type="button" className="lvp-x" aria-label="Minimise" onClick={() => setMin(true)}><Ic as={ChevronDown} /></button>
      </div>
      <h3 className="lvp-title">{s.title}</h3>
      <div className="lvp-meta">
        <span className={`chip ${typeChip(s.type)}`}>{s.type}</span>
        {s.topic && <span>{s.topic}</span>}
        <span>{clock(s.startedAt || s.startsAt)} · {s.durationMin} min</span>
      </div>
      {s.slot && (
        <p className="lvp-slot"><Ic as={CalendarDays} />From your timetable: {s.slot.scheduleTitle}{s.slot.day ? ` · ${s.slot.day}` : ''}{s.slot.startTime ? ` ${shortTime(s.slot.startTime)}` : ''}{s.slot.topic ? ` · ${s.slot.topic}` : ''}</p>
      )}
      {s.notes && <p className="lvp-notes">{s.notes}</p>}

      {teacher ? (
        <div className="lvp-act">
          {live ? (
            <>
              <button type="button" className="btn p" onClick={() => window.open(s.meetingUrl, '_blank', 'noopener,noreferrer')}><Ic as={ExternalLink} />Open meeting</button>
              <button type="button" className="btn o" onClick={() => onAttendance?.(s)}><Ic as={ClipboardCheck} />{s.joined} in</button>
              <button type="button" className="btn o" disabled={busy} onClick={() => end(s)}><Ic as={Square} />End</button>
            </>
          ) : (
            <button type="button" className="btn p" disabled={busy} onClick={() => start(s)}><Ic as={Video} />Start &amp; open meeting</button>
          )}
        </div>
      ) : (
        <div className="lvp-act">
          {live ? (
            <button type="button" className="btn p" disabled={busy} onClick={() => join(s)}><Ic as={Video} />{s.joinedByMe ? 'Rejoin session' : 'Join session'}</button>
          ) : (
            <button type="button" className="btn o" disabled><Ic as={Clock} />Waiting for the teacher to start</button>
          )}
          {scheduleHref && <Link className="btn o" to={scheduleHref}><Ic as={CalendarDays} />Schedule</Link>}
        </div>
      )}
      {scheduleHref && teacher && s.slot && <Link className="lvp-link" to={scheduleHref}>View in schedule</Link>}
    </aside>
  );
}
