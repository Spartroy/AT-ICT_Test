import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Inbox as InboxIcon, MessageSquare } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { ErrorNote, Loading, PageHead, Seg } from '../../components/portal/kit';
import AnnouncementFeed from '../../components/portal/AnnouncementFeed';
import ChatPanel from '../../components/portal/ChatPanel';
import { useStudent } from './StudentPortal';

const TABS = [
  { id: 'announcements', label: 'Announcements', icon: InboxIcon },
  { id: 'chat', label: 'Chat', icon: MessageSquare }
];

export default function Inbox() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, stats, dashboard } = useStudent();
  if (!TABS.some(t => t.id === tab)) return <Navigate to={`${base}/inbox/announcements`} replace />;
  const tabs = TABS.map(t => ({ ...t, count: t.id === 'chat' ? stats?.unreadMessages || '' : '' }));

  return (
    <>
      <PageHead eyebrow="Stay in the loop" title="Inbox" />
      <Seg tabs={tabs} value={tab} onChange={id => navigate(`${base}/inbox/${id}`)} label="Inbox sections" />
      {tab === 'announcements' ? <AnnouncementFeed /> : <StudentChat onRead={dashboard.reload} />}
    </>
  );
}

function StudentChat({ onRead }) {
  const teacher = useApi(`${API_ENDPOINTS.CHAT.BASE}/student/teacher`, b => b.data || {});
  if (teacher.loading && !teacher.data) return <Loading label="Loading chat…" />;
  if (teacher.error) return <ErrorNote error={teacher.error} onRetry={teacher.reload} />;
  const t = teacher.data?.teacher;
  const threads = t ? [{ id: String(t.id), name: t.fullName, sub: 'Teacher · direct', unread: teacher.data.unreadCount || 0 }] : [];
  return <ChatPanel threads={threads} emptyText="Your teacher's chat isn't available yet." onRead={() => setTimeout(onRead, 1000)} />;
}
