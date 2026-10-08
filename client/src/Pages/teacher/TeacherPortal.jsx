import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Users, ClipboardCheck, Library as LibraryIcon, CalendarDays, Inbox as InboxIcon } from 'lucide-react';
import PortalShell from '../../components/portal/PortalShell';
import Seo from '../../components/Seo';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/generated/teacher.css';
import '../../styles/teacher-extra.css';
import Home from './Home';
import Students from './Students';
import Work from './Work';
import Library from './Library';
import Schedule from './Schedule';
import Inbox from './Inbox';
import Settings from './Settings';
import QuickActions from './QuickActions';
import TeacherModals from './modals/TeacherModals';

const TeacherContext = createContext(null);
export const useTeacher = () => useContext(TeacherContext);

const BASE = '/teacher-dashboard';
const TITLES = { '': 'Home', students: 'Students', work: 'Work', library: 'Library', schedule: 'Schedule', inbox: 'Inbox', settings: 'Settings' };

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

/** Teacher portal: Home, Students, Work, Library, Schedule, Inbox (+ Settings behind the profile). */
export default function TeacherPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const me = storedUser();
  const regs = useApi(`${API_ENDPOINTS.REGISTRATION.PENDING}?limit=50`, b => b.data || {});
  const subs = useApi('/api/teacher/submissions?status=needs&limit=1', b => b.data?.counts || {});
  const chats = useApi(`${API_ENDPOINTS.CHAT.BASE}/teacher/students`, b => b.data?.students || []);
  const [modal, setModal] = useState(null);

  const pendingRegs = regs.data?.pagination?.total ?? regs.data?.registrations?.length ?? 0;
  const needsGrading = subs.data?.needs || 0;
  const unreadChats = (chats.data || []).reduce((n, s) => n + (s.unreadCount || 0), 0);

  const refreshBadges = useCallback(() => {
    regs.reload();
    subs.reload();
    chats.reload();
  }, [regs, subs, chats]);

  /** Opens a global modal: { type: 'hw' | 'quiz' | 'announcement' | 'video' | 'note' | 'schedule', props?, onDone? } */
  const openModal = useCallback((type, props = {}) => setModal({ type, ...props }), []);

  const section = location.pathname.replace(BASE, '').split('/')[1] || '';
  const name = [me.firstName, me.lastName].filter(Boolean).join(' ') || 'Teacher';
  const nav = [
    { to: BASE, end: true, label: 'Home', icon: HomeIcon },
    { to: `${BASE}/students`, label: 'Students', icon: Users, badge: pendingRegs },
    { to: `${BASE}/work`, label: 'Work', icon: ClipboardCheck, badge: needsGrading },
    { to: `${BASE}/library`, label: 'Library', icon: LibraryIcon },
    { to: `${BASE}/schedule`, label: 'Schedule', icon: CalendarDays },
    { to: `${BASE}/inbox`, label: 'Inbox', icon: InboxIcon, badge: unreadChats }
  ];

  const ctx = useMemo(() => ({
    base: BASE,
    me: { ...me, name },
    counts: { pendingRegs, needsGrading, unreadChats },
    registrations: regs,
    chats,
    refreshBadges,
    openModal
  }), [pendingRegs, needsGrading, unreadChats, regs, chats, refreshBadges, openModal, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TeacherContext.Provider value={ctx}>
      <Seo title={`${TITLES[section] || 'Teacher'} · Teacher portal`} path={location.pathname} noIndex />
      <PortalShell
        variant="teacher"
        nav={nav}
        title={TITLES[section] || 'Home'}
        tagline="Teacher portal"
        user={{ name, sub: 'Teacher' }}
        meTo={`${BASE}/settings`}
        bell={{ label: pendingRegs ? `${pendingRegs} pending registrations` : 'Registrations', dot: pendingRegs > 0, onClick: () => navigate(`${BASE}/students/registrations`) }}
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="students" element={<Navigate to="all" replace />} />
          <Route path="students/:tab" element={<Students />} />
          <Route path="work" element={<Navigate to="submissions" replace />} />
          <Route path="work/:tab" element={<Work />} />
          <Route path="library" element={<Navigate to="videos" replace />} />
          <Route path="library/:tab" element={<Library />} />
          <Route path="schedule" element={<Navigate to="list" replace />} />
          <Route path="schedule/:tab" element={<Schedule />} />
          <Route path="inbox" element={<Navigate to="announcements" replace />} />
          <Route path="inbox/:tab" element={<Inbox />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to={BASE} replace />} />
        </Routes>
        <QuickActions />
        <TeacherModals modal={modal} onClose={() => setModal(null)} />
      </PortalShell>
    </TeacherContext.Provider>
  );
}
