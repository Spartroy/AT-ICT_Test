import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { BookOpenIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const NotesTab = () => {
  const [notes, setNotes] = useState({ phase1: [], phase2: [], phase3: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.STUDENT.NOTES, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes);
      }
    } catch (e) {
      console.error('Error fetching notes:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const NoteItem = ({ note }) => (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/90 cursor-pointer" onClick={() => window.open(note.linkUrl, '_blank')}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-700/80 rounded-xl flex items-center justify-center">
          <BookOpenIcon className="h-5 w-5 text-gray-300" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{note.title}</h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-800/60 rounded-xl p-6 shadow-2xl backdrop-blur-sm border-2 border-gray-600/50">
      <div className="flex items-center justify-between">
        <h2 className="text-[20pt] font-bold text-white">Interactive Notes</h2>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading notes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[1,2,3].map((p) => {
              const key = `phase${p}`;
              const list = notes[key] || [];
              const colorClasses = p === 1
                ? { panel: 'border-blue-800/60', header: 'bg-blue-900/40', count: 'text-blue-300', chevron: 'text-blue-300' }
                : p === 2
                ? { panel: 'border-green-800/60', header: 'bg-green-900/40', count: 'text-green-300', chevron: 'text-green-300' }
                : { panel: 'border-purple-800/60', header: 'bg-purple-900/40', count: 'text-purple-300', chevron: 'text-purple-300' };
              return (
                <div key={key} className={`bg-gray-900/70 rounded-xl border ${colorClasses.panel}`}>
                  <button onClick={() => toggle(key)} className={`w-full px-6 py-4 flex items-center justify-between text-left rounded-xl ${expanded[key] ? colorClasses.header : 'hover:bg-gray-800/70'}`}>
                    <div>
                      <h3 className="text-lg font-medium text-white">Phase {p}</h3>
                      <p className={`text-sm ${colorClasses.count}`}>{list.length} notes</p>
                    </div>
                    {expanded[key] ? <ChevronDownIcon className={`h-5 w-5 ${colorClasses.chevron}`} /> : <ChevronRightIcon className={`h-5 w-5 ${colorClasses.chevron}`} />}
                  </button>
                  {expanded[key] && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {list.length > 0 ? list.map((n) => (
                        <NoteItem key={n._id} note={n} />
                      )) : (
                        <p className="text-gray-400 text-center py-4">No notes available</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesTab;


