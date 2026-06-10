import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { BookOpenIcon, ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const PHASE_CFG = {
  1: { label: 'Phase 1', color: '#3b82f6', border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   badge: 'bg-blue-500/15 text-blue-400' },
  2: { label: 'Phase 2', color: '#22c55e', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/15 text-emerald-400' },
  3: { label: 'Phase 3', color: '#a855f7', border: 'border-purple-500/30',  bg: 'bg-purple-500/10',  badge: 'bg-purple-500/15 text-purple-400' },
};

const NotesTab = () => {
  const [notes, setNotes]     = useState({ phase1: [], phase2: [], phase3: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({ phase1: true });

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.STUDENT.NOTES, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.data.notes);
      }
    } catch (e) { console.error('Error fetching notes:', e); }
    finally     { setLoading(false); }
  };

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#161616] border border-white/5 rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpenIcon className="h-5 w-5 text-[#CA133E]" />
          Interactive Notes
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Phase-by-phase study notes</p>
      </div>

      {/* Phase accordions */}
      <div className="space-y-3">
        {[1, 2, 3].map((p) => {
          const key  = `phase${p}`;
          const list = notes[key] || [];
          const cfg  = PHASE_CFG[p];
          const isOpen = !!expanded[key];

          return (
            <div key={key} className={`bg-[#161616] border border-white/5 rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ background: `${cfg.color}25`, border: `2px solid ${cfg.color}50` }}
                  >
                    {p}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{cfg.label}</p>
                    <p className="text-xs text-gray-500">{list.length} note{list.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {list.length}
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      {list.length === 0 ? (
                        <div className="py-6 text-center">
                          <BookOpenIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notes available yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {list.map((note) => (
                            <button
                              key={note._id}
                              onClick={() => window.open(note.linkUrl, '_blank', 'noopener,noreferrer')}
                              className="flex items-center gap-3 bg-[#1A1A1A] border border-white/5 rounded-xl p-3 hover:border-white/10 hover:bg-white/3 transition-all text-left group"
                            >
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                                <BookOpenIcon className="h-4 w-4" style={{ color: cfg.color }} />
                              </div>
                              <p className="flex-1 text-sm font-medium text-white truncate">{note.title}</p>
                              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotesTab;
