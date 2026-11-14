const { buildParentReport, notificationLine } = require('../services/theoryQuiz/parentReport');

const item = (topic, marks) => ({ topic, chapterKey: '1', marks });
const grade = (max, awarded) => ({ max, final: true, awarded, rows: [] });

describe('the simple parent report', () => {
  const quiz = { title: 'Test 2', items: [item('Software', 4), item('Networks', 4), item('Security', 2)] };
  const attempt = { score: 5, maxScore: 10, penalty: 0, sentOff: false, submittedAt: new Date(), grades: [grade(4, 4), grade(4, 1), grade(2, 0)] };

  test('states the mark, a plain verdict and the weak points worst first', () => {
    const r = buildParentReport(quiz, attempt, 'Sam Ali');
    expect(r).toMatchObject({ percent: 50, headline: 'A pass, with room to improve', student: 'Sam Ali' });
    expect(r.weak.map(w => w.topic)).toEqual(['Security', 'Networks']);
    expect(r.strong.map(s => s.topic)).toEqual(['Software']);
    expect(r.next).toContain('Security, Networks');
  });

  test('mentions rule breaks neutrally and writes one short notification line', () => {
    const r = buildParentReport(quiz, { ...attempt, penalty: 2 }, 'Sam Ali');
    expect(r.conduct).toContain('2 marks');
    expect(notificationLine(r)).toBe('Sam: 5/10 (50%). Needs work: Security, Networks.');
  });
});
