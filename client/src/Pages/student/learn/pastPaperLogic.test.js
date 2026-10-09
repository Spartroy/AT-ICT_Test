import { groupPastPapers, variantColor } from './pastPaperLogic';

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
