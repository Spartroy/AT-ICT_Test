// A small bridge: anything that earns points (marking a video done, joining a class…) calls announcePoints(n);
// PointsWatcher in the student portal then shows "+n pts" and refreshes the totals.
export const POINTS_EVENT = 'student:points';

export function announcePoints(points) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(POINTS_EVENT, { detail: { points: Number(points) || 0 } }));
}
