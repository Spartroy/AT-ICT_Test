import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, ChevronDown, CalendarDays, ClipboardCheck, Square, ExternalLink, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import openTab from '../../lib/openTab';
import { Ic } from './kit';
import { useToast } from './PortalUI';
import { announceChange } from '../../Pages/teacher/modals/form';
import { shortTime, typeChip } from '../../Pages/student/scheduleUtils';

const POLL_MS = 20000;
const SOON_MS = 15 * 60 * 1000;
const dismissedKey = 'liveClassDismissed';

const readDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(dismissedKey)) || []); } catch { return new Set(); }
};
const writeDismissed = (set) => {
  try { sessionStorage.setItem(dismissedKey, JSON.stringify([...set])); } catch { /* private mode */ }
};

const clock = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function startsIn(startsAt, now) {
  const mins = Math.round((new Date(startsAt) - now) / 60000);
  if (mins <= 0) return 'Starting now';
  if (mins < 60) return `Starts in ${mins} min`;
  return `Starts at ${clock(startsAt)}`;
}

/**
 * Floating "class is live / starting soon" card for both portals.
 * Student: a Join button that records entry, then opens the meeting. Teacher: start, open, see who is in, end.
 */
export default function LiveClassPopup({ role, scheduleHref, onAttendance }) {
  const toast = useToast();
  const teacher = role === 'teacher';
  const [sessions, setSessions] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(readDismissed);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      if (teacher) {
        const res = await api.get(API_ENDPOINTS.TEACHER_LIVE);
        const t = Date.now();
        setSessions((res.data?.sessions || []).filter(s => s.status === 'live' || (s.status === 'scheduled' && new Date(s.startsAt) - t <= SOON_MS && t - new Date(s.startsAt) <= 3 * 3600 * 1000)));
      } else {
        const res = await api.get(API_ENDPOINTS.LIVE.CURRENT);
        setSessions(res.data?.sessions || []);
      }
    } catch { /* offline or signed out: keep what we have */ }
  }, [teacher]);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(new Date()), 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('teacher:changed', load);
    return () => {
      clearInterval(poll); clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('teacher:changed', load);
    };
  }, [load]);

  const s = useMemo(() => sessions.find(x => x.status === 'live') || sessions[0], [sessions]);
  if (!s) return null;

  const key = `${s.id}:${s.status}`;
  const minimized = dismissed.has(key);
  const live = s.status === 'live';
  const setMin = (value) => setDismissed(prev => {
    const next = new Set(prev);
    if (value) next.add(key); else next.delete(key);
    writeDismissed(next);
    return next;
  });

  const join = async () => {
    setBusy(true);
    const tab = openTab();
    try {
      const res = await api.post(`${API_ENDPOINTS.LIVE.BASE}/${s.id}/join`);
      tab.go(res.data.meetingUrl);
      setSessions(list => list.map(x => (x.id === s.id ? { ...x, joinedByMe: true } : x)));
    } catch (err) {
      tab.cancel();
      toast(err.message || 'Could not join the session');
      load();
    } finally {
      setBusy(false);
    }
  };

  const teacherAct = async (action) => {
    setBusy(true);
    const tab = action === 'start' ? openTab() : null;
    try {
      await api.post(`${API_ENDPOINTS.TEACHER_LIVE}/${s.id}/${action}`);
      if (tab) tab.go(s.meetingUrl);
      toast(action === 'start' ? 'Session is live: students were notified' : 'Session ended');
      announceChange('live');
      load();
    } catch (err) {
      tab?.cancel();
      toast(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

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
              <button type="button" className="btn p" disabled={busy} onClick={() => window.open(s.meetingUrl, '_blank', 'noopener,noreferrer')}><Ic as={ExternalLink} />Open meeting</button>
              <button type="button" className="btn o" onClick={() => onAttendance?.(s)}><Ic as={ClipboardCheck} />{s.joined} in</button>
              <button type="button" className="btn o" disabled={busy} onClick={() => teacherAct('end')}><Ic as={Square} />End</button>
            </>
          ) : (
            <button type="button" className="btn p" disabled={busy} onClick={() => teacherAct('start')}><Ic as={Video} />Start &amp; open meeting</button>
          )}
        </div>
      ) : (
        <div className="lvp-act">
          {live ? (
            <button type="button" className="btn p" disabled={busy} onClick={join}><Ic as={Video} />{s.joinedByMe ? 'Rejoin session' : 'Join session'}</button>
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
