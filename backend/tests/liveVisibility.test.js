const sift = require('sift');
const Schedule = require('../models/Schedule');
const { visibleTo } = require('../controllers/liveController');

const sid = (n) => `s${n}`;
const user = (n, group) => ({ _id: sid(n), studentInfo: { group } });
const live = (over) => ({ _id: 'l', status: 'live', students: [], groups: [], ...over });
const sees = async (u, session, schedules = []) => {
  jest.spyOn(Schedule, 'find').mockReturnValue({ select: () => ({ lean: async () => schedules.map(_id => ({ _id })) }) });
  return [session].filter(sift(await visibleTo(u))).length === 1;
};

afterEach(() => jest.restoreAllMocks());

describe('who sees a live class', () => {
  it('everyone sees an open class', async () => {
    expect(await sees(user(1), live())).toBe(true);
  });

  it('only named students see a class limited to them', async () => {
    const session = live({ students: [sid(1)] });
    expect(await sees(user(1), session)).toBe(true);
    expect(await sees(user(2), session)).toBe(false);
  });

  it('a group class is for that group only', async () => {
    const session = live({ groups: ['A'] });
    expect(await sees(user(1, 'A'), session)).toBe(true);
    expect(await sees(user(2, 'B'), session)).toBe(false);
    expect(await sees(user(3), session)).toBe(false);
  });

  it('a group member sees a class tied to their group schedule even if they were not named on it (the bug)', async () => {
    // Class made from a schedule slot: only the student named on the schedule was stored, the group's other members were not.
    const session = live({ students: [sid(9)], slot: { schedule: 'sch1' } });
    expect(await sees(user(1, 'A'), session)).toBe(false); // without the schedule link they would be left out
    expect(await sees(user(1, 'A'), session, ['sch1'])).toBe(true); // the schedule they belong to brings the class to them
    expect(await sees(user(9), session)).toBe(true);
  });

  it('a schedule link never overrides an explicit group limit', async () => {
    const session = live({ students: [sid(9)], groups: ['B'], slot: { schedule: 'sch1' } });
    expect(await sees(user(1, 'A'), session, ['sch1'])).toBe(false);
    expect(await sees(user(2, 'B'), session, ['sch1'])).toBe(true);
  });
});
