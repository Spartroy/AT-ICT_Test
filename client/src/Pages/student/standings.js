// Presentation rules for the football-style leaderboard.
export const VIEWS = [
  { id: 'session', label: 'Session' },
  { id: 'group', label: 'Group Standings' }
];

/** 'up' / 'down' / 'same' plus how many places, from the `movement` the server sends. */
export function moveInfo(movement) {
  const n = Number(movement) || 0;
  if (n > 0) return { dir: 'up', n };
  if (n < 0) return { dir: 'down', n: -n };
  return { dir: 'same', n: 0 };
}

/** Podium (top 3), crown on the first place, a row class per tier. */
export function rowTier(rank) {
  if (rank === 1) return { tier: 'gold', crown: true };
  if (rank === 2) return { tier: 'silver', crown: false };
  if (rank === 3) return { tier: 'bronze', crown: false };
  return { tier: 'rest', crown: false };
}

/** The signed-in student's line, when they appear in the list. */
export const myRow = (rows, meId) => (rows || []).find(r => String(r._id) === String(meId)) || null;
