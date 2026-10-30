// Pure rules behind the points guide (levels, calculator) and the "welcome back" celebration.

export const LEVELS = [
  { id: 'rookie', name: 'Rookie', min: 0, emoji: '🌱' },
  { id: 'rising', name: 'Rising Star', min: 50, emoji: '⭐' },
  { id: 'achiever', name: 'Achiever', min: 150, emoji: '🚀' },
  { id: 'champion', name: 'Champion', min: 300, emoji: '🏆' },
  { id: 'legend', name: 'Legend', min: 500, emoji: '👑' }
];

/** Level for a points total, the next level (or null at the top) and progress towards it. */
export function levelFor(points) {
  const p = Math.max(0, Number(points) || 0);
  let idx = 0;
  LEVELS.forEach((l, i) => { if (p >= l.min) idx = i; });
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  if (!next) return { level, next: null, pct: 100, toNext: 0 };
  return { level, next, pct: Math.round(((p - level.min) / (next.min - level.min)) * 100), toNext: next.min - p };
}

/** Homework points for the guide's calculator. timing: 'early' | 'ontime' | 'late'. Mirrors the rules shown in the guide. */
export function homeworkPoints({ gradePct, timing }, rules) {
  const pct = Math.min(100, Math.max(0, Number(gradePct) || 0)) / 100;
  const grade = Math.round(rules.gradeMax * pct * (timing === 'late' ? rules.lateGradeFactor : 1));
  const onTime = timing === 'early' || timing === 'ontime' ? rules.onTime : 0;
  const early = timing === 'early' ? rules.early : 0;
  return { grade, onTime, early, total: grade + onTime + early };
}

/**
 * Compares what the student last saw with now.
 *   prev    { points, rank, at }  saved the last time they were in the portal (null on the first visit)
 *   current { points, rank, history }
 * Returns null when there is nothing to celebrate, else { gained, items, rankChange, rank }.
 * rankChange: positive = climbed that many places, negative = dropped, 0 = same.
 */
export function celebrationFor(prev, current) {
  if (!prev) return null;
  const gained = Math.max(0, (current.points || 0) - (prev.points || 0));
  const since = prev.at ? new Date(prev.at).getTime() : 0;
  const items = (current.history || [])
    .filter(h => h.total > 0 && h.awardedAt && new Date(h.awardedAt).getTime() > since)
    .map(h => ({ title: h.title, source: h.source, total: h.total }));
  const rankChange = prev.rank && current.rank ? prev.rank - current.rank : 0;
  if (!gained && !rankChange) return null;
  return { gained, items, rankChange, rank: current.rank || null };
}
