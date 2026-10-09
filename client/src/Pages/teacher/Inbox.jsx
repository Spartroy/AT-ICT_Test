import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Megaphone, MessageSquare, Wifi, Plus, CheckCircle2, Pin, AlertTriangle, CalendarDays, Users, Eye, Pencil, Trash2, LogOut, Ban } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Chips, Empty, ErrorNote, Ic, Loading, PageHead, SearchBox, Seg, Stat, fmtDateTime, initials } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import ChatPanel from '../../components/portal/ChatPanel';
import { useTeacher } from './TeacherPortal';
import { apiError, useTeacherChange } from './modals/form';

const AUDIENCE = { all: 'Everyone', students: 'Students', parents: 'Parents', specific: 'Specific' };

export default function Inbox() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, counts, openModal } = useTeacher();
  if (!['announcements', 'chat', 'sessions'].includes(tab)) return <Navigate to={`${base}/inbox/announcements`} replace />;
  return (
    <>
      <PageHead
        title="Inbox"
        actions={tab === 'announcements' && <button type="button" className="btn p" onClick={() => openModal('announcement')}><Ic as={Plus} />Create announcement</button>}
      />
      <Seg
        tabs={[
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'chat', label: 'Chat', icon: MessageSquare, count: counts.unreadChats || '' },
          { id: 'sessions', label: 'Sessions', icon: Wifi }
        ]}
        value={tab}
        onChange={id => navigate(`${base}/inbox/${id}`)}
        label="Inbox sections"
      />
      {tab === 'announcements' && <Announcements />}
      {tab === 'chat' && <TeacherChat />}
      {tab === 'sessions' && <Sessions />}
    </>
  );
}

function Announcements() {
  const { openModal } = useTeacher();
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi(`${API_ENDPOINTS.ANNOUNCEMENTS.MANAGEMENT}/all?limit=100`, b => b.data?.announcements || []);
  useTeacherChange('announcement', list.reload);
  if (list.loading && !list.data) return <Loading label="Loading announcements…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];

  const remove = async (a) => {
    if (!(await confirm({ title: 'Delete this announcement?', body: a.title, confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${a._id}`);
      toast('Deleted');
      list.reload();
    } catch (err) { toast(apiError(err)); }
  };

  return (
    <>
      <div className="g4">
        <Stat icon={Megaphone} label="Total" value={items.length} />
        <Stat icon={CheckCircle2} label="Published" value={items.filter(a => a.isPublished !== false).length} />
        <Stat icon={Pin} label="Pinned" value={items.filter(a => a.isPinned).length} />
        <Stat icon={AlertTriangle} label="Urgent" value={items.filter(a => a.priority === 'urgent').length} />
      </div>
      {!items.length && <div className="card"><Empty icon={Megaphone}>No announcements yet.</Empty></div>}
      {items.map(a => (
        <div className="card ann-c" key={a._id}>
          <div className="ann-c__head">
            <h3 style={{ margin: 0 }}>{a.title}</h3>
            <span className="chip c-th">{a.type}</span>
            <span className={`chip ${a.priority === 'urgent' || a.priority === 'high' ? 'c-rd' : 'c-am'}`}>{a.priority}</span>
            {a.isPinned && <span className="chip c-gy">Pinned</span>}
            <span className="lact" style={{ marginLeft: 'auto' }}>
              <button type="button" className="ib sm" aria-label={`Edit ${a.title}`} onClick={() => openModal('announcement', { announcement: a })}><Ic as={Pencil} /></button>
              <button type="button" className="ib sm dng" aria-label={`Delete ${a.title}`} onClick={() => remove(a)}><Ic as={Trash2} /></button>
            </span>
          </div>
          <p className="sub clamp2" style={{ margin: '8px 0' }}>{a.content}</p>
          <div className="rg-m">
            <span><Ic as={CalendarDays} />{fmtDateTime(a.createdAt)}</span>
            <span><Ic as={Users} />{AUDIENCE[a.targetAudience] || a.targetAudience}</span>
            <span><Ic as={Eye} />{a.readBy?.length || 0} views</span>
          </div>
        </div>
      ))}
    </>
  );
}

function TeacherChat() {
  const { chats, refreshBadges } = useTeacher();
  if (chats.loading && !chats.data) return <Loading label="Loading chat…" />;
  if (chats.error) return <ErrorNote error={chats.error} onRetry={chats.reload} />;
  const threads = (chats.data || []).map(s => ({
    id: String(s.id),
    name: s.fullName,
    sub: s.lastMessage ? `${s.lastMessage.isFromCurrentUser ? 'You: ' : ''}${s.lastMessage.content || 'Attachment'}` : 'Student',
    unread: s.unreadCount || 0
  }));
  return <ChatPanel broadcast threads={threads} emptyText="No students to chat with yet." onRead={() => setTimeout(refreshBadges, 1000)} />;
}

function Sessions() {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi(API_ENDPOINTS.TEACHER_SESSIONS.STUDENTS, b => b.data || {});
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  if (list.loading && !list.data) return <Loading label="Loading sessions…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const students = list.data?.students || [];
  const online = students.filter(s => s.activeSessionCount > 0);
  const shown = students.filter(s => (filter === 'All' || (filter === 'Online') === (s.activeSessionCount > 0)) && `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q.toLowerCase()));

  const end = async (s) => {
    if (!(await confirm({ title: `End ${s.firstName}'s session${s.activeSessionCount > 1 ? 's' : ''}?`, body: 'They will be signed out on every device.', confirmLabel: 'End session' }))) return;
    try {
      await api.del(`${API_ENDPOINTS.TEACHER_SESSIONS.BASE}/students/${s.id}/all`);
      toast('Session ended');
      list.reload();
    } catch (err) { toast(apiError(err)); }
  };

  return (
    <>
      <div className="g4">
        <Stat icon={Users} label="Total students" value={students.length} />
        <Stat icon={Wifi} label="Active sessions" value={online.reduce((n, s) => n + s.activeSessionCount, 0)} />
        <Stat icon={CheckCircle2} label="Online students" value={online.length} />
        <Stat icon={Ban} label="Offline students" value={students.length - online.length} />
      </div>
      <div className="fbar">
        <Chips items={['All', 'Online', 'Offline'].map(c => ({ id: c, label: c }))} value={filter} onChange={setFilter} label="Session filter" style={{ margin: 0 }} />
        <SearchBox value={q} onChange={setQ} placeholder="Search student…" style={{ margin: 0, flex: 1, minWidth: 200 }} />
      </div>
      <div className="card" style={{ padding: 8 }}>
        {!shown.length && <Empty icon={Users}>No students match.</Empty>}
        {shown.map(s => {
          const on = s.activeSessionCount > 0;
          return (
            <div className="srow2" key={s.id}>
              <span className="av" style={{ width: 40, height: 40 }} aria-hidden="true">{initials(`${s.firstName} ${s.lastName}`)}<i className={`dotp ${on ? 'on' : ''}`} /></span>
              <div className="lmain"><b>{s.firstName} {s.lastName}</b><small>{s.email}</small></div>
              <span className="en-c">{s.lastLogin ? fmtDateTime(s.lastLogin) : 'Never logged in'}</span>
              <span className={`chip ${on ? 'c-pr' : 'c-gy'}`}>{on ? `${s.activeSessionCount} session${s.activeSessionCount > 1 ? 's' : ''}` : 'Offline'}</span>
              {on ? <button type="button" className="ib sm dng" aria-label={`End ${s.firstName}'s session`} onClick={() => end(s)}><Ic as={LogOut} /></button> : <span style={{ width: 36 }} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
