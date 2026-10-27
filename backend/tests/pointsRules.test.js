const { RULES, assignmentPoints, quizPoints, effortPoints, streakReached } = require('../utils/pointsRules');

const day = 24 * 3600 * 1000;
const due = new Date('2026-10-20T20:00:00Z');
const at = (ms) => new Date(due.getTime() + ms);

describe('assignmentPoints', () => {
  it('full marks, handed in two days early: 70 + 20 + 10', () => {
    expect(assignmentPoints({ score: 20, maxScore: 20, submissionDate: at(-2 * day), dueDate: due })).toMatchObject({ base: 70, onTimeBonus: 20, earlyBonus: 10, total: 100, onTime: true });
  });

  it('on time but not early: grade + 20', () => {
    expect(assignmentPoints({ score: 10, maxScore: 20, submissionDate: at(-2 * 3600 * 1000), dueDate: due })).toMatchObject({ base: 35, earlyBonus: 0, total: 55 });
  });

  it('exactly 24 hours early counts as early', () => {
    expect(assignmentPoints({ score: 20, maxScore: 20, submissionDate: at(-day), dueDate: due }).earlyBonus).toBe(10);
  });

  it('late work earns half the grade part and no bonus', () => {
    expect(assignmentPoints({ score: 20, maxScore: 20, submissionDate: at(60 * 1000), dueDate: due })).toMatchObject({ base: 35, bonusPoints: 0, total: 35, onTime: false, late: true });
  });

  it('never goes above 100 or below 0, and survives a zero max', () => {
    expect(assignmentPoints({ score: 99, maxScore: 20, submissionDate: at(-2 * day), dueDate: due }).total).toBe(100);
    expect(assignmentPoints({ score: -5, maxScore: 20, submissionDate: at(-2 * day), dueDate: due }).base).toBe(0);
    expect(assignmentPoints({ score: 5, maxScore: 0, submissionDate: at(-2 * day), dueDate: due }).base).toBe(0);
  });
});

describe('quizPoints', () => {
  it('is the mark out of 100', () => {
    expect(quizPoints({ score: 15, maxScore: 30 })).toEqual({ base: 50, bonusPoints: 0, total: 50 });
    expect(quizPoints({ score: 30, maxScore: 30 }).total).toBe(100);
  });
});

describe('effortPoints', () => {
  it('pays the listed amounts', () => {
    expect(effortPoints('video')).toBe(RULES.effort.video);
    expect(effortPoints('note')).toBe(3);
    expect(effortPoints('pastpaper')).toBe(5);
  });
  it('stops at the daily cap and gives only what is left', () => {
    expect(effortPoints('pastpaper', 18)).toBe(2);
    expect(effortPoints('video', 20)).toBe(0);
  });
  it('live classes are outside the cap', () => {
    expect(effortPoints('live', 20)).toBe(5);
  });
  it('unknown sources pay nothing', () => {
    expect(effortPoints('nope')).toBe(0);
  });
});

describe('streakReached', () => {
  const e = (n, onTime) => ({ onTime, awardedAt: new Date(2026, 9, n) });
  it('fires on every third on-time homework in a row', () => {
    expect(streakReached([e(1, true), e(2, true)])).toBe(false);
    expect(streakReached([e(1, true), e(2, true), e(3, true)])).toBe(true);
    expect(streakReached([e(1, true), e(2, true), e(3, true), e(4, true)])).toBe(false);
    expect(streakReached([1, 2, 3, 4, 5, 6].map(n => e(n, true)))).toBe(true);
  });
  it('a late one breaks the run', () => {
    expect(streakReached([e(1, true), e(2, true), e(3, false), e(4, true), e(5, true)])).toBe(false);
    expect(streakReached([e(1, true), e(2, false), e(3, true), e(4, true), e(5, true)])).toBe(true);
  });
  it('empty history has no streak', () => {
    expect(streakReached([])).toBe(false);
  });
});

describe('awardEffort', () => {
  const User = require('../models/User');
  const { awardEffort } = require('../utils/pointsHelper');
  afterEach(() => jest.restoreAllMocks());

  const student = (history = []) => {
    const u = { role: 'student', studentInfo: { points: { total: 0, currentSession: 0, history } }, markModified: jest.fn(), save: jest.fn(async () => u) };
    jest.spyOn(User, 'findById').mockResolvedValue(u);
    return u;
  };

  it('pays an item once', async () => {
    const u = student();
    expect(await awardEffort('s1', 'video', { id: 'v1' }, 'Watched: Intro')).toBe(2);
    expect(await awardEffort('s1', 'video', { id: 'v1' }, 'Watched: Intro')).toBe(0);
    expect(u.studentInfo.points.total).toBe(2);
    expect(u.studentInfo.points.history).toHaveLength(1);
  });

  it('shares a daily cap across videos, notes and past papers', async () => {
    const today = new Date();
    const u = student([{ source: 'pastpaper', sourceKey: 'a', total: 18, awardedAt: today }]);
    expect(await awardEffort('s1', 'pastpaper', { key: 'b' }, 'Past paper')).toBe(2);
    expect(await awardEffort('s1', 'note', { id: 'n1' }, 'Read')).toBe(0);
    // the capped item is recorded with 0 points so marking it again can't earn it later
    expect(u.studentInfo.points.history.some(h => h.sourceId === 'n1' && h.total === 0)).toBe(true);
  });

  it('yesterday does not count toward today', async () => {
    const yesterday = new Date(Date.now() - 36 * 3600 * 1000);
    student([{ source: 'pastpaper', sourceKey: 'a', total: 20, awardedAt: yesterday }]);
    expect(await awardEffort('s1', 'video', { id: 'v9' }, 'Watched')).toBe(2);
  });

  it('live attendance is paid outside the cap', async () => {
    student([{ source: 'pastpaper', sourceKey: 'a', total: 20, awardedAt: new Date() }]);
    expect(await awardEffort('s1', 'live', { id: 'l1' }, 'Joined')).toBe(5);
  });
});

describe('awardPoints streak', () => {
  const User = require('../models/User');
  const Assignment = require('../models/Assignment');
  const Quiz = require('../models/Quiz');
  const { awardPoints } = require('../utils/pointsHelper');
  afterEach(() => jest.restoreAllMocks());

  const run = async (history, payload) => {
    const u = { role: 'student', studentInfo: { points: { total: 0, currentSession: 0, history } }, markModified: jest.fn(), save: jest.fn(async () => u) };
    jest.spyOn(User, 'findById').mockResolvedValue(u);
    jest.spyOn(Assignment, 'find').mockResolvedValue([]);
    jest.spyOn(Quiz, 'find').mockResolvedValue([]);
    await awardPoints('s1', payload);
    return u.studentInfo.points;
  };
  const hw = (id, n) => ({ source: 'assignment', sourceId: id, onTime: true, total: 80, awardedAt: new Date(2026, 9, n) });
  const pay = (id) => ({ source: 'assignment', sourceId: id, title: 'Third', basePoints: 50, bonusPoints: 30, total: 80, onTime: true });

  it('adds +10 when the third on-time homework in a row is graded, once', async () => {
    const points = await run([hw('a', 1), hw('b', 2)], pay('c'));
    expect(points.history.filter(h => h.source === 'streak')).toHaveLength(1);
    expect(points.total).toBe(90);
  });

  it('no bonus after only two, or when a late one broke the run', async () => {
    expect((await run([hw('a', 1)], pay('b'))).total).toBe(80);
    const late = { ...hw('b', 2), onTime: false };
    expect((await run([hw('a', 1), late], pay('c'))).total).toBe(80);
  });

  it('regrading the homework that completed the streak does not pay it again', async () => {
    const points = await run([hw('a', 1), hw('b', 2), hw('c', 3), { source: 'streak', sourceKey: 'c', total: 10, awardedAt: new Date(2026, 9, 3) }], pay('c'));
    expect(points.history.filter(h => h.source === 'streak')).toHaveLength(1);
  });
});
