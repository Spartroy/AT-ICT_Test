import NotificationBell from '../../components/portal/NotificationBell';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, ClipboardCheck, CalendarDays, Inbox as InboxIcon, Star } from 'lucide-react';
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
import TourHelp from '../../components/portal/TourHelp';
import PointsGuide from './PointsGuide';
import PointsCelebration from './PointsCelebration';
import { fireConfetti } from '../../components/auth/confetti';
import { POINTS_EVENT } from './pointsEvents';
import { useToast } from '../../components/portal/PortalUI';
import { tourPlan } from './tourPlan';
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
const helpKey = (id) => `atict:tour:help:${id || 'anon'}`;
const helpUsed = (id) => {
  try { return !!localStorage.getItem(helpKey(id)); } catch { return false; }
};
const GUIDE_SEEN = 'atict:points-guide:seen:';
const guideSeen = (id) => { try { return !!localStorage.getItem(GUIDE_SEEN + (id || 'anon')); } catch { return true; } };
const markGuideSeen = (id) => { try { localStorage.setItem(GUIDE_SEEN + (id || 'anon'), '1'); } catch { /* shows again */ } };
const HINT_SESSION = 'atict:tour:hint-dismissed';
const hintDismissedThisSession = () => {
  try { return !!sessionStorage.getItem(HINT_SESSION); } catch { return false; }
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

  // The tour starts by itself on the very first login (and can't be skipped). For the first 6 logins the ? button
  // gets a halo and a "need help?" bubble. After that the ? button still replays the tour.
  const userId = student?._id || me.id || me._id;
  const loginCount = info.loginCount;
  const [tourOpen, setTourOpen] = useState(false);
  const [tourForced, setTourForced] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [hintGone, setHintGone] = useState(hintDismissedThisSession);
  const [helped, setHelped] = useState(() => helpUsed(userId));
  const firstName = student?.firstName || me.firstName;
  const tourSteps = useMemo(() => studentTourSteps(firstName), [firstName]);
  const plan = tourPlan({ loginCount, seen: tourSeen(userId), helpUsed: helped, hintDismissed: hintGone, justFinished });
  useEffect(() => {
    if (dashboard.loading || !userId || !plan.autoStart) return undefined;
    const t = setTimeout(() => { setTourForced(true); setTourOpen(true); }, 700);
    return () => clearTimeout(t);
  }, [dashboard.loading, userId, plan.autoStart]);
  const [guideOpen, setGuideOpen] = useState(false);
  // The points intro: shown once, right after the first tour. Anyone can reopen it from the points card.
  const closeTour = useCallback((completed) => {
    markTourSeen(userId);
    setTourOpen(false);
    setTourForced(false);
    if (completed) {
      setJustFinished(true);
      if (!guideSeen(userId)) setTimeout(() => setGuideOpen(true), 450);
    }
  }, [userId]);
  const closeGuide = useCallback(() => { markGuideSeen(userId); setGuideOpen(false); }, [userId]);
  const openTourFromHelp = useCallback(() => {
    try { localStorage.setItem(helpKey(userId), '1'); } catch { /* the hint may show again */ }
    setHelped(true);
    setTourForced(false);
    setTourOpen(true);
  }, [userId]);
  const dismissHint = useCallback(() => {
    try { sessionStorage.setItem(HINT_SESSION, '1'); } catch { /* shows again on reload */ }
    setHintGone(true);
  }, []);

  const ctx = useMemo(() => ({
    base: BASE,
    me: { ...me, _id: student?._id || me.id || me._id, name, firstName: student?.firstName || me.firstName || 'there' },
    student,
    group,
    stats,
    dashboard,
    leaderboard,
    openPointsGuide: () => setGuideOpen(true)
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
            <TourHelp hint={plan.showHint && !tourOpen} onOpen={openTourFromHelp} onDismiss={dismissHint} />
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
            <button type="button" className="pts-how" onClick={() => setGuideOpen(true)}>How points work →</button>
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
        <PointsWatcher onEarned={dashboard.reload} />
        {me._id && <PointsCelebration userId={me._id} />}
        <PointsGuide open={guideOpen} onClose={closeGuide} />
        <Tour open={tourOpen} steps={tourSteps} base={BASE} onClose={closeTour} forced={tourForced} />
        <LiveClassPopup scheduleHref={`${BASE}/schedule`} />
        </LiveFeedProvider>
      </PortalShell>
    </StudentContext.Provider>
  );
}

/** Shows "+n pts" when something earns points and refreshes the totals in the sidebar. Lives inside the portal shell for the toast. */
function PointsWatcher({ onEarned }) {
  const toast = useToast();
  useEffect(() => {
    const on = (e) => {
      const n = e.detail?.points || 0;
      if (n > 0) {
        toast(`+${n} point${n === 1 ? '' : 's'}`);
        fireConfetti(undefined, { scale: Math.min(0.6, 0.2 + n / 100) });
      }
      onEarned?.();
    };
    window.addEventListener(POINTS_EVENT, on);
    return () => window.removeEventListener(POINTS_EVENT, on);
  }, [toast, onEarned]);
  return null;
}
