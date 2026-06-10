import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showError } from '../../utils/toast';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  FunnelIcon,
  GlobeAltIcon,
  LockClosedIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import CreateFlashcardModal from '../teacher/CreateFlashcardModal';
import EditFlashcardModal from '../teacher/EditFlashcardModal';
import ViewFlashcardModal from '../teacher/ViewFlashcardModal';

const inputClass = 'bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#CA133E] transition-colors text-sm';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'language', label: 'Language' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const creatorFilters = [
  { value: '', label: 'All Creators' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'student', label: 'Students' },
];

const FlashcardsTab = () => {
  const [flashcardStacks, setFlashcardStacks] = useState([]);
  const [myStacks, setMyStacks]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [selectedStack, setSelectedStack]     = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterCategory, setFilterCategory]   = useState('');
  const [filterCreator, setFilterCreator]     = useState('');
  const [activeTab, setActiveTab]             = useState('all');
  const [stats, setStats]                     = useState({});
  const [showFilters, setShowFilters]         = useState(false);

  useEffect(() => {
    fetchFlashcardStacks();
    fetchMyStacks();
    fetchStats();
  }, []);

  const fetchFlashcardStacks = async () => {
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterCreator)  params.append('creator',  filterCreator);
      const res = await fetch(`${API_ENDPOINTS.FLASHCARDS}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFlashcardStacks(data.data || []);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load flashcard stacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.FLASHCARDS_MY_STACKS, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) { const data = await res.json(); setMyStacks(data.data || []); }
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.FLASHCARDS, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data      = await res.json();
        const allStacks = data.data || [];
        setStats({
          totalStacks:   allStacks.length,
          teacherStacks: allStacks.filter(s => s.isTeacherStack).length,
          studentStacks: allStacks.filter(s => !s.isTeacherStack).length,
          totalCards:    allStacks.reduce((sum, s) => sum + (s.totalCards || 0), 0),
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleViewStack   = (stack) => { setSelectedStack(stack); setShowViewModal(true); };
  const handleEditStack   = (stack) => { setSelectedStack(stack); setShowEditModal(true); };
  const handleCreateStack = ()      => { setSelectedStack(null);  setShowCreateModal(true); };
  const handleModalClose  = ()      => { setShowCreateModal(false); setShowEditModal(false); setShowViewModal(false); setSelectedStack(null); };
  const handleSuccess     = ()      => { handleModalClose(); fetchFlashcardStacks(); fetchMyStacks(); };

  const filteredStacks = flashcardStacks.filter(stack => {
    const q = searchTerm.toLowerCase();
    return stack.title.toLowerCase().includes(q) ||
           stack.subject.toLowerCase().includes(q) ||
           stack.description?.toLowerCase().includes(q);
  });

  const getCurrentStacks = () => {
    switch (activeTab) {
      case 'my':       return myStacks.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      case 'teachers': return filteredStacks.filter(s => s.isTeacherStack);
      case 'students': return filteredStacks.filter(s => !s.isTeacherStack);
      default:         return filteredStacks;
    }
  };

  const currentStacks = getCurrentStacks();

  const STAT_CARDS = [
    { label: 'Total Stacks',    value: stats.totalStacks   || 0, icon: DocumentTextIcon, color: 'text-blue-400' },
    { label: 'Teacher Stacks',  value: stats.teacherStacks || 0, icon: AcademicCapIcon,  color: 'text-[#CA133E]' },
    { label: 'Student Stacks',  value: stats.studentStacks || 0, icon: UsersIcon,        color: 'text-emerald-400' },
    { label: 'Total Cards',     value: stats.totalCards    || 0, icon: ChartBarIcon,     color: 'text-purple-400' },
  ];

  const TABS = [
    { id: 'all',      label: 'All Stacks',     count: stats.totalStacks   || 0 },
    { id: 'my',       label: 'My Stacks',      count: myStacks.length },
    { id: 'teachers', label: 'Teacher Stacks', count: stats.teacherStacks || 0 },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-[#161616] border border-white/5 rounded-xl h-20 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-[#161616] border border-white/5 rounded-xl h-36 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-[#CA133E]" />
            Flashcard Library
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Study and create flashcard stacks</p>
        </div>
        <motion.button
          onClick={handleCreateStack}
          className="flex items-center gap-2 px-4 py-2 bg-[#CA133E] hover:bg-[#A01030] text-white rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="h-4 w-4" />
          Create Stack
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#161616] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="bg-[#161616] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search flashcard stacks…"
              className={`w-full pl-9 pr-4 py-2.5 ${inputClass}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              showFilters ? 'bg-[#CA133E]/15 text-[#CA133E] border-[#CA133E]/30' : 'bg-[#1A1A1A] border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
            >
              <select className={`px-3 py-2 ${inputClass}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select className={`px-3 py-2 ${inputClass}`} value={filterCreator} onChange={e => setFilterCreator(e.target.value)}>
                {creatorFilters.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab nav */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === id ? 'bg-[#CA133E] text-white' : 'bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stack grid */}
      {currentStacks.length === 0 ? (
        <div className="py-14 text-center rounded-xl border border-dashed border-white/10 bg-white/2">
          <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white mb-1">No flashcard stacks found</p>
          <p className="text-xs text-gray-500">Create your first stack to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentStacks.map(stack => (
            <StackCard key={stack._id} stack={stack} onView={handleViewStack} onEdit={handleEditStack} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && <CreateFlashcardModal isOpen onClose={handleModalClose} onSuccess={handleSuccess} />}
        {showEditModal && selectedStack && <EditFlashcardModal isOpen onClose={handleModalClose} onSuccess={handleSuccess} stack={selectedStack} />}
        {showViewModal && selectedStack && <ViewFlashcardModal isOpen onClose={handleModalClose} stack={selectedStack} />}
      </AnimatePresence>
    </div>
  );
};

const StackCard = ({ stack, onView, onEdit }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#161616] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            stack.isTeacherStack ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}>
            {stack.isTeacherStack ? 'Teacher' : 'Student'} · {stack.totalCards} cards
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1 leading-tight">{stack.title}</h3>
        {stack.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{stack.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />{stack.studyCount || 0} studies
          </span>
          <span>{stack.creatorName}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            stack.creatorRole === 'teacher' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}>{stack.creatorRole}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={() => onView(stack)}
          className="p-2 bg-white/5 hover:bg-white/8 text-gray-400 hover:text-white rounded-lg transition-colors"
          title="Study stack"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        {stack.createdBy === localStorage.getItem('userId') && (
          <button
            onClick={() => onEdit(stack)}
            className="p-2 bg-white/5 hover:bg-white/8 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Edit stack"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export default FlashcardsTab;
