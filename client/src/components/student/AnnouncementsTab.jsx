import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  MegaphoneIcon, CalendarIcon, ClockIcon, AcademicCapIcon,
  ExclamationTriangleIcon, BookOpenIcon, TrophyIcon, InformationCircleIcon,
  UserGroupIcon, HeartIcon, ChatBubbleLeftRightIcon, EyeIcon,
  MagnifyingGlassIcon, XMarkIcon, PaperClipIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, MegaphoneIcon as MegaphoneIconSolid } from '@heroicons/react/24/solid';
import io from 'socket.io-client';

const TYPES = [
  { value: 'all',       label: 'All',        icon: MegaphoneIcon,          color: 'text-gray-400' },
  { value: 'general',   label: 'General',    icon: InformationCircleIcon,  color: 'text-blue-400' },
  { value: 'assignment',label: 'Assignment', icon: BookOpenIcon,           color: 'text-green-400' },
  { value: 'exam',      label: 'Exam',       icon: AcademicCapIcon,        color: 'text-red-400' },
  { value: 'holiday',   label: 'Holiday',    icon: CalendarIcon,           color: 'text-purple-400' },
  { value: 'meeting',   label: 'Meeting',    icon: UserGroupIcon,          color: 'text-indigo-400' },
  { value: 'important', label: 'Important',  icon: ExclamationTriangleIcon,color: 'text-yellow-400' }
];

const PRIORITY_BADGE = {
  low:    'bg-white/5 text-gray-400',
  medium: 'bg-blue-500/15 text-blue-400',
  high:   'bg-orange-500/15 text-orange-400',
  urgent: 'bg-red-500/15 text-red-400'
};

const PRIORITY_BORDER = {
  low: 'border-l-gray-600', medium: 'border-l-blue-500',
  high: 'border-l-orange-500', urgent: 'border-l-red-500'
};

const relTime = (d) => {
  const h = Math.abs(Date.now() - new Date(d)) / 36e5;
  if (h < 1) return 'Just now';
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (h < 48) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const inputClass = 'bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm';

const AnnouncementsTab = ({ studentData }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    const socket = io(API_ENDPOINTS.BASE_URL);
    socket.on('new_announcement', (a) => setAnnouncements(prev => [a, ...prev]));
    return () => socket.disconnect();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.data.announcements || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleLike = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${id}/like`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const upd = (a) => a._id === id ? { ...a, likeCount: data.data.likeCount, hasLiked: data.data.hasLiked } : a;
        setAnnouncements(prev => prev.map(upd));
        if (selected?._id === id) setSelected(prev => upd(prev));
      }
    } catch (e) { console.error(e); }
  };

  const addComment = async (id) => {
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });
      if (res.ok) { setNewComment(''); fetchAnnouncementDetails(id); }
    } catch (e) { console.error(e); }
    finally { setSubmittingComment(false); }
  };

  const fetchAnnouncementDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) { const data = await res.json(); setSelected(data.data.announcement); }
    } catch (e) { console.error(e); }
  };

  const openModal = (a) => { setSelected(a); setShowModal(true); fetchAnnouncementDetails(a._id); };

  const getTypeIcon = (type) => TYPES.find(t => t.value === type)?.icon || InformationCircleIcon;
  const getTypeColor = (type) => TYPES.find(t => t.value === type)?.color || 'text-gray-400';

  const filtered = announcements.filter(a => {
    const matchType = filter === 'all' || a.type === filter;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  if (loading) return (
    <div className="space-y-4">
      <div className="flex gap-3 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl flex-1" />
        <div className="h-10 bg-white/5 rounded-xl w-32" />
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MegaphoneIconSolid className="h-5 w-5 text-[#CA133E]" />
            Announcements
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Stay updated with the latest news</p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputClass} pl-9 pr-4 py-2 w-full sm:w-56`}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TYPES.map(t => {
          const Icon = t.icon;
          const count = t.value === 'all' ? announcements.length : announcements.filter(a => a.type === t.value).length;
          const active = filter === t.value;
          return (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                active ? 'bg-[#CA133E] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#161616] border border-white/5 rounded-xl p-10 text-center">
            <MegaphoneIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-medium text-sm">
              {search || filter !== 'all' ? 'No matching announcements' : 'No announcements yet'}
            </p>
            <p className="text-gray-600 text-xs mt-1">
              {search || filter !== 'all' ? 'Try adjusting your search or filter.' : "Your teachers haven't posted any announcements yet."}
            </p>
          </div>
        ) : filtered.map((ann, i) => {
          const Icon = getTypeIcon(ann.type);
          return (
            <motion.div key={ann._id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => openModal(ann)}
              className={`bg-[#161616] border border-white/5 border-l-4 ${PRIORITY_BORDER[ann.priority] || 'border-l-gray-600'} rounded-xl p-4 sm:p-5 cursor-pointer hover:border-white/10 transition-all group`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${getTypeColor(ann.type)}`} />
                    <h3 className="text-white font-semibold text-sm sm:text-base truncate">{ann.title}</h3>
                    {ann.isPinned && <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">📌 Pinned</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[ann.priority]}`}>
                      {ann.priority?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{ann.content}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span>{relTime(ann.createdAt)}</span>
                    <span>· {ann.createdBy?.firstName} {ann.createdBy?.lastName}</span>
                    <span className="flex items-center gap-1"><EyeIcon className="h-3 w-3" />{ann.metadata?.views || 0}</span>
                    <button onClick={e => { e.stopPropagation(); toggleLike(ann._id); }}
                      className={`flex items-center gap-1 transition-colors ${ann.hasLiked ? 'text-red-400' : 'hover:text-red-400'}`}>
                      {ann.hasLiked ? <HeartIconSolid className="h-3.5 w-3.5" /> : <HeartIcon className="h-3.5 w-3.5" />}
                      {ann.likeCount || 0}
                    </button>
                    <span className="flex items-center gap-1"><ChatBubbleLeftRightIcon className="h-3 w-3" />{ann.commentCount || 0}</span>
                  </div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors mt-1" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selected && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
              {/* Modal header */}
              <div className="p-4 sm:p-5 border-b border-white/8 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {React.createElement(getTypeIcon(selected.type), { className: `h-4 w-4 flex-shrink-0 ${getTypeColor(selected.type)}` })}
                      <h3 className="text-white font-bold text-base sm:text-lg">{selected.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[selected.priority]}`}>
                        {selected.priority?.toUpperCase()}
                      </span>
                      <span>{selected.createdBy?.firstName} {selected.createdBy?.lastName}</span>
                      <span>{relTime(selected.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition-colors p-1 flex-shrink-0">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {/* Modal body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>

                {selected.attachments?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attachments</h4>
                    <div className="space-y-1.5">
                      {selected.attachments.map((a, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/4 rounded-lg">
                          <PaperClipIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-white truncate flex-1">{a.originalName}</span>
                          <span className="text-xs text-gray-600 flex-shrink-0">({a.size} B)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-white/8 pt-4">
                  <div className="flex items-center gap-4 mb-5">
                    <button onClick={() => toggleLike(selected._id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors ${
                        selected.hasLiked ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}>
                      {selected.hasLiked ? <HeartIconSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                      {selected.likeCount || 0} Likes
                    </button>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <EyeIcon className="h-4 w-4" />{selected.metadata?.views || 0} Views
                    </div>
                  </div>

                  {/* Comments */}
                  <h4 className="text-sm font-semibold text-white mb-3">Comments ({selected.comments?.length || 0})</h4>
                  <div className="flex gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#CA133E]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#CA133E]">{studentData?.firstName?.[0]}</span>
                    </div>
                    <div className="flex-1">
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment…" rows={2}
                        className={`${inputClass} w-full p-2.5 resize-none`} />
                      <div className="flex justify-end mt-2">
                        <button onClick={() => addComment(selected._id)}
                          disabled={!newComment.trim() || submittingComment}
                          className="px-4 py-1.5 bg-[#CA133E] text-white rounded-xl text-sm font-medium hover:bg-[#A01030] disabled:opacity-40 transition-colors">
                          {submittingComment ? 'Posting…' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selected.comments?.map((c, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-300">{c.user?.firstName?.[0]}</span>
                        </div>
                        <div className="flex-1 bg-white/4 rounded-xl p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white">{c.user?.firstName} {c.user?.lastName}</span>
                            <span className="text-[10px] text-gray-600">{relTime(c.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-300">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsTab;
