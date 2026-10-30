const { parsePeriod, trendMonths, buildSummary, buildCsv } = require('../utils/incomeStats');

const now = new Date(2026, 9, 27, 12); // 27 Oct 2026
const d = (y, m, day = 15) => new Date(y, m - 1, day, 12);
const students = [
  { _id: 'a', name: 'Aya Ali' }, { _id: 'b', name: 'Bassem Bakr' }, { _id: 'c', name: 'Carol Cairo' }, { _id: 'z', name: 'Zero Payer' }
];
const pay = (over) => ({ _id: Math.random().toString(36), student: 'a', amount: 500, status: 'paid', planType: 'monthly', createdAt: d(2026, 10, 1), dueDate: d(2026, 10, 10), paidDate: d(2026, 10, 12), ...over });
const ent = (over) => ({ _id: Math.random().toString(36), kind: 'expense', label: 'Rent', amount: 200, date: d(2026, 10, 5), ...over });

describe('parsePeriod', () => {
  it('reads month, year and all, and falls back to the current month', () => {
    expect(parsePeriod('2026-03').key).toBe('2026-03');
    expect(parsePeriod('2026').type).toBe('year');
    expect(parsePeriod('all').type).toBe('all');
    expect(parsePeriod('nonsense', now).key).toBe('2026-10');
    expect(parsePeriod('2026-13', now).key).toBe('2026-10');
  });
  it('month ends are exclusive', () => {
    const p = parsePeriod('2026-10');
    expect(p.start).toEqual(new Date(2026, 9, 1));
    expect(p.end).toEqual(new Date(2026, 10, 1));
  });
  it('charts 12 months', () => {
    expect(trendMonths(parsePeriod('2026-10'))).toHaveLength(12);
    expect(trendMonths(parsePeriod('2026-10'))[11]).toBe('2026-10');
    expect(trendMonths(parsePeriod('2026-10'))[0]).toBe('2025-11');
    expect(trendMonths(parsePeriod('2025'))[0]).toBe('2025-01');
  });
});

describe('buildSummary', () => {
  it('counts plan money on the day it was paid and manual income on its own date', () => {
    const s = buildSummary({
      payments: [pay({ amount: 500 }), pay({ amount: 300, paidDate: d(2026, 9, 20) }), pay({ amount: 100, status: 'pending', paidDate: undefined })],
      entries: [ent({ kind: 'income', label: 'Workshop', amount: 150 }), ent({ amount: 200 }), ent({ amount: 999, date: d(2026, 9, 1) })],
      students, period: '2026-10', now
    });
    expect(s.totals).toMatchObject({ fromPlans: 500, fromManual: 150, income: 650, expenses: 200, profit: 450 });
    expect(s.totals.margin).toBe(69);
  });

  it('never counts cancelled plans, and a plan in review is not income yet', () => {
    const s = buildSummary({ payments: [pay({ status: 'cancelled', amount: 900 }), pay({ status: 'review', amount: 400, paidDate: undefined })], students, period: '2026-10', now });
    expect(s.totals.income).toBe(0);
  });

  it('splits income by source and expenses by category, biggest first', () => {
    const s = buildSummary({
      payments: [pay({ amount: 600, planType: 'package' }), pay({ amount: 200, planType: 'monthly' })],
      entries: [ent({ kind: 'income', label: 'Cash', amount: 200 }), ent({ label: 'Rent', amount: 300 }), ent({ label: 'Zoom', amount: 100 }), ent({ label: 'Rent', amount: 100 })],
      students, period: '2026-10', now
    });
    expect(s.bySource.map(x => [x.label, x.amount])).toEqual([['Packages', 600], ['Monthly plans', 200], ['Cash', 200]]);
    expect(s.expenseByCategory.map(x => [x.label, x.amount])).toEqual([['Rent', 400], ['Zoom', 100]]);
    expect(s.expenseByCategory[0].share).toBe(80);
  });

  it('ranks top payers and lists the lowest, with students who paid nothing last in line', () => {
    const s = buildSummary({
      payments: [pay({ student: 'a', amount: 900 }), pay({ student: 'b', amount: 400 }), pay({ student: { _id: 'b' }, amount: 100 }), pay({ student: 'c', amount: 50 })],
      entries: [ent({ kind: 'income', label: 'Cash', amount: 75, student: 'z' })],
      students, period: '2026-10', now
    });
    expect(s.topPayers.map(x => [x.name, x.amount])).toEqual([['Aya Ali', 900], ['Bassem Bakr', 500], ['Zero Payer', 75], ['Carol Cairo', 50]]);
    expect(s.lowestPayers[0].name).toBe('Carol Cairo');
    const none = buildSummary({ payments: [], students, period: '2026-10', now });
    expect(none.topPayers).toEqual([]);
    expect(none.lowestPayers).toHaveLength(4);
  });

  it('lists who owes, most late first', () => {
    const s = buildSummary({
      payments: [
        pay({ _id: 'p1', status: 'pending', amount: 300, dueDate: d(2026, 10, 20), student: { _id: 'a', firstName: 'Aya', lastName: 'Ali' } }),
        pay({ _id: 'p2', status: 'overdue', amount: 200, dueDate: d(2026, 9, 27), student: 'b' }),
        pay({ _id: 'p3', status: 'pending', amount: 100, dueDate: d(2026, 11, 5), student: 'c' })
      ],
      students, period: '2026-10', now
    });
    expect(s.outstanding).toMatchObject({ total: 600, overdue: 500, count: 3 });
    expect(s.outstanding.items.map(i => [i.id, i.daysLate])).toEqual([['p2', 30], ['p1', 7], ['p3', 0]]);
    expect(s.outstanding.items[1].name).toBe('Aya Ali');
  });

  it('collection rate and days to pay', () => {
    const s = buildSummary({
      payments: [pay({ amount: 600, createdAt: d(2026, 10, 2), paidDate: d(2026, 10, 12) }), pay({ amount: 400, status: 'pending', paidDate: undefined, dueDate: d(2026, 10, 25) })],
      students, period: '2026-10', now
    });
    expect(s.collection).toMatchObject({ billed: 1000, collected: 600, rate: 60, avgDaysToPay: 10 });
    expect(buildSummary({ payments: [], students, period: '2026-10', now }).collection.rate).toBeNull();
  });

  it('forecasts next month from open plans and reports what is carried over', () => {
    const s = buildSummary({
      payments: [
        pay({ status: 'pending', amount: 500, dueDate: d(2026, 11, 8), paidDate: undefined }),
        pay({ status: 'review', amount: 250, dueDate: d(2026, 11, 20), paidDate: undefined }),
        pay({ status: 'pending', amount: 100, dueDate: d(2026, 10, 2), paidDate: undefined }),
        pay({ status: 'paid', amount: 999, dueDate: d(2026, 11, 8) })
      ],
      students, period: '2026-10', now
    });
    expect(s.forecast).toMatchObject({ month: '2026-11', expected: 750, count: 2, carryOver: 100, carryCount: 1 });
  });

  it('builds a 12 month trend', () => {
    const s = buildSummary({ payments: [pay({ amount: 500, paidDate: d(2026, 9, 3) })], entries: [ent({ amount: 120, date: d(2026, 9, 9) })], students, period: '2026-10', now });
    expect(s.trend).toHaveLength(12);
    expect(s.trend.find(t => t.month === '2026-09')).toEqual({ month: '2026-09', income: 500, expenses: 120, profit: 380 });
  });

  it('all-time and year periods sum everything inside them', () => {
    const payments = [pay({ amount: 100, paidDate: d(2025, 3, 3) }), pay({ amount: 200, paidDate: d(2026, 3, 3) })];
    expect(buildSummary({ payments, students, period: 'all', now }).totals.income).toBe(300);
    expect(buildSummary({ payments, students, period: '2025', now }).totals.income).toBe(100);
  });
});

describe('buildCsv', () => {
  it('lists income and expenses with signs, newest first, and escapes commas', () => {
    const csv = buildCsv({
      payments: [pay({ amount: 500, description: 'Nov, package', student: { firstName: 'Aya', lastName: 'Ali' } })],
      entries: [ent({ label: 'Rent', amount: 200, date: d(2026, 10, 20), note: 'Oct "hall"' })],
      period: '2026-10', now
    });
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Date,Type,Source / category,Student,Amount (EGP),Note');
    expect(lines[1]).toBe('2026-10-20,Expense,Rent,,-200.00,"Oct ""hall"""');
    expect(lines[2]).toBe('2026-10-12,Income,"Nov, package",Aya Ali,500.00,');
  });
});
