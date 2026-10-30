import { levelFor, homeworkPoints, celebrationFor, LEVELS } from './gamify';

describe('levelFor', () => {
  it('finds the level and progress to the next one', () => {
    expect(levelFor(0).level.id).toBe('rookie');
    expect(levelFor(75)).toMatchObject({ pct: 25, toNext: 75, next: { id: 'achiever' } });
    expect(levelFor(75).level.id).toBe('rising');
  });
  it('tops out at the last level', () => {
    const top = levelFor(9999);
    expect(top.level.id).toBe(LEVELS[LEVELS.length - 1].id);
    expect(top).toMatchObject({ next: null, pct: 100, toNext: 0 });
  });
  it('treats junk as zero', () => {
    expect(levelFor(undefined).level.id).toBe('rookie');
    expect(levelFor(-5).pct).toBe(0);
  });
});

describe('homeworkPoints', () => {
  const rules = { gradeMax: 70, onTime: 20, early: 10, lateGradeFactor: 0.5 };
  it('adds the on-time and early bonuses', () => {
    expect(homeworkPoints({ gradePct: 100, timing: 'early' }, rules).total).toBe(100);
    expect(homeworkPoints({ gradePct: 100, timing: 'ontime' }, rules).total).toBe(90);
  });
  it('halves the grade part and drops bonuses when late', () => {
    expect(homeworkPoints({ gradePct: 100, timing: 'late' }, rules)).toEqual({ grade: 35, onTime: 0, early: 0, total: 35 });
  });
});

describe('celebrationFor', () => {
  const history = [
    { title: 'HW 1', source: 'assignment', total: 40, awardedAt: '2026-10-30T10:00:00Z' },
    { title: 'Old', source: 'video', total: 2, awardedAt: '2026-10-01T10:00:00Z' }
  ];
  const prev = { points: 20, rank: 5, at: '2026-10-20T00:00:00Z' };

  it('stays quiet on the first visit and when nothing changed', () => {
    expect(celebrationFor(null, { points: 10, rank: 1, history })).toBeNull();
    expect(celebrationFor(prev, { points: 20, rank: 5, history: [] })).toBeNull();
  });
  it('reports points gained, what earned them and a climb', () => {
    expect(celebrationFor(prev, { points: 60, rank: 3, history })).toEqual({
      gained: 40, items: [{ title: 'HW 1', source: 'assignment', total: 40 }], rankChange: 2, rank: 3
    });
  });
  it('reports a drop even when no points were gained', () => {
    expect(celebrationFor(prev, { points: 20, rank: 8, history: [] })).toMatchObject({ gained: 0, rankChange: -3 });
  });
  it('does not show a negative gain after a session reset', () => {
    expect(celebrationFor(prev, { points: 0, rank: 5, history: [] })).toBeNull();
  });
});
