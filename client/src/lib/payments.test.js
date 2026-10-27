import { daysFromNow, effectiveStatus, paymentSteps, paymentTotals } from './payments';

const now = new Date('2026-10-27T12:00:00');

describe('payments helpers', () => {
  it('counts whole days to a due date', () => {
    expect(daysFromNow('2026-10-30T23:00:00', now)).toBe(3);
    expect(daysFromNow('2026-10-27T01:00:00', now)).toBe(0);
    expect(daysFromNow('2026-10-25T10:00:00', now)).toBe(-2);
  });

  it('shows a late pending payment as overdue, but never a paid or in-review one', () => {
    expect(effectiveStatus({ status: 'pending', dueDate: '2026-10-01' }, now)).toBe('overdue');
    expect(effectiveStatus({ status: 'pending', dueDate: '2026-11-01' }, now)).toBe('pending');
    expect(effectiveStatus({ status: 'pending' }, now)).toBe('pending');
    expect(effectiveStatus({ status: 'review', dueDate: '2026-10-01' }, now)).toBe('review');
    expect(effectiveStatus({ status: 'paid', dueDate: '2026-10-01' }, now)).toBe('paid');
  });

  it('marks the steps reached so far', () => {
    const done = (s) => paymentSteps({ status: s }).map(x => x.done);
    expect(done('pending')).toEqual([true, false, false]);
    expect(done('review')).toEqual([true, true, false]);
    expect(done('paid')).toEqual([true, true, true]);
  });

  it('totals due, in review and paid separately', () => {
    const t = paymentTotals([
      { amount: 500, status: 'paid' },
      { amount: 300, status: 'review' },
      { amount: 200, status: 'pending', dueDate: '2026-12-01' },
      { amount: 100, status: 'pending', dueDate: '2026-10-01' },
      { amount: 999, status: 'cancelled' }
    ], now);
    expect(t).toMatchObject({ paid: 500, review: 300, due: 300, overdue: 100 });
  });
});
