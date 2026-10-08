import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Paperclip, Send, MessageSquare, Download } from 'lucide-react';
import { api, downloadFile } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, Ic, initials } from './kit';
import { useToast } from './PortalUI';

const POLL_MS = 15000;

const stamp = (d) => {
  const t = new Date(d);
  const today = new Date();
  const sameDay = t.toDateString() === today.toDateString();
  const time = t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? time : `${t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
};

const myId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return String(u?._id || u?.id || '');
  } catch {
    return '';
  }
};

/**
 * Two-pane chat: thread list + conversation. threads: [{ id, name, sub, unread }].
 * Messages come from /api/chat/conversations/:id and refresh every 15 s while open.
 */
export default function ChatPanel({ threads, emptyText = 'No conversations yet.', onRead }) {
  const [activeId, setActiveId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const toast = useToast();
  const me = myId();
  const active = threads.find(t => t.id === activeId) || threads[0];

  const load = useCallback(async (id, quiet) => {
    if (!id) return;
    try {
      const res = await api.get(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${id}`);
      setMessages(res.data?.messages || []);
    } catch (err) {
      if (!quiet) toast(err.message || "Couldn't load messages");
    }
  }, [toast]);

  useEffect(() => {
    if (!active) return undefined;
    load(active.id);
    onRead?.(active.id);
    const t = setInterval(() => load(active.id, true), POLL_MS);
    return () => clearInterval(t);
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !files.length) || !active) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('recipientId', active.id);
      fd.append('content', text.trim());
      fd.append('type', files.length ? 'file' : 'text');
      files.forEach(f => fd.append('files', f));
      const res = await api.post(API_ENDPOINTS.CHAT.SEND, fd);
      setMessages(m => [...m, res.data.message]);
      setText('');
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast(err.message || "Message wasn't sent");
    } finally {
      setSending(false);
    }
  };

  if (!threads.length) return <div className="card"><Empty icon={MessageSquare}>{emptyText}</Empty></div>;

  return (
    <div className={`chat ${mobileOpen ? 'open' : ''}`}>
      <div className="chl" role="list" aria-label="Conversations">
        {threads.map(t => (
          <button
            key={t.id}
            type="button"
            role="listitem"
            className={t.id === active?.id ? 'on' : ''}
            aria-current={t.id === active?.id}
            onClick={() => { setActiveId(t.id); setMobileOpen(true); }}
          >
            <span className="av" aria-hidden="true">{initials(t.name)}</span>
            <span className="chl-txt"><b>{t.name}</b><small>{t.sub}</small></span>
            {!!t.unread && <span className="bd chl-bd" aria-label={`${t.unread} unread`}>{t.unread}</span>}
          </button>
        ))}
      </div>
      <div className="cm">
        <div className="cmh">
          <button type="button" className="ib sm back-m" aria-label="Back to conversations" onClick={() => setMobileOpen(false)}><Ic as={ChevronLeft} /></button>
          {active?.name}
        </div>
        <div className="cmb" ref={bodyRef} aria-live="polite">
          {!messages.length && <Empty icon={MessageSquare}>No messages yet. Say hello.</Empty>}
          {messages.map(m => {
            const own = String(m.sender?._id || m.sender) === me;
            return (
              <div className={`bub ${own ? 'mine' : ''}`} key={m._id}>
                {m.content && <span className="bub-text">{m.content}</span>}
                {m.attachments?.map(a => (
                  <button
                    key={a.filename}
                    type="button"
                    className="bub-file"
                    onClick={() => downloadFile(`${API_ENDPOINTS.CHAT.FILES}/${m._id}/${a.filename}`, a.originalName || a.filename).catch(() => toast("Couldn't download the file"))}
                  >
                    <Ic as={Download} />{a.originalName || a.filename}
                  </button>
                ))}
                <small>{own ? 'You' : `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim()} · {stamp(m.createdAt)}</small>
              </div>
            );
          })}
        </div>
        <form className="cmf" onSubmit={send}>
          <label className="ib" title="Attach files">
            <Ic as={Paperclip} />
            <input ref={fileRef} type="file" multiple className="sr-only" aria-label="Attach files" onChange={e => setFiles([...e.target.files])} />
          </label>
          <input className="inp" style={{ borderRadius: 99 }} value={text} onChange={e => setText(e.target.value)}
            placeholder={files.length ? `${files.length} file(s) attached — add a message…` : 'Type a message…'} aria-label="Message" />
          <button className="btn p" aria-label="Send" disabled={sending}><Ic as={Send} /></button>
        </form>
      </div>
    </div>
  );
}
