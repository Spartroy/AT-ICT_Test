import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const avatar = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const relTime = (ts) => {
  const d = new Date(ts), now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fullTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const fileIcon = (mime) => {
  if (mime?.startsWith('image/'))  return PhotoIcon;
  if (mime?.startsWith('audio/'))  return MusicalNoteIcon;
  if (mime?.startsWith('video/'))  return VideoCameraIcon;
  return DocumentIcon;
};

const fmtSize = (b) => {
  if (!b) return '';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / k ** i).toFixed(1))} ${sizes[i]}`;
};

/* ── component ───────────────────────────────────────────────────────────── */
const ChatCenter = () => {
  const [students,       setStudents]       = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [draft,          setDraft]          = useState('');
  const [sending,        setSending]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [files,          setFiles]          = useState([]);
  const [hovered,        setHovered]        = useState(null);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const textRef    = useRef(null);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { if (selected) fetchMessages(); }, [selected]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.BASE}/teacher/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data.students;
        setStudents(list);
        if (list.length && !selected) setSelected(list[0]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!selected) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${selected.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages);
        setStudents(prev => prev.map(s => s.id === selected.id ? { ...s, unreadCount: 0 } : s));
      }
    } catch { /* silent */ }
  };

  const send = async (e) => {
    e.preventDefault();
    if ((!draft.trim() && files.length === 0) || !selected) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('recipientId', selected.id);
      form.append('content', draft);
      form.append('type', 'text');
      files.forEach(f => form.append('files', f));
      const res = await fetch(API_ENDPOINTS.CHAT.SEND, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.data.message]);
        setDraft(''); setFiles([]);
        if (fileRef.current) fileRef.current.value = '';
        setStudents(prev => prev.map(s =>
          s.id === selected.id
            ? { ...s, lastMessage: { content: draft || 'File', createdAt: new Date().toISOString(), isFromCurrentUser: true }, lastActivity: new Date().toISOString() }
            : s
        ));
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const deleteMsg = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.MESSAGES}/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(prev => prev.filter(m => m._id !== id));
    } catch { /* silent */ }
  };

  const downloadFile = async (msgId, filename, name) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.FILES}/${msgId}/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch { /* silent */ }
  };

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#CA133E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] rounded-2xl overflow-hidden border border-white/8" style={{ background: '#111' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 xl:w-80 flex-col border-r border-white/8`} style={{ background: '#161616' }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Messages</h2>
            {students.some(s => s.unreadCount > 0) && (
              <span className="text-xs bg-[#CA133E] text-white px-2 py-0.5 rounded-full font-medium">
                {students.reduce((acc, s) => acc + (s.unreadCount || 0), 0)} new
              </span>
            )}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E]/60 transition-colors"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600">
              <ChatBubbleLeftRightIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No students found</p>
            </div>
          ) : filtered.map(student => {
            const isActive = selected?.id === student.id;
            return (
              <button
                key={student.id}
                onClick={() => setSelected(student)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-white/5 transition-colors ${
                  isActive ? 'bg-[#CA133E]/12' : 'hover:bg-white/4'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: isActive ? '#CA133E' : 'rgba(255,255,255,0.1)' }}
                  >
                    {avatar(student.fullName)}
                  </div>
                  {student.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#CA133E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {student.unreadCount}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                      {student.fullName}
                    </p>
                    {student.lastMessage && (
                      <span className="text-[11px] text-gray-500 flex-shrink-0">
                        {relTime(student.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {student.lastMessage
                      ? `${student.lastMessage.isFromCurrentUser ? 'You: ' : ''}${student.lastMessage.content}`
                      : `${student.studentId} · Yr ${student.year}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat pane ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8" style={{ background: '#161616' }}>
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#CA133E' }}
              >
                {avatar(selected.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{selected.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{selected.studentId} · Year {selected.year}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3" style={{ background: '#111' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-white font-medium text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">Start the conversation below</p>
                </div>
              ) : messages.map((msg) => {
                const own = msg.sender.role === 'teacher';
                const FileIcon = msg.attachments?.[0] ? fileIcon(msg.attachments[0].mimetype) : null;
                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}
                    onMouseEnter={() => setHovered(msg._id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Student avatar */}
                    {!own && (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0 mb-1">
                        {avatar(selected.fullName)}
                      </div>
                    )}

                    <div className={`flex flex-col gap-1 max-w-[68%] ${own ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          own
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm text-gray-100'
                        }`}
                        style={{
                          background: own
                            ? 'linear-gradient(135deg, #CA133E, #8a0020)'
                            : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                        {/* Attachments */}
                        {msg.attachments?.map((att, i) => {
                          const Ico = fileIcon(att.mimetype);
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 mt-2 rounded-xl p-2.5"
                              style={{ background: own ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)' }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                <Ico className="h-4 w-4 text-gray-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{att.originalName}</p>
                                <p className="text-[11px] text-gray-400">{fmtSize(att.size)}</p>
                              </div>
                              <button
                                onClick={() => downloadFile(msg._id, att.filename, att.originalName)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                              >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Timestamp + delete */}
                      <div className={`flex items-center gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[11px] text-gray-600">{fullTime(msg.createdAt)}</span>
                        {own && hovered === msg._id && (
                          <button
                            onClick={() => deleteMsg(msg._id)}
                            className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teacher avatar */}
                    {own && (
                      <div className="w-7 h-7 rounded-full bg-[#CA133E]/20 flex items-center justify-center text-xs font-bold text-[#CA133E] flex-shrink-0 mb-1">
                        T
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* File preview */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/8"
                  style={{ background: '#161616' }}
                >
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {files.map((f, i) => {
                      const Ico = fileIcon(f.type);
                      return (
                        <div key={i} className="flex items-center gap-2 bg-white/6 rounded-xl px-3 py-2">
                          <Ico className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-300 max-w-[120px] truncate">{f.name}</span>
                          <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 transition-colors">
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/8" style={{ background: '#161616' }}>
              <form onSubmit={send} className="flex items-end gap-2">
                <input type="file" ref={fileRef} onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} multiple className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="p-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors flex-shrink-0"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <textarea
                  ref={textRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  disabled={sending}
                  className="flex-1 bg-white/6 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#CA133E]/50 transition-colors"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  type="submit"
                  disabled={(!draft.trim() && files.length === 0) || sending}
                  className="p-2.5 rounded-xl bg-[#CA133E] hover:bg-[#A01030] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
              <p className="text-[11px] text-gray-700 mt-1.5 px-1">Shift+Enter for new line</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8" style={{ background: '#111' }}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-white font-semibold">Select a student</p>
            <p className="text-sm text-gray-500">Pick someone from the sidebar to open their conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatCenter;
