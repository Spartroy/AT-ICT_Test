import { chartScale, currentMonth, fmtMoney, fmtShort, monthLong, monthName, periodTitle, periodValue } from './incomeFormat';

describe('income formatting', () => {
  it('formats money with thousands separators and drops empty decimals', () => {
    expect(fmtMoney(1500)).toBe('1,500 EGP');
    expect(fmtMoney(99.5)).toBe('99.50 EGP');
    expect(fmtMoney(0)).toBe('0 EGP');
    expect(fmtMoney(-250, 'USD')).toBe('-250 USD');
  });
  it('shortens axis labels', () => {
    expect([0, 950, 1250, 12000, 2500000, -1500].map(fmtShort)).toEqual(['0', '950', '1.3k', '12k', '2.5M', '-1.5k']);
  });
  it('names months', () => {
    expect(monthName('2026-03')).toBe('Mar');
    expect(monthLong('2026-10')).toBe('Oct 2026');
    expect(currentMonth(new Date(2026, 0, 5))).toBe('2026-01');
  });
  it('turns the picker into an API period and a title', () => {
    expect(periodValue({ mode: 'all', month: '2026-10', year: 2026 })).toBe('all');
    expect(periodValue({ mode: 'year', month: '2026-10', year: 2025 })).toBe('2025');
    expect(periodValue({ mode: 'month', month: '2026-10', year: 2026 })).toBe('2026-10');
    expect(periodTitle('all')).toBe('All time');
    expect(periodTitle('2026')).toBe('2026');
    expect(periodTitle('2026-10')).toMatch(/October 2026/);
  });
});

describe('chartScale', () => {
  const trend = [
    { month: '2026-08', income: 1000, expenses: 400, profit: 600 },
    { month: '2026-09', income: 500, expenses: 800, profit: -300 },
    { month: '2026-10', income: 0, expenses: 0, profit: 0 }
  ];
  it('puts the zero line between positive and negative values', () => {
    const s = chartScale(trend, { w: 300, h: 100 });
    expect(s.columns).toHaveLength(3);
    expect(s.zero).toBeGreaterThan(0);
    expect(s.zero).toBeLessThan(100);
    expect(s.ticks[0].y).toBe(0);
  });
  it('bars grow up from zero and shrink with the amount', () => {
    const s = chartScale(trend, { w: 300, h: 100 });
    const [aug, sep] = s.columns;
    expect(aug.income.h).toBeGreaterThan(aug.expenses.h);
    expect(sep.expenses.h).toBeGreaterThan(sep.income.h);
    expect(aug.income.y + aug.income.h).toBeCloseTo(s.zero, 0);
    expect(s.columns[2].income.h).toBe(0);
  });
  it('profit below zero is drawn under the zero line', () => {
    const s = chartScale(trend, { w: 300, h: 100 });
    expect(s.columns[1].profit.y).toBeGreaterThan(s.zero);
    expect(s.columns[0].profit.y).toBeLessThan(s.zero);
  });
  it('copes with no data at all', () => {
    const s = chartScale([], { w: 300, h: 100 });
    expect(s.columns).toEqual([]);
    const flat = chartScale([{ month: '2026-10', income: 0, expenses: 0, profit: 0 }], { w: 300, h: 100 });
    expect(Number.isFinite(flat.zero)).toBe(true);
  });
});
