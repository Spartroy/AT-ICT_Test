import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  AcademicCapIcon,
  TrashIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const getFileIcon = (mimetype) => {
  if (mimetype.startsWith('image/')) return PhotoIcon;
  if (mimetype.startsWith('audio/')) return MusicalNoteIcon;
  if (mimetype.startsWith('video/')) return VideoCameraIcon;
  return DocumentIcon;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTimestamp = (timestamp) => {
  const t         = new Date(timestamp);
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate   = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const timeStr   = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (msgDate.getTime() === today.getTime())     return timeStr;
  if (msgDate.getTime() === yesterday.getTime()) return `Yesterday ${timeStr}`;
  if (now - t < 7 * 86400000)
    return t.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const ChatTab = ({ studentData }) => {
  const [teacher, setTeacher]               = useState(null);
  const [messages, setMessages]             = useState([]);
  const [newMessage, setNewMessage]         = useState('');
  const [loading, setLoading]               = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [selectedFiles, setSelectedFiles]   = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  useEffect(() => { fetchTeacherInfo(); }, []);
  useEffect(() => { if (teacher) fetchMessages(); }, [teacher]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchTeacherInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.BASE}/student/teacher`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setTeacher(data.data.teacher);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!teacher) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${teacher.id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages);
        setUnreadCount(0);
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !teacher) return;
    setSendingMessage(true);
    try {
      const token    = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('recipientId', teacher.id);
      formData.append('content', newMessage);
      formData.append('type', 'text');
      selectedFiles.forEach(f => formData.append('files', f));

      const res = await fetch(API_ENDPOINTS.CHAT.SEND, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (e) { console.error(e); }
    finally     { setSendingMessage(false); }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.MESSAGES}/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (e) { console.error(e); }
  };

  const downloadFile = async (messageId, filename, originalName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.CHAT.FILES}/${messageId}/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = originalName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-xl h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#CA133E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-xl p-10 text-center">
        <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white mb-1">No Teacher Assigned</h3>
        <p className="text-sm text-gray-500">Please contact admin to assign you to a teacher</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#161616] border border-white/5 rounded-xl overflow-hidden" style={{ height: '75vh' }}>

      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#CA133E]/20 rounded-full flex items-center justify-center ring-1 ring-[#CA133E]/40">
            <AcademicCapIcon className="h-5 w-5 text-[#CA133E]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{teacher.fullName}</p>
            <p className="text-xs text-gray-500">IGCSE Computer Science Teacher</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="bg-[#CA133E] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-600 mb-3" />
            <p className="text-sm font-medium text-white mb-1">No messages yet</p>
            <p className="text-xs text-gray-500">Start the conversation with your teacher!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender.role === 'student';
            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOwn ? 'bg-[#CA133E]' : 'bg-white/10'
                  }`}>
                    {isOwn
                      ? <UserIcon        className="h-3.5 w-3.5 text-white" />
                      : <AcademicCapIcon className="h-3.5 w-3.5 text-gray-300" />}
                  </div>

                  {/* Bubble */}
                  <div className="relative">
                    <div className={`px-3 py-2.5 rounded-xl ${
                      isOwn
                        ? 'bg-[#CA133E] text-white rounded-br-sm'
                        : 'bg-[#1A1A1A] border border-white/5 text-white rounded-bl-sm'
                    }`}>
                      <p className={`text-[10px] font-semibold mb-1 ${isOwn ? 'text-red-200' : 'text-gray-500'}`}>
                        {isOwn ? 'You' : `${message.sender.firstName} ${message.sender.lastName}`}
                      </p>
                      {message.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      {message.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {message.attachments.map((att, idx) => {
                            const FileIcon = getFileIcon(att.mimetype);
                            return (
                              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-white/5'}`}>
                                <FileIcon className="h-4 w-4 flex-shrink-0 opacity-70" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{att.originalName}</p>
                                  <p className="text-[10px] opacity-60">{formatFileSize(att.size)}</p>
                                </div>
                                <button
                                  onClick={() => downloadFile(message._id, att.filename, att.originalName)}
                                  className="p-1 rounded hover:bg-white/10 transition-colors"
                                >
                                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className={`text-[10px] mt-1.5 text-right ${isOwn ? 'text-red-200/70' : 'text-gray-600'}`}>
                        {formatTimestamp(message.createdAt)}
                      </p>
                    </div>

                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(message._id)}
                        className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview strip */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-[#1A1A1A] border-t border-white/5 flex-shrink-0">
          <p className="text-xs text-[#CA133E] font-medium mb-2">Files to send:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type || 'application/octet-stream');
              return (
                <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <FileIcon className="h-4 w-4 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate max-w-[120px]">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="p-0.5 text-red-400 hover:bg-red-500/15 rounded transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 border-t border-white/5 flex-shrink-0 bg-[#1A1A1A]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-[#CA133E] hover:bg-[#CA133E]/10 rounded-xl transition-colors flex-shrink-0"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 px-3 py-2 bg-[#161616] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm"
          disabled={sendingMessage}
          maxLength={2000}
        />

        <button
          type="submit"
          disabled={(!newMessage.trim() && selectedFiles.length === 0) || sendingMessage}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
            (newMessage.trim() || selectedFiles.length > 0) && !sendingMessage
              ? 'bg-[#CA133E] hover:bg-[#A01030] text-white'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          {sendingMessage
            ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            : <PaperAirplaneIcon className="h-5 w-5" />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])}
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
      </form>
    </div>
  );
};

export default ChatTab;
