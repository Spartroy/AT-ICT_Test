import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

const rankColor = (idx) => {
  if (idx === 0) return 'text-yellow-400';
  if (idx === 1) return 'text-gray-300';
  if (idx === 2) return 'text-amber-500';
  return 'text-[#CA133E]';
};

const Leaderboard = ({ currentUserId, session, className = '' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const url = session
        ? `${API_ENDPOINTS.LEADERBOARD.BASE}?session=${encodeURIComponent(session)}`
        : API_ENDPOINTS.LEADERBOARD.BASE;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      setLeaderboard(data.data.leaderboard || []);
      setSessionLabel(data.data.leaderboard?.[0]?.sessionLabel || session || '');
    } catch {
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#161616] border border-white/5 rounded-xl p-4 sm:p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <TrophyIcon className="h-4 w-4 text-yellow-400" />
          Leaderboard
          {sessionLabel && (
            <span className="text-[10px] text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-full">
              {sessionLabel}
            </span>
          )}
        </h3>
        <button
          onClick={fetchLeaderboard}
          className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-4 bg-white/5 rounded" />
              <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
              <div className="flex-1 h-3 bg-white/5 rounded" />
              <div className="w-12 h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 text-gray-600 text-sm">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <TrophyIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No ranked students yet</p>
          <p className="text-xs mt-1 opacity-60">Complete assignments to earn points!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {leaderboard.map((entry, idx) => {
              const isYou = currentUserId && entry._id === currentUserId;
              const initials = `${(entry.firstName || '?')[0]}${(entry.lastName || '')[0] || ''}`.toUpperCase();

              return (
                <motion.div
                  key={entry._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isYou
                      ? 'bg-[#CA133E]/10 border border-[#CA133E]/25'
                      : 'hover:bg-white/3'
                  }`}
                >
                  {/* Rank number */}
                  <span className="text-gray-600 text-xs font-mono w-5 text-right flex-shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                    'bg-[#CA133E]'
                  }`}>
                    {initials}
                  </div>

                  {/* Name */}
                  <span className={`flex-1 text-sm font-medium truncate ${isYou ? 'text-[#CA133E]' : 'text-white'}`}>
                    {entry.firstName} {entry.lastName}
                    {isYou && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                  </span>

                  {/* Points */}
                  <span className={`text-sm font-bold flex-shrink-0 ${rankColor(idx)}`}>
                    {(entry.points || 0).toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
