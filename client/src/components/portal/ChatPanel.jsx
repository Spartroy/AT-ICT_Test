import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Paperclip, Send, MessageSquare, Download, Mic, Square, X, Megaphone, Search, FileText } from 'lucide-react';
import { api, downloadFile } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, Ic, initials } from './kit';
import { useToast } from './PortalUI';

const POLL_MS = 15000;
const MAX_FILES = 5;
const MAX_BYTES = 100 * 1024 * 1024;
export const ALL_ID = '__all';

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

const clock = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
const fileStamp = () => new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
const kindOfMime = (mime = '') => (mime.startsWith('image/') ? 'image' : mime.startsWith('audio/') ? 'audio' : 'file');

/** Loads a protected chat file (needs the Authorization header) into an object URL for <img> / <audio>. */
function useBlobUrl(url, enabled) {
  const [href, setHref] = useState('');
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let objectUrl = '';
    api.raw(url)
      .then(res => res.blob())
      .then((blob) => { if (!cancelled) { objectUrl = URL.createObjectURL(blob); setHref(objectUrl); } })
      .catch(() => {});
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, enabled]);
  return href;
}

/** One attachment in a bubble: images and voice notes play inline, everything else downloads. */
function Attachment({ messageId, a, onError }) {
  const url = `${API_ENDPOINTS.CHAT.FILES}/${messageId}/${a.filename}`;
  const kind = kindOfMime(a.mimetype);
  const href = useBlobUrl(url, kind !== 'file');
  const name = a.originalName || a.filename;

  if (kind === 'image') {
    return href
      ? <a className="bub-img" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}><img src={href} alt={name} /></a>
      : <span className="bub-img bub-img--wait" aria-hidden="true" />;
  }
  if (kind === 'audio') {
    return (
      <span className="bub-audio">
        <Ic as={Mic} />
        {href ? <audio controls src={href} preload="metadata" aria-label={`Voice note ${name}`} /> : <small>Loading voice note…</small>}
      </span>
    );
  }
  return (
    <button type="button" className="bub-file" onClick={() => downloadFile(url, name).catch(onError)}>
      <Ic as={Download} />{name}
    </button>
  );
}

/** Chips for files waiting to be sent, with image thumbnails. */
function Pending({ files, onRemove }) {
  const previews = useMemo(() => files.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')), [files]);
  useEffect(() => () => previews.forEach(u => u && URL.revokeObjectURL(u)), [previews]);
  if (!files.length) return null;
  return (
    <ul className="cmp" aria-label="Attached files">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`}>
          {previews[i] ? <img src={previews[i]} alt="" /> : <Ic as={f.type.startsWith('audio/') ? Mic : FileText} />}
          <span>{f.name}</span>
          <button type="button" className="ib sm" aria-label={`Remove ${f.name}`} onClick={() => onRemove(i)}><Ic as={X} /></button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Two-pane chat: thread list (with search) + conversation, for teacher and students.
 * threads: [{ id, name, sub, unread }]. Attach files, paste screenshots, record voice notes.
 * `broadcast` (teacher) adds an "All students" thread that sends one message to every student.
 */
export default function ChatPanel({ threads, emptyText = 'No conversations yet.', onRead, broadcast = false }) {
  const [activeId, setActiveId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sentAll, setSentAll] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);
  const toast = useToast();
  const me = myId();

  const allThread = useMemo(() => (broadcast ? { id: ALL_ID, name: 'All students', sub: 'One message to every student', isAll: true } : null), [broadcast]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (t) => !q || `${t.name} ${t.sub || ''}`.toLowerCase().includes(q);
    return [...(allThread && match(allThread) ? [allThread] : []), ...threads.filter(match)];
  }, [threads, allThread, query]);
  const active = [allThread, ...threads].find(t => t && t.id === activeId) || threads[0] || allThread;
  const isAll = active?.id === ALL_ID;

  const load = useCallback(async (id, quiet) => {
    if (!id || id === ALL_ID) return;
    try {
      const res = await api.get(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${id}`);
      setMessages(res.data?.messages || []);
    } catch (err) {
      if (!quiet) toast(err.message || "Couldn't load messages");
    }
  }, [toast]);

  useEffect(() => {
    if (!active || isAll) { setMessages([]); return undefined; }
    load(active.id);
    onRead?.(active.id);
    const t = setInterval(() => load(active.id, true), POLL_MS);
    return () => clearInterval(t);
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sentAll]);

  // ----- attachments -----
  const addFiles = useCallback((incoming) => {
    const ok = incoming.filter(f => f.size <= MAX_BYTES);
    if (ok.length < incoming.length) toast('Files can be up to 100 MB each');
    setFiles((current) => {
      const next = [...current, ...ok];
      if (next.length > MAX_FILES) toast(`You can attach up to ${MAX_FILES} files`);
      return next.slice(0, MAX_FILES);
    });
  }, [toast]);

  const onPaste = (e) => {
    const images = [...(e.clipboardData?.items || [])].filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
    if (!images.length) return; // plain text pastes normally
    e.preventDefault();
    addFiles(images.map((f, i) => new File([f], `screenshot-${fileStamp()}${images.length > 1 ? `-${i + 1}` : ''}.png`, { type: f.type || 'image/png' })));
  };

  // ----- voice notes -----
  useEffect(() => {
    if (!recording) return undefined;
    setSecs(0);
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => () => { recRef.current?.stop(true); }, []);

  const startRecording = async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return toast("Voice notes aren't supported in this browser");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      let cancelled = false;
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        recRef.current = null;
        if (cancelled || !chunks.length) return;
        const type = (recorder.mimeType || 'audio/webm').split(';')[0];
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        addFiles([new File(chunks, `voice-note-${fileStamp()}.${ext}`, { type })]);
      };
      recRef.current = { stop: (cancel) => { cancelled = !!cancel; if (recorder.state !== 'inactive') recorder.stop(); } };
      recorder.start();
      setRecording(true);
    } catch {
      toast('Allow microphone access to record a voice note');
    }
  };

  // ----- sending -----
  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !files.length) || !active || sending || recording) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', text.trim());
      files.forEach(f => fd.append('files', f));
      if (isAll) {
        const res = await api.post(API_ENDPOINTS.CHAT.BROADCAST, fd);
        toast(res.message || 'Sent');
        setSentAll(s => [...s, { id: `${Date.now()}`, content: text.trim(), files: files.map(f => f.name), count: res.data?.sent ?? 0, at: new Date().toISOString() }]);
      } else {
        fd.append('recipientId', active.id);
        fd.append('type', files.length ? 'file' : 'text');
        const res = await api.post(API_ENDPOINTS.CHAT.SEND, fd);
        setMessages(m => [...m, res.data.message]);
      }
      setText('');
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast(err.message || "Message wasn't sent");
    } finally {
      setSending(false);
    }
  };

  if (!threads.length && !broadcast) return <div className="card"><Empty icon={MessageSquare}>{emptyText}</Empty></div>;

  return (
    <div className={`chat ${mobileOpen ? 'open' : ''}`}>
      <div className="chl-wrap">
        <label className="chs">
          <Ic as={Search} />
          <span className="sr-only">Search conversations</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students…" />
        </label>
        <div className="chl" role="list" aria-label="Conversations">
          {list.map(t => (
            <button
              key={t.id}
              type="button"
              role="listitem"
              className={t.id === active?.id ? 'on' : ''}
              aria-current={t.id === active?.id}
              onClick={() => { setActiveId(t.id); setMobileOpen(true); }}
            >
              <span className={`av ${t.isAll ? 'av--all' : ''}`} aria-hidden="true">{t.isAll ? <Ic as={Megaphone} /> : initials(t.name)}</span>
              <span className="chl-txt"><b>{t.name}</b><small>{t.sub}</small></span>
              {!!t.unread && <span className="bd chl-bd" aria-label={`${t.unread} unread`}>{t.unread}</span>}
            </button>
          ))}
          {!list.length && <p className="sub chl-none">No one matches “{query}”.</p>}
        </div>
      </div>
      <div className="cm">
        <div className="cmh">
          <button type="button" className="ib sm back-m" aria-label="Back to conversations" onClick={() => setMobileOpen(false)}><Ic as={ChevronLeft} /></button>
          {active?.name}
          {isAll && <small className="cmh-sub">Each student gets it in their own chat</small>}
        </div>
        <div className="cmb" ref={bodyRef} aria-live="polite">
          {isAll ? (
            <>
              {!sentAll.length && <Empty icon={Megaphone}>Write a message below. It is delivered to every student's chat.</Empty>}
              {sentAll.map(m => (
                <div className="bub mine" key={m.id}>
                  {m.content && <span className="bub-text">{m.content}</span>}
                  {m.files.map(n => <span className="bub-file" key={n}><Ic as={Paperclip} />{n}</span>)}
                  <small>Sent to {m.count} student{m.count === 1 ? '' : 's'} · {stamp(m.at)}</small>
                </div>
              ))}
            </>
          ) : (
            <>
              {!messages.length && <Empty icon={MessageSquare}>No messages yet. Say hello.</Empty>}
              {messages.map((m) => {
                const own = String(m.sender?._id || m.sender) === me;
                return (
                  <div className={`bub ${own ? 'mine' : ''}`} key={m._id}>
                    {m.content && <span className="bub-text">{m.content}</span>}
                    {m.attachments?.map(a => <Attachment key={a.filename} messageId={m._id} a={a} onError={() => toast("Couldn't download the file")} />)}
                    <small>{own ? 'You' : `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim()} · {stamp(m.createdAt)}</small>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <Pending files={files} onRemove={i => setFiles(f => f.filter((_, k) => k !== i))} />
        <form className="cmf" onSubmit={send}>
          <label className="ib" title="Attach files or photos">
            <Ic as={Paperclip} />
            <input ref={fileRef} type="file" multiple className="sr-only" aria-label="Attach files" onChange={(e) => { addFiles([...e.target.files]); e.target.value = ''; }} />
          </label>
          {recording ? (
            <div className="rec" role="status" aria-live="polite">
              <i className="rec-dot" aria-hidden="true" />Recording… {clock(secs)}
              <button type="button" className="ib sm" aria-label="Cancel recording" onClick={() => recRef.current?.stop(true)}><Ic as={X} /></button>
            </div>
          ) : (
            <input
              className="inp"
              style={{ borderRadius: 99 }}
              value={text}
              onChange={e => setText(e.target.value)}
              onPaste={onPaste}
              placeholder={isAll ? 'Message every student…' : files.length ? `${files.length} file(s) attached — add a message…` : 'Type a message, or paste a screenshot…'}
              aria-label="Message"
            />
          )}
          {recording ? (
            <button type="button" className="btn p" aria-label="Stop and attach the voice note" onClick={() => recRef.current?.stop(false)}><Ic as={Square} /></button>
          ) : (
            <>
              <button type="button" className="ib" aria-label="Record a voice note" title="Record a voice note" onClick={startRecording}><Ic as={Mic} /></button>
              <button className="btn p" aria-label="Send" disabled={sending}><Ic as={Send} /></button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
