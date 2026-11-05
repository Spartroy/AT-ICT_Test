const { weekStartOf, buildLessons, totals, cleanReport, ratingAverage } = require('../services/weeklyReport');
const { requirementFor } = require('../config/assistantAccess');

const NOW = new Date('2026-11-12T12:00:00Z');
const entry = (student, over = {}) => ({ student, status: 'assigned', ...over });

describe('weekStartOf', () => {
  it('returns the Monday of the week for any day', () => {
    expect(weekStartOf('2026-11-05').toISOString()).toBe('2026-11-02T00:00:00.000Z'); // Thursday
    expect(weekStartOf('2026-11-08').toISOString()).toBe('2026-11-02T00:00:00.000Z'); // Sunday
    expect(weekStartOf('2026-11-02').toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });
  it('rejects garbage', () => expect(weekStartOf('nope')).toBeNull());
});

describe('buildLessons', () => {
  const hw = [
    { _id: 'a2', title: 'HW 2', dueDate: '2026-11-05', maxScore: 20, assignedTo: [entry('s1', { status: 'graded', score: 18 })] },
    { _id: 'a1', title: 'HW 1', dueDate: '2026-11-03', maxScore: 10, assignedTo: [entry('s1', { status: 'graded', score: 7, isLate: true })] },
    { _id: 'a3', title: 'Someone else', dueDate: '2026-11-04', maxScore: 10, assignedTo: [entry('s2')] }
  ];
  const quizzes = [{ _id: 'q1', title: 'Quiz 1', startDate: '2026-11-04', maxScore: 30, assignedTo: [entry('s1')] }];

  it('lays homework out in date order, one per lesson, and keeps at least three lessons', () => {
    const lessons = buildLessons('s1', hw, quizzes, NOW);
    expect(lessons).toHaveLength(3);
    expect(lessons[0].hw).toMatchObject({ title: 'HW 1', state: 'late', mark: 7, max: 10 });
    expect(lessons[1].hw).toMatchObject({ title: 'HW 2', state: 'done', mark: 18 });
    expect(lessons[2].hw.state).toBe('none');
  });
  it('marks past work that was never handed in as missed', () => {
    const lessons = buildLessons('s1', hw, quizzes, NOW);
    expect(lessons[0].quiz).toMatchObject({ title: 'Quiz 1', state: 'missed', mark: null, max: 30 });
  });
  it('leaves future work unmarked', () => {
    const lessons = buildLessons('s1', hw, quizzes, new Date('2026-11-01'));
    expect(lessons[0].quiz.state).toBe('none');
  });
});

describe('totals', () => {
  it('adds marks and counts a missed item as zero out of its maximum', () => {
    const lessons = [
      { hw: { mark: 7, max: 10, state: 'late' }, quiz: { mark: null, max: 30, state: 'missed' } },
      { hw: { mark: 18, max: 20, state: 'done' }, quiz: { mark: null, max: 30, state: 'none' } }
    ];
    expect(totals(lessons)).toEqual({ gained: 25, possible: 60, percent: 42 });
  });
  it('has no percentage when nothing was marked', () => expect(totals([]).percent).toBeNull());
});

describe('cleanReport', () => {
  it('clamps ratings, drops unlabeled attitudes and limits lessons', () => {
    const r = cleanReport({
      weekNumber: '4', session: ' JUN 27 ', comments: ' good ',
      lessons: Array.from({ length: 9 }, () => ({ contribution: 9, hw: { state: 'weird', mark: '12', max: '10' } })),
      attitude: [{ label: 'Focus', rating: 3 }, { label: '', rating: 5 }]
    });
    expect(r.weekNumber).toBe(4);
    expect(r.lessons).toHaveLength(6);
    expect(r.lessons[0]).toMatchObject({ contribution: 5, hw: { state: 'none', mark: 12, max: 10 } });
    expect(r.attitude).toEqual([{ label: 'Focus', rating: 3 }]);
    expect(r.session).toBe('JUN 27');
  });
  it('averages only rated items', () => {
    expect(ratingAverage({ lessons: [{ contribution: 4 }, { contribution: 0 }], attitude: [{ rating: 5 }] })).toBe(4.5);
  });
});

describe('assistant access', () => {
  it('reports follow the submissions feature', () => {
    expect(requirementFor('GET', '/api/teacher/reports')).toEqual({ area: 'submissions', level: 'view' });
    expect(requirementFor('PUT', '/api/teacher/reports/abc')).toEqual({ area: 'submissions', level: 'edit' });
  });
});
