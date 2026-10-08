import React, { createContext, useContext, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

const StudentContext = createContext(null);
export const useStudent = () => useContext(StudentContext);

const TITLES = { '': 'Home', learn: 'Learn', work: 'Work', schedule: 'Schedule', inbox: 'Inbox' };
const BASE = '/student-dashboard';

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
  const navigate = useNavigate();
  const dashboard = useApi(API_ENDPOINTS.STUDENT.DASHBOARD);
  const leaderboard = useApi(API_ENDPOINTS.LEADERBOARD.BASE, b => b.data?.leaderboard || []);

  const me = storedUser();
  const student = dashboard.data?.student;
  const stats = dashboard.data?.stats;
  const info = student?.studentInfo || {};
  const name = [student?.firstName || me.firstName, student?.lastName || me.lastName].filter(Boolean).join(' ') || 'Student';
  const sub = ['IGCSE', info.year ? `Year ${info.year}` : info.royalClass ? `Class ${info.royalClass}` : null].filter(Boolean).join(' · ');

  const pendingWork = (stats?.assignments?.pendingAssignments || 0) + (stats?.quizzes?.pendingQuizzes || 0);
  const unread = (stats?.announcements?.unreadAnnouncements || 0) + (stats?.unreadMessages || 0);
  const points = info.points?.currentSession || 0;
  const topPoints = Math.max(points, ...(leaderboard.data || []).map(l => l.points || 0), 1);
  const sessionLabel = info.points?.sessionLabel || info.session || '';

  const section = location.pathname.replace(BASE, '').split('/')[1] || '';
  const nav = [
    { to: BASE, end: true, label: 'Home', icon: HomeIcon },
    { to: `${BASE}/learn`, label: 'Learn', icon: BookOpen },
    { to: `${BASE}/work`, label: 'Work', icon: ClipboardCheck, badge: pendingWork },
    { to: `${BASE}/schedule`, label: 'Schedule', icon: CalendarDays },
    { to: `${BASE}/inbox`, label: 'Inbox', icon: InboxIcon, badge: unread }
  ];

  const ctx = useMemo(() => ({
    base: BASE,
    me: { ...me, _id: student?._id || me.id || me._id, name, firstName: student?.firstName || me.firstName || 'there' },
    student,
    stats,
    dashboard,
    leaderboard
  }), [student, stats, dashboard, leaderboard, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StudentContext.Provider value={ctx}>
      <Seo title={`${TITLES[section] || 'Student'} · Student portal`} path={location.pathname} noIndex />
      <PortalShell
        variant="student"
        nav={nav}
        title={TITLES[section] || 'Home'}
        user={{ name, sub }}
        bell={{ label: unread ? `${unread} unread in Inbox` : 'Inbox', dot: unread > 0, onClick: () => navigate(`${BASE}/inbox`) }}
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
      </PortalShell>
    </StudentContext.Provider>
  );
}
