import { weekTotals, tierFor, badgesFor, mondayOf, previousOf, ratingAverage, shareText } from './reportLogic';

const lesson = (hw, quiz, contribution = 0) => ({ hw, quiz, contribution });

describe('weekTotals', () => {
  it('adds marks and counts missed work as zero of its maximum', () => {
    const lessons = [
      lesson({ mark: 7, max: 10, state: 'late' }, { mark: null, max: 30, state: 'missed' }),
      lesson({ mark: 18, max: 20, state: 'done' }, { mark: null, max: null, state: 'none' })
    ];
    expect(weekTotals(lessons)).toEqual({ gained: 25, possible: 60, percent: 42 });
  });
  it('has no percentage before anything is marked', () => {
    expect(weekTotals([lesson({ state: 'none' }, { state: 'none' })]).percent).toBeNull();
  });
});

describe('tierFor', () => {
  it.each([[95, 'top'], [80, 'great'], [65, 'good'], [45, 'ok'], [10, 'low'], [null, 'none']])('%s%% is %s', (p, id) => {
    expect(tierFor(p).id).toBe(id);
  });
});

describe('badgesFor', () => {
  const report = {
    lessons: [
      lesson({ title: 'HW 1', state: 'done', mark: 9, max: 10 }, { title: 'Q1', state: 'done', mark: 28, max: 30 }, 5),
      lesson({ title: 'HW 2', state: 'late', mark: 8, max: 10 }, { state: 'none' }, 4)
    ],
    attitude: [{ label: 'Focus', rating: 5 }]
  };
  it('awards homework, quiz and class-star badges', () => {
    const ids = badgesFor(report, null).map(b => b.id);
    expect(ids).toEqual(expect.arrayContaining(['hw', 'quiz', 'talk']));
  });
  it('awards "on the rise" when the week beat the last one by 5 or more', () => {
    expect(badgesFor(report, { percent: 60 }).map(b => b.id)).toContain('up');
    expect(badgesFor(report, { percent: 88 }).map(b => b.id)).not.toContain('up');
  });
  it('no homework badge when one was missed', () => {
    const missed = { ...report, lessons: [lesson({ title: 'HW', state: 'missed', mark: null, max: 10 }, { state: 'none' })] };
    expect(badgesFor(missed, null).map(b => b.id)).not.toContain('hw');
  });
});

describe('week helpers', () => {
  it('finds the Monday of a week, and shifts by weeks', () => {
    expect(mondayOf(new Date(2026, 10, 5))).toBe('2026-11-02');
    expect(mondayOf(new Date(2026, 10, 8))).toBe('2026-11-02');
    expect(mondayOf(new Date(2026, 10, 5), -1)).toBe('2026-10-26');
  });
  it('previousOf gives the next older report', () => {
    const list = [{ _id: 'c' }, { _id: 'b' }, { _id: 'a' }];
    expect(previousOf(list, list[0])._id).toBe('b');
    expect(previousOf(list, list[2])).toBeNull();
  });
  it('averages only rated items', () => {
    expect(ratingAverage({ lessons: [{ contribution: 4 }, { contribution: 0 }], attitude: [{ rating: 5 }] })).toBe(4.5);
  });
  it('writes a share message', () => {
    const text = shareText({ name: 'Sara Ali', weekNumber: 3, gained: 25, possible: 50, percent: 50, comments: 'Good week.' }, 'https://x/y');
    expect(text).toContain('Week 3');
    expect(text).toContain('25 / 50 (50%)');
    expect(text).toContain('https://x/y');
  });
});
