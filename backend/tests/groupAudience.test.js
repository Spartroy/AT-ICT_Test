const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const AppSettings = require('../models/AppSettings');
const svc = require('../services/groups');

const ids = (...list) => list.map(id => ({ _id: id }));

/** User.find answers by the query it receives: group members vs. the hand-picked ids. */
const stubUsers = ({ everyone = [], members = {}, valid = null }) => {
  jest.spyOn(AppSettings, 'getGlobal').mockResolvedValue({ groupsConfig: { groups: [{ code: 'A', name: 'GRP A' }, { code: 'B', name: 'GRP B' }] } });
  jest.spyOn(User, 'find').mockImplementation((q) => {
    const select = (rows) => ({ select: jest.fn().mockResolvedValue(rows) });
    if (q['studentInfo.group']) return select(q['studentInfo.group'].$in.flatMap(c => members[c] || []));
    if (q._id) return select(valid ?? q._id.$in.map(id => ({ _id: id })));
    return select(everyone);
  });
};

afterEach(() => jest.restoreAllMocks());

describe('resolveAudience', () => {
  it('everyone: all approved students and no groups', async () => {
    stubUsers({ everyone: ids('s1', 's2', 's3') });
    const r = await svc.resolveAudience({ assignToAll: 'true' });
    expect(r.studentIds).toHaveLength(3);
    expect(r.groups).toEqual([]);
  });

  it('a group: its members, and the group is remembered', async () => {
    stubUsers({ members: { A: ids('a1', 'a2'), B: ids('b1') } });
    const r = await svc.resolveAudience({ groups: ['a'] });
    expect(r.studentIds.map(String)).toEqual(['a1', 'a2']);
    expect(r.groups).toEqual(['A']);
  });

  it('two groups plus a hand-picked student, without duplicates (also from a JSON string)', async () => {
    stubUsers({ members: { A: ids('a1'), B: ids('b1') } });
    const r = await svc.resolveAudience({ groups: JSON.stringify(['A', 'B']), selectedStudents: JSON.stringify(['b1', 'x9']) });
    expect(r.studentIds.map(String).sort()).toEqual(['a1', 'b1', 'x9']);
  });

  it('rejects unknown groups, empty groups and an empty choice', async () => {
    stubUsers({ members: { A: [], B: ids('b1') } });
    expect((await svc.resolveAudience({ groups: ['Z'] })).error).toMatch(/Unknown group/);
    expect((await svc.resolveAudience({ groups: ['A'] })).error).toMatch(/no students/);
    expect((await svc.resolveAudience({})).error).toMatch(/choose a group/i);
  });

  it('rejects hand-picked students who are not valid', async () => {
    stubUsers({ valid: ids('s1') });
    expect((await svc.resolveAudience({ selectedStudents: ['s1', 's2'] })).error).toMatch(/not valid or active/);
  });
});

describe('addManyToGroupContent', () => {
  it('adds students to open work made for the group, skipping ones who already have it', async () => {
    const hw = { assignedTo: [{ student: 's1' }], save: jest.fn().mockResolvedValue(undefined) };
    const quiz = { assignedTo: [], save: jest.fn().mockResolvedValue(undefined) };
    const find = jest.spyOn(Assignment, 'find').mockResolvedValue([hw]);
    jest.spyOn(Quiz, 'find').mockResolvedValue([quiz]);

    const added = await svc.addManyToGroupContent(['s1', 's2'], 'A');

    expect(find.mock.calls[0][0]).toMatchObject({ groups: 'A', isActive: true });
    expect(hw.assignedTo.map(a => String(a.student))).toEqual(['s1', 's2']);
    expect(quiz.assignedTo).toHaveLength(2);
    expect(added).toEqual({ assignments: 1, quizzes: 1 });
  });

  it('does nothing without a group or students', async () => {
    const find = jest.spyOn(Assignment, 'find');
    expect(await svc.addManyToGroupContent([], 'A')).toEqual({ assignments: 0, quizzes: 0 });
    expect(await svc.addManyToGroupContent(['s1'], null)).toEqual({ assignments: 0, quizzes: 0 });
    expect(find).not.toHaveBeenCalled();
  });
});
