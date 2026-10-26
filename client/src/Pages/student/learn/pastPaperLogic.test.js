import { groupPastPapers, paperKey, resolveSelection, shelvesOf, variantColor, yearStats } from './pastPaperLogic';

const p = (paper, year, session, variant) => ({ _id: `${paper}${year}${session}${variant}`, paper, year, session, variant });

describe('groupPastPapers', () => {
  const list = [p(2, 2023, 'nov', 1), p(2, 2024, 'jun', 2), p(2, 2024, 'jun', 1), p(1, 2024, 'jun', 1), p(2, 2024, 'nov', 1)];

  it('lists years newest first with Jun before Nov', () => {
    const groups = groupPastPapers(list, 2);
    expect(groups.map(g => g.year)).toEqual([2024, 2023]);
    expect(groups[0].sessions.map(s => s.session)).toEqual(['jun', 'nov']);
  });

  it('orders variants V1, V2…', () => {
    expect(groupPastPapers(list, 2)[0].sessions[0].variants.map(v => v.variant)).toEqual([1, 2]);
  });

  it('only includes the chosen paper and skips empty sessions', () => {
    const groups = groupPastPapers(list, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0].sessions.map(s => s.session)).toEqual(['jun']);
    expect(groupPastPapers(list, 3)).toEqual([]);
  });
});

describe('shelvesOf', () => {
  const years = [2025, 2024, 2023, 2022, 2021].map(year => ({ year, sessions: [] }));

  it('puts two practical years on each shelf, newest first, with a short last shelf', () => {
    expect(shelvesOf(years, 2).map(s => s.map(y => y.year))).toEqual([[2025, 2024], [2023, 2022], [2021]]);
    expect(shelvesOf(years, 3)).toHaveLength(3);
  });

  it('keeps one year per shelf for theory', () => {
    expect(shelvesOf(years, 1).map(s => s.length)).toEqual([1, 1, 1, 1, 1]);
  });

  it('handles no years', () => {
    expect(shelvesOf([], 2)).toEqual([]);
  });
});

describe('variantColor', () => {
  it('gives every variant its own colour', () => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(variantColor);
    expect(new Set(all).size).toBe(9);
    expect(variantColor(1)).toBe('var(--pv-1)');
    expect(variantColor.index(2)).toBe(2);
  });

  it('wraps around instead of failing for large variant numbers', () => {
    expect(variantColor.index(10)).toBe(1);
    expect(variantColor.index(0)).toBe(1);
  });
});

describe('practised ticks', () => {
  const list = [p(2, 2024, 'jun', 1), p(2, 2024, 'jun', 2), p(2, 2024, 'nov', 1), p(2, 2023, 'nov', 1)];
  const years = groupPastPapers(list, 2);

  it('builds the same key the backend stores', () => {
    expect(paperKey(p(2, 2024, 'jun', 1))).toBe('2-2024-jun-1');
  });

  it('counts done variants per year', () => {
    const done = new Set(['2-2024-jun-1', '2-2024-nov-1', '2-2020-jun-1']);
    expect(yearStats(years, done)).toEqual([{ year: 2024, total: 3, done: 2 }, { year: 2023, total: 1, done: 0 }]);
  });

  it('restores a saved year/session and falls back to the newest', () => {
    expect(resolveSelection(years, { year: 2023, session: 'nov' })).toEqual({ year: 2023, session: 'nov' });
    expect(resolveSelection(years, { year: 2023, session: 'jun' })).toEqual({ year: 2023, session: 'nov' });
    expect(resolveSelection(years, { year: 1999, session: 'nov' })).toEqual({ year: 2024, session: 'nov' });
    expect(resolveSelection(years, { year: 1999, session: 'dec' })).toEqual({ year: 2024, session: 'jun' });
    expect(resolveSelection([], {})).toEqual({ year: null, session: null });
  });
});
