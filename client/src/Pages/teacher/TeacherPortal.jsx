import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, ClipboardCheck, Library as LibraryIcon, CalendarDays, Inbox as InboxIcon, Wallet } from 'lucide-react';
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
import Income from './Income';
import Inbox from './Inbox';
import Settings from './Settings';
import QuickActions from './QuickActions';
import NotificationBell from '../../components/portal/NotificationBell';
import TeacherModals from './modals/TeacherModals';
import LiveClassPopup from '../../components/portal/LiveClassPopup';
import { LiveFeedProvider } from '../../components/portal/LiveFeed';
import { ASSISTANT_BASE, assistantNavItems, hasLevel, normalizePermissions } from '../assistant/access';
import { AssistantAccount, AssistantHome } from '../assistant/AssistantPages';

const TeacherContext = createContext(null);
export const useTeacher = () => useContext(TeacherContext);

const BASE = '/teacher-dashboard';
const TITLES = { '': 'Home', students: 'Students', work: 'Work', library: 'Library', schedule: 'Schedule', income: 'Income', inbox: 'Inbox', settings: 'Settings', account: 'My account' };
/** Which permission area each global dialog needs (null = the teacher only). */
const MODAL_AREA = { hw: 'work', quiz: 'work', announcement: 'inbox', video: 'library', note: 'library', material: 'library', flashcard: 'library', schedule: 'schedule', assign: 'schedule', live: 'schedule', attendance: 'schedule', sample: null };
const NAV_ICONS ={ students: Users, work: ClipboardCheck, library: LibraryIcon, schedule: CalendarDays, inbox: InboxIcon };

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

/**
 * Teacher portal: Home, Students, Work, Library, Schedule, Inbox (+ Settings behind the profile).
 * With `assistant` it is the Assistant portal: the same pages, but only the areas the teacher granted
 * (read live from the server), no Income/Settings/Registrations, and edit controls only where allowed.
 */
export default function TeacherPortal({ assistant = false }) {
  const location = useLocation();
  const me = storedUser();
  const base = assistant ? ASSISTANT_BASE : BASE;
  const mine = useApi(assistant ? '/api/assistant/me' : null, b => b.data?.assistant || {});
  const permissions = useMemo(
    () => (assistant ? normalizePermissions(mine.data?.permissions || me.roleData?.permissions) : null),
    [assistant, mine.data] // eslint-disable-line react-hooks/exhaustive-deps
  );
  /** Teachers can do everything; assistants need at least `level` on `area`. */
  const can = useCallback((area, level = 'view') => !assistant || hasLevel(permissions, area, level), [assistant, permissions]);

  const regs = useApi(assistant ? null : `${API_ENDPOINTS.REGISTRATION.PENDING}?limit=50`, b => b.data || {});
  const subs = useApi(can('work') ? '/api/teacher/submissions?status=needs&limit=1' : null, b => b.data?.counts || {});
  const proofs = useApi(assistant ? null : '/api/teacher/income/proofs', b => b.data?.proofs || []);
  const chats = useApi(can('inbox') ? `${API_ENDPOINTS.CHAT.BASE}/teacher/students` : null, b => b.data?.students || []);
  const [modal, setModal] = useState(null);

  const pendingRegs = regs.data?.pagination?.total ?? regs.data?.registrations?.length ?? 0;
  const needsGrading = subs.data?.needs || 0;
  const proofsWaiting = (proofs.data || []).length;
  const unreadChats = (chats.data || []).reduce((n, s) => n + (s.unreadCount || 0), 0);

  const refreshBadges = useCallback(() => {
    regs.reload();
    subs.reload();
    chats.reload();
    proofs.reload();
  }, [regs, subs, chats, proofs]);

  /** Opens a global modal: { type: 'hw' | 'quiz' | 'announcement' | 'video' | 'note' | 'schedule', props?, onDone? } */
  const openModal = useCallback((type, props = {}) => {
    const area = MODAL_AREA[type];
    // A view-only assistant who reaches an editing dialog gets a short explanation instead
    if (area !== undefined && !can(area, 'edit')) return setModal({ type: 'denied', area });
    return setModal({ type, ...props });
  }, [can]);

  const section = location.pathname.replace(base, '').split('/')[1] || '';
  const name = [me.firstName, me.lastName].filter(Boolean).join(' ') || (assistant ? 'Assistant' : 'Teacher');
  const badges = { work: needsGrading, inbox: unreadChats };
  const nav = assistant ? assistantNavItems(permissions, base).map(n => ({ ...n, icon: NAV_ICONS[n.area] || HomeIcon, badge: badges[n.area] })) : [
    { to: BASE, end: true, label: 'Home', icon: HomeIcon },
    { to: `${BASE}/students`, label: 'Students', icon: Users, badge: pendingRegs },
    { to: `${BASE}/work`, label: 'Work', icon: ClipboardCheck, badge: needsGrading },
    { to: `${BASE}/library`, label: 'Library', icon: LibraryIcon },
    { to: `${BASE}/schedule`, label: 'Schedule', icon: CalendarDays },
    { to: `${BASE}/income`, label: 'Income', icon: Wallet, badge: proofsWaiting },
    { to: `${BASE}/inbox`, label: 'Inbox', icon: InboxIcon, badge: unreadChats }
  ];

  const ctx = useMemo(() => ({
    base,
    assistant: assistant ? { permissions } : null,
    can,
    me: { ...me, name },
    counts: { pendingRegs, needsGrading, unreadChats, proofs: proofsWaiting },
    registrations: regs,
    chats,
    refreshBadges,
    openModal
  }), [base, assistant, permissions, can, pendingRegs, needsGrading, unreadChats, proofsWaiting, regs, chats, refreshBadges, openModal, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TeacherContext.Provider value={ctx}>
      <Seo title={`${TITLES[section] || (assistant ? 'Assistant' : 'Teacher')} · ${assistant ? 'Assistant' : 'Teacher'} portal`} path={location.pathname} noIndex />
      <PortalShell
        variant="teacher"
        nav={nav}
        title={TITLES[section] || 'Home'}
        tagline={assistant ? 'Assistant portal' : 'Teacher portal'}
        user={{ name, sub: assistant ? 'Assistant' : 'Teacher' }}
        meTo={assistant ? `${base}/account` : `${base}/settings`}
        bellSlot={<NotificationBell />}
      >
        <LiveFeedProvider role="teacher" disabled={!can('schedule')}>
        <Routes>
          <Route index element={assistant ? <AssistantHome /> : <Home />} />
          {can('students') && <Route path="students" element={<Navigate to="all" replace />} />}
          {can('students') && <Route path="students/:tab" element={<Students />} />}
          {can('work') && <Route path="work" element={<Navigate to="submissions" replace />} />}
          {can('work') && <Route path="work/:tab" element={<Work />} />}
          {can('library') && <Route path="library" element={<Navigate to="videos" replace />} />}
          {can('library') && <Route path="library/:tab" element={<Library />} />}
          {can('schedule') && <Route path="schedule" element={<Navigate to="list" replace />} />}
          {can('schedule') && <Route path="schedule/:tab" element={<Schedule />} />}
          {!assistant && <Route path="income" element={<Navigate to="overview" replace />} />}
          {!assistant && <Route path="income/:tab" element={<Income />} />}
          {can('inbox') && <Route path="inbox" element={<Navigate to="announcements" replace />} />}
          {can('inbox') && <Route path="inbox/:tab" element={<Inbox />} />}
          {assistant ? <Route path="account" element={<AssistantAccount />} /> : <Route path="settings" element={<Settings />} />}
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
        {can('schedule') && <LiveClassPopup hideAt={base} scheduleHref={`${base}/schedule/week`} onAttendance={(session) => openModal('attendance', { session })} />}
        </LiveFeedProvider>
        {!assistant && <QuickActions />}
        <TeacherModals modal={modal} onClose={() => setModal(null)} />
      </PortalShell>
    </TeacherContext.Provider>
  );
}
