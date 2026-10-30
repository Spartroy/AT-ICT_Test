const { buildStandings, pointsBefore } = require('../services/standings');

const NOW = new Date('2026-10-30T12:00:00Z').getTime();
const hoursAgo = (h) => new Date(NOW - h * 3600 * 1000);
const student = (id, name, points, history = []) => ({
  _id: id, firstName: name, lastName: 'S', studentInfo: { group: 'A', points: { currentSession: points, total: points, history } }
});

describe('pointsBefore', () => {
  it('removes only the points awarded in the last 24 hours, never going below zero', () => {
    const s = student('1', 'Ann', 50, [{ awardedAt: hoursAgo(2), total: 20 }, { awardedAt: hoursAgo(30), total: 10 }]);
    expect(pointsBefore(s, NOW)).toBe(30);
    expect(pointsBefore(student('2', 'Bo', 5, [{ awardedAt: hoursAgo(1), total: 99 }]), NOW)).toBe(0);
  });
});

describe('buildStandings', () => {
  it('ranks everyone, not just three, highest points first', () => {
    const rows = buildStandings([student('1', 'A', 10), student('2', 'B', 40), student('3', 'C', 30), student('4', 'D', 20), student('5', 'E', 5)], NOW);
    expect(rows.map(r => r._id)).toEqual(['2', '3', '4', '1', '5']);
    expect(rows.map(r => r.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives tied students the same rank', () => {
    const rows = buildStandings([student('1', 'A', 10), student('2', 'B', 10), student('3', 'C', 5)], NOW);
    expect(rows.map(r => r.rank)).toEqual([1, 1, 3]);
  });

  it('reports movement: positive up, negative down, zero unchanged', () => {
    // Yesterday: A 30, B 20, C 10. Today B earned 20 and overtook A.
    const rows = buildStandings([
      student('A', 'A', 30),
      student('B', 'B', 40, [{ awardedAt: hoursAgo(3), total: 20 }]),
      student('C', 'C', 10)
    ], NOW);
    const move = Object.fromEntries(rows.map(r => [r._id, r.movement]));
    expect(move).toEqual({ B: 1, A: -1, C: 0 });
  });

  it('handles an empty list', () => {
    expect(buildStandings([], NOW)).toEqual([]);
  });
});
