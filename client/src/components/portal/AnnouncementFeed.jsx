import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, Eye, Heart, MessageSquare, Megaphone, Pin, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Chips, Empty, ErrorNote, Ic, Loading, SearchBox, fmtDate, initials } from './kit';
import { Dialog, useToast } from './PortalUI';

export const ANN_TYPES = ['general', 'assignment', 'exam', 'holiday', 'deadline', 'meeting', 'important'];
const PRIORITY_CHIP = { urgent: 'c-rd', high: 'c-rd', medium: 'c-am', low: 'c-gy' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

const myId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return String(u?._id || u?.id || '');
  } catch {
    return '';
  }
};
const authorOf = (a) => (a.createdBy ? `${a.createdBy.firstName || ''} ${a.createdBy.lastName || ''}`.trim() : 'AT-ICT');
const likedBy = (a, me) => (a.likes || []).some(l => String(l.user?._id || l.user) === me);

/** Read-only announcement feed for students and parents. ?open=<id> opens one directly. */
export default function AnnouncementFeed() {
  const feed = useApi(API_ENDPOINTS.ANNOUNCEMENTS.BASE, b => b.data?.announcements || []);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const id = params.get('open');
    if (id) {
      setOpenId(id);
      params.delete('open');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const list = useMemo(() => [...(feed.data || [])].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)), [feed.data]);
  const counts = useMemo(() => Object.fromEntries(ANN_TYPES.map(t => [t, list.filter(a => a.type === t).length])), [list]);
  const shown = list.filter(a => (type === 'all' || a.type === type) && `${a.title} ${a.content}`.toLowerCase().includes(q.trim().toLowerCase()));

  if (feed.loading && !feed.data) return <Loading label="Loading announcements…" />;
  if (feed.error) return <ErrorNote error={feed.error} onRetry={feed.reload} />;

  const chips = [{ id: 'all', label: 'All', count: list.length }, ...ANN_TYPES.filter(t => counts[t]).map(t => ({ id: t, label: cap(t), count: counts[t] }))];
  const me = myId();

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Search announcements…" />
      <Chips items={chips} value={type} onChange={setType} label="Announcement type" />
      {!shown.length && <Empty icon={Megaphone}>{list.length ? 'No announcements match.' : 'No announcements yet.'}</Empty>}
      {shown.map(a => (
        <button type="button" className="ann" key={a._id} onClick={() => setOpenId(a._id)}>
          <h4>
            <Ic as={a.isPinned ? Pin : Info} /> {a.title}
            <span className="chip c-th">{cap(a.type)}</span>
            {a.priority && a.priority !== 'medium' && <span className={`chip ${PRIORITY_CHIP[a.priority]}`}>{a.priority}</span>}
          </h4>
          <p className="clamp2">{a.content}</p>
          <div className="m">
            <span>{fmtDate(a.createdAt)}</span>
            <span>{authorOf(a)}</span>
            <span aria-label={`${a.readBy?.length || 0} views`}><Ic as={Eye} />{a.readBy?.length || 0}</span>
            <span aria-label={`${a.likes?.length || 0} likes`}><Ic as={Heart} />{a.likes?.length || 0}</span>
            <span aria-label={`${a.comments?.length || 0} comments`}><Ic as={MessageSquare} />{a.comments?.length || 0}</span>
          </div>
        </button>
      ))}
      <AnnouncementDialog
        id={openId}
        initial={list.find(a => a._id === openId)}
        me={me}
        onClose={() => setOpenId(null)}
        onChange={updated => feed.setData(d => (d || []).map(a => (a._id === updated._id ? { ...a, ...updated } : a)))}
      />
    </>
  );
}

function AnnouncementDialog({ id, initial, me, onClose, onChange }) {
  const [a, setA] = useState(initial);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setA(initial);
    setComment('');
    if (!id) return;
    api.get(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${id}`)
      .then(res => setA(res.data?.announcement))
      .catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id || !a) return null;
  const liked = likedBy(a, me);

  const like = async () => {
    try {
      const res = await api.put(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${a._id}/like`);
      const likes = res.data?.hasLiked ? [...(a.likes || []), { user: me }] : (a.likes || []).filter(l => String(l.user?._id || l.user) !== me);
      const next = { ...a, likes };
      setA(next);
      onChange(next);
    } catch (err) {
      toast(err.message || "Couldn't update your like");
    }
  };

  const post = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.post(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${a._id}/comments`, { content: comment.trim() });
      const res = await api.get(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${a._id}`);
      setA(res.data.announcement);
      onChange(res.data.announcement);
      setComment('');
    } catch (err) {
      toast(err.message || "Comment wasn't posted");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} labelledBy="ann-title">
      <button type="button" className="ib x" aria-label="Close" onClick={onClose}><Ic as={X} /></button>
      <h3 id="ann-title" className="ann-title"><Ic as={Info} />{a.title}</h3>
      <div className="ann-meta"><span className="chip c-th">{cap(a.type)}</span>{authorOf(a)} · {fmtDate(a.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div className="ann-body">{a.content}</div>
      <div className="ann-acts">
        <button type="button" className={`btn o sm ${liked ? 'is-liked' : ''}`} aria-pressed={liked} onClick={like}>
          <Ic as={Heart} fill={liked ? 'currentColor' : 'none'} />{a.likes?.length || 0} Like{(a.likes?.length || 0) === 1 ? '' : 's'}
        </button>
        <span className="sub ann-views"><Ic as={Eye} />{a.readBy?.length || 0} views</span>
      </div>
      <h4 className="ann-ch">Comments ({a.comments?.length || 0})</h4>
      {(a.comments || []).map(c => (
        <div className="cmt" key={c._id}>
          <span className="av" style={{ width: 34, height: 34 }} aria-hidden="true">{initials(`${c.user?.firstName || ''} ${c.user?.lastName || ''}`)}</span>
          <div className="box" style={{ flex: 1, padding: '10px 14px' }}>
            <small className="cmt-by">{c.user ? `${c.user.firstName} ${c.user.lastName}` : 'User'} · {fmtDate(c.createdAt)}</small>
            {c.content}
          </div>
        </div>
      ))}
      <form className="cmt" onSubmit={post}>
        <input className="inp" style={{ flex: 1, borderRadius: 99 }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" aria-label="Comment" maxLength={500} />
        <button className="btn p sm" disabled={busy || !comment.trim()}>{busy ? 'Posting…' : 'Post'}</button>
      </form>
    </Dialog>
  );
}
