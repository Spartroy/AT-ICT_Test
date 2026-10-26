import NotificationBell from '../../components/portal/NotificationBell';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, ClipboardCheck, CalendarDays, Inbox as InboxIcon, Star, CircleHelp } from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import Seo from '../../components/Seo';
import '../../styles/generated/student.css';
import '../../styles/student-extra.css';
import Home from './Home';
import Learn from './Learn';
import Work from './Work';
import Schedule from './Schedule';
import Inbox from './Inbox';
import Tour from '../../components/portal/Tour';
import { studentTourSteps } from './tourSteps';
import LiveClassPopup from '../../components/portal/LiveClassPopup';
import { LiveFeedProvider } from '../../components/portal/LiveFeed';

const StudentContext = createContext(null);
export const useStudent = () => useContext(StudentContext);

const TITLES = { '': 'Home', learn: 'Learn', work: 'Work', schedule: 'Schedule', inbox: 'Inbox' };
const BASE = '/student-dashboard';
const tourKey = (id) => `atict:tour:student:v1:${id || 'anon'}`;
const tourSeen = (id) => {
  try { return !!localStorage.getItem(tourKey(id)); } catch { return true; }
};
const markTourSeen = (id) => {
  try { localStorage.setItem(tourKey(id), '1'); } catch { /* the tour just shows again next time */ }
};

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

/** Student portal: Home, Learn, Work, Schedule, Inbox (design/AT-ICT Student Portal v2.html). */
export default function StudentPortal() {
  const location = useLocation();
  const dashboard = useApi(API_ENDPOINTS.STUDENT.DASHBOARD);
  const leaderboard = useApi(API_ENDPOINTS.LEADERBOARD.BASE, b => b.data?.leaderboard || []);

  const me = storedUser();
  const student = dashboard.data?.student;
  const stats = dashboard.data?.stats;
  const info = student?.studentInfo || {};
  const name = [student?.firstName || me.firstName, student?.lastName || me.lastName].filter(Boolean).join(' ') || 'Student';
  const group = dashboard.data?.group || null;
  const sub = ['IGCSE', info.year ? `Year ${info.year}` : info.royalClass ? `Class ${info.royalClass}` : null, group?.name].filter(Boolean).join(' · ');

  const pendingWork = (stats?.assignments?.pendingAssignments || 0) + (stats?.quizzes?.pendingQuizzes || 0);
  const unread = (stats?.announcements?.unreadAnnouncements || 0) + (stats?.unreadMessages || 0);
  const points = info.points?.currentSession || 0;
  const topPoints = Math.max(points, ...(leaderboard.data || []).map(l => l.points || 0), 1);
  const sessionLabel = info.points?.sessionLabel || info.session || '';

  const section = location.pathname.replace(BASE, '').split('/')[1] || '';
  const nav = [
    { to: BASE, end: true, label: 'Home', icon: HomeIcon },
    { to: `${BASE}/learn`, label: 'Learn', icon: BookOpen, tour: 'nav-learn' },
    { to: `${BASE}/work`, label: 'Work', icon: ClipboardCheck, badge: pendingWork, tour: 'nav-work' },
    { to: `${BASE}/schedule`, label: 'Schedule', icon: CalendarDays, tour: 'nav-schedule' },
    { to: `${BASE}/inbox`, label: 'Inbox', icon: InboxIcon, badge: unread, tour: 'nav-inbox' }
  ];

  // First visit: the tour starts by itself once the dashboard has loaded. The ? button replays it.
  const userId = student?._id || me.id || me._id;
  const [tourOpen, setTourOpen] = useState(false);
  const firstName = student?.firstName || me.firstName;
  const tourSteps = useMemo(() => studentTourSteps(firstName), [firstName]);
  useEffect(() => {
    if (dashboard.loading || !userId || tourSeen(userId)) return undefined;
    const t = setTimeout(() => setTourOpen(true), 700);
    return () => clearTimeout(t);
  }, [dashboard.loading, userId]);
  const closeTour = useCallback(() => { markTourSeen(userId); setTourOpen(false); }, [userId]);

  const ctx = useMemo(() => ({
    base: BASE,
    me: { ...me, _id: student?._id || me.id || me._id, name, firstName: student?.firstName || me.firstName || 'there' },
    student,
    group,
    stats,
    dashboard,
    leaderboard
  }), [student, group, stats, dashboard, leaderboard, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StudentContext.Provider value={ctx}>
      <Seo title={`${TITLES[section] || 'Student'} · Student portal`} path={location.pathname} noIndex />
      <PortalShell
        variant="student"
        nav={nav}
        title={TITLES[section] || 'Home'}
        user={{ name, sub }}
        bellSlot={(
          <>
            <button type="button" className="ib tour-help" aria-label="Take the portal tour" title="Take the portal tour" onClick={() => setTourOpen(true)}>
              <CircleHelp className="i" aria-hidden="true" />
            </button>
            <span className="tour-bell" data-tour="bell"><NotificationBell /></span>
          </>
        )}
        aside={
          <div className="pts">
            <small>My points{sessionLabel ? ` · ${sessionLabel}` : ''}</small>
            <b><Star className="i" aria-hidden="true" />{points} <span className="pts-unit">pts</span></b>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={topPoints} aria-valuenow={points} aria-label="Points compared with the leader">
              <i style={{ width: `${Math.max(4, (points / topPoints) * 100)}%` }} />
            </div>
            <small className="pts-hint">Complete work to climb the board</small>
          </div>
        }
      >
        <LiveFeedProvider role="student">
        <Routes>
          <Route index element={<Home />} />
          <Route path="learn" element={<Navigate to="materials" replace />} />
          <Route path="learn/:tab" element={<Learn />} />
          <Route path="work" element={<Navigate to="assignments" replace />} />
          <Route path="work/:tab" element={<Work />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="inbox" element={<Navigate to="announcements" replace />} />
          <Route path="inbox/:tab" element={<Inbox />} />
          <Route path="*" element={<Navigate to={BASE} replace />} />
        </Routes>
        <Tour open={tourOpen} steps={tourSteps} base={BASE} onClose={closeTour} />
        <LiveClassPopup scheduleHref={`${BASE}/schedule`} />
        </LiveFeedProvider>
      </PortalShell>
    </StudentContext.Provider>
  );
}
