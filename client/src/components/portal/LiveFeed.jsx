import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import openTab from '../../lib/openTab';
import { useToast } from './PortalUI';
import { announceChange } from '../../Pages/teacher/modals/form';
import { announcePoints } from '../../Pages/student/pointsEvents';

const POLL_MS = 20000;
export const SOON_MS = 15 * 60 * 1000;

const Ctx = createContext(null);

/**
 * One shared copy of the live-class list for a portal (popup, dashboard card and schedule all read it).
 * Student: the classes that are live or about to start. Teacher: every class (live, upcoming, past).
 */
export function LiveFeedProvider({ role, children }) {
  const teacher = role === 'teacher';
  const [state, setState] = useState({ sessions: [], loading: true, error: null });
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      const res = await api.get(teacher ? API_ENDPOINTS.TEACHER_LIVE : API_ENDPOINTS.LIVE.CURRENT);
      setState({ sessions: res.data?.sessions || [], loading: false, error: null });
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: s.sessions.length ? null : error })); // keep what we have when offline
    }
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

  const value = useMemo(() => ({ role, ...state, now, reload: load, setSessions: (fn) => setState(s => ({ ...s, sessions: fn(s.sessions) })) }), [role, state, now, load]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLiveFeed = () => useContext(Ctx) || { role: null, sessions: [], loading: false, error: null, now: new Date(), reload: () => {}, setSessions: () => {} };

/** The class to feature: the one that is live, else the next one starting soon (teacher: next upcoming). */
export function useFeaturedSession() {
  const { role, sessions, now } = useLiveFeed();
  return useMemo(() => {
    const live = sessions.find(s => s.status === 'live');
    if (live) return live;
    const t = now.getTime();
    const upcoming = sessions
      .filter(s => s.status === 'scheduled' && t - new Date(s.startsAt) <= 3 * 3600 * 1000)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    if (role === 'teacher') return upcoming[0];
    return upcoming.find(s => new Date(s.startsAt) - t <= SOON_MS);
  }, [role, sessions, now]);
}

export const clock = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export function startsIn(startsAt, now) {
  const mins = Math.round((new Date(startsAt) - now) / 60000);
  if (mins <= 0) return 'Starting now';
  if (mins < 60) return `Starts in ${mins} min`;
  const d = new Date(startsAt);
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? `Starts at ${clock(d)}` : `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${clock(d)}`;
}

/** Join / start / end, shared by the popup and the dashboard cards. The meeting tab opens inside the click so blockers allow it. */
export function useLiveActions() {
  const toast = useToast();
  const { reload, setSessions } = useLiveFeed();
  const [busy, setBusy] = useState(false);

  const join = useCallback(async (s) => {
    setBusy(true);
    const tab = openTab();
    try {
      const res = await api.post(`${API_ENDPOINTS.LIVE.BASE}/${s.id}/join`);
      tab.go(res.data.meetingUrl);
      announcePoints(res.data.points);
      setSessions(list => list.map(x => (x.id === s.id ? { ...x, joinedByMe: true } : x)));
    } catch (err) {
      tab.cancel();
      toast(err.message || 'Could not join the session');
      reload();
    } finally {
      setBusy(false);
    }
  }, [toast, reload, setSessions]);

  const teacherAct = useCallback(async (s, action) => {
    setBusy(true);
    const tab = action === 'start' ? openTab() : null;
    try {
      await api.post(`${API_ENDPOINTS.TEACHER_LIVE}/${s.id}/${action}`);
      if (tab) tab.go(s.meetingUrl);
      toast(action === 'start' ? 'Session is live: students were notified' : 'Session ended');
      announceChange('live');
      reload();
    } catch (err) {
      tab?.cancel();
      toast(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }, [toast, reload]);

  return { busy, join, start: (s) => teacherAct(s, 'start'), end: (s) => teacherAct(s, 'end') };
}
