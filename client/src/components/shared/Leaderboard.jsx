import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

const MEDALS = [
  {
    rank: 1,
    label: '1st',
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    border: 'border-yellow-400',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/40',
    icon: '🥇'
  },
  {
    rank: 2,
    label: '2nd',
    bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
    border: 'border-gray-400',
    text: 'text-gray-300',
    glow: 'shadow-gray-400/40',
    icon: '🥈'
  },
  {
    rank: 3,
    label: '3rd',
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    border: 'border-amber-600',
    text: 'text-amber-500',
    glow: 'shadow-amber-600/40',
    icon: '🥉'
  }
];

const AvatarCircle = ({ firstName, lastName, medal, isYou }) => {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  return (
    <div className={`relative w-12 h-12 rounded-full ${medal.bg} flex items-center justify-center shadow-lg ${medal.glow} shadow-md border-2 ${medal.border} flex-shrink-0`}>
      <span className="text-white font-bold text-sm">{initials}</span>
      {isYou && (
        <span className="absolute -top-1 -right-1 bg-[#CA133E] text-white text-[9px] font-bold rounded-full px-1 py-0.5 leading-none">
          YOU
        </span>
      )}
    </div>
  );
};

const Leaderboard = ({ currentUserId, session, className = '' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const url = session
        ? `${API_ENDPOINTS.LEADERBOARD.BASE}?session=${encodeURIComponent(session)}`
        : API_ENDPOINTS.LEADERBOARD.BASE;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch leaderboard');

      const data = await res.json();
      setLeaderboard(data.data.leaderboard || []);
      setSessionLabel(data.data.leaderboard?.[0]?.sessionLabel || session || '');
    } catch (err) {
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/60 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm border border-gray-600/50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-400" />
          Top Students
          {sessionLabel && (
            <span className="text-xs text-gray-400 font-normal bg-gray-700 px-2 py-0.5 rounded-full">
              {sessionLabel}
            </span>
          )}
        </h3>
        <button
          onClick={fetchLeaderboard}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          title="Refresh leaderboard"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-700" />
              <div className="flex-1">
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-2 bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4 text-gray-400 text-sm">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <TrophyIcon className="h-10 w-10 mx-auto mb-2 text-gray-600" />
          <p className="text-sm">No ranked students yet</p>
          <p className="text-xs text-gray-500 mt-1">Complete assignments to earn points!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {leaderboard.map((entry, idx) => {
              const medal = MEDALS[idx] || MEDALS[2];
              const isYou = currentUserId && entry._id === currentUserId;

              return (
                <motion.div
                  key={entry._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isYou
                      ? 'bg-[#CA133E]/10 border-[#CA133E]/40'
                      : 'bg-gray-700/30 border-gray-600/30'
                  }`}
                >
                  <AvatarCircle
                    firstName={entry.firstName}
                    lastName={entry.lastName}
                    medal={medal}
                    isYou={isYou}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{medal.icon}</span>
                      <span className={`font-semibold text-sm truncate ${isYou ? 'text-[#CA133E]' : 'text-white'}`}>
                        {entry.firstName} {entry.lastName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {medal.label} place
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-base font-bold ${medal.text}`}>
                      {(entry.points || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">pts</div>
                  </div>
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
