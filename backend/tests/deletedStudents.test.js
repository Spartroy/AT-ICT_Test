const mockCreate = jest.fn(async (doc) => doc);
jest.mock('../models/DeletedStudent', () => ({ create: (d) => mockCreate(d) }));

const mockCols = {};
const col = (name) => (mockCols[name] = mockCols[name] || { findOne: jest.fn(), find: jest.fn(), insertOne: jest.fn(), insertMany: jest.fn(), updateOne: jest.fn() });
jest.mock('../models/User', () => ({ get collection() { return col('users'); } }));
jest.mock('../models/Assignment', () => ({ get collection() { return col('assignments'); } }));
jest.mock('../models/Quiz', () => ({ get collection() { return col('quizzes'); } }));
jest.mock('../models/Message', () => ({ get collection() { return col('messages'); } }));

const { archiveStudent, restoreStudent } = require('../services/deletedStudents');

const toArray = (rows) => ({ toArray: async () => rows });
const SID = 'stu1';
const rawUser = { _id: SID, firstName: 'Omar', lastName: 'Ali', email: 'omar@x.com', password: 'HASH', studentInfo: { studentId: 'S-7', year: 11, session: 'JUN 27' } };

beforeEach(() => {
  Object.keys(mockCols).forEach(k => delete mockCols[k]);
  mockCreate.mockClear();
});

describe('archiveStudent', () => {
  it('keeps the raw account, work entries, messages and parent links', async () => {
    col('users').findOne.mockResolvedValue(rawUser);
    col('assignments').find.mockReturnValue(toArray([{ _id: 'a1', assignedTo: [{ student: 'other' }, { student: SID, status: 'graded', score: 9 }] }]));
    col('quizzes').find.mockReturnValue(toArray([]));
    col('messages').find.mockReturnValue(toArray([{ _id: 'm1', sender: SID }]));
    col('users').find.mockReturnValue(toArray([{ _id: 'p1', parentInfo: { children: [{ studentId: SID, relationship: 'guardian' }, { studentId: 'sib' }] } }]));

    await archiveStudent({ _id: SID }, 'teacher1');

    const saved = mockCreate.mock.calls[0][0];
    expect(saved).toMatchObject({ teacher: 'teacher1', originalId: SID, fullName: 'Omar Ali', email: 'omar@x.com', studentId: 'S-7', year: 11 });
    expect(saved.snapshot.user.password).toBe('HASH');
    expect(saved.snapshot.assignments).toEqual([{ id: 'a1', entry: { student: SID, status: 'graded', score: 9 } }]);
    expect(saved.snapshot.messages).toHaveLength(1);
    expect(saved.snapshot.parentLinks).toEqual([{ parentId: 'p1', link: { studentId: SID, relationship: 'guardian' } }]);
  });

  it('throws (so nothing gets deleted) when the student record is missing', async () => {
    col('users').findOne.mockResolvedValue(null);
    await expect(archiveStudent({ _id: SID }, 't')).rejects.toThrow('not found');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('restoreStudent', () => {
  const archive = (extra = {}) => ({
    originalId: SID,
    deleteOne: jest.fn().mockResolvedValue(),
    snapshot: {
      user: rawUser,
      assignments: [{ id: 'a1', entry: { student: SID, score: 9 } }],
      quizzes: [{ id: 'q1', entry: { student: SID } }],
      messages: [{ _id: 'm1' }, { _id: 'm2' }],
      parentLinks: [{ parentId: 'p1', link: { studentId: SID } }],
      ...extra
    }
  });

  it('puts the account, work, messages and parent link back, then removes the archive entry', async () => {
    col('users').findOne.mockResolvedValue(null);
    col('assignments').updateOne.mockResolvedValue({ matchedCount: 1 });
    col('quizzes').updateOne.mockResolvedValue({ matchedCount: 1 });
    col('users').updateOne.mockResolvedValue({ matchedCount: 1 });
    col('messages').find.mockReturnValue(toArray([{ _id: 'm1' }])); // m1 already exists

    const a = archive();
    const res = await restoreStudent(a);

    expect(col('users').insertOne).toHaveBeenCalledWith(rawUser);
    expect(col('assignments').updateOne).toHaveBeenCalledWith({ _id: 'a1', 'assignedTo.student': { $ne: SID } }, { $push: { assignedTo: { student: SID, score: 9 } } });
    expect(col('messages').insertMany).toHaveBeenCalledWith([{ _id: 'm2' }]);
    expect(col('users').updateOne).toHaveBeenCalledWith({ _id: 'p1', 'parentInfo.children.studentId': { $ne: SID } }, { $push: { 'parentInfo.children': { studentId: SID } } });
    expect(a.deleteOne).toHaveBeenCalled();
    expect(res).toEqual({ restored: true, skipped: 0 });
  });

  it('refuses when someone else already uses the email, and leaves the archive alone', async () => {
    col('users').findOne.mockImplementation(async (q) => (q.email ? { _id: 'someoneElse' } : null));
    const a = archive();
    await expect(restoreStudent(a)).rejects.toMatchObject({ status: 409 });
    expect(col('users').insertOne).not.toHaveBeenCalled();
    expect(a.deleteOne).not.toHaveBeenCalled();
  });

  it('is safe to run twice: an account that is already back is not inserted again', async () => {
    col('users').findOne.mockResolvedValue({ _id: SID });
    const a = archive();
    expect(await restoreStudent(a)).toEqual({ restored: true, skipped: 0 });
    expect(col('users').insertOne).not.toHaveBeenCalled();
    expect(a.deleteOne).toHaveBeenCalled();
  });

  it('counts links to homework or parents that no longer exist instead of failing', async () => {
    col('users').findOne.mockImplementation(async (q) => (q._id === SID || q.email ? null : null));
    col('assignments').updateOne.mockResolvedValue({ matchedCount: 0 });
    col('assignments').findOne.mockResolvedValue(null); // the assignment was deleted meanwhile
    col('quizzes').updateOne.mockResolvedValue({ matchedCount: 1 });
    col('users').updateOne.mockResolvedValue({ matchedCount: 0 });
    col('messages').find.mockReturnValue(toArray([]));
    const res = await restoreStudent(archive());
    expect(res.skipped).toBe(2); // one assignment, one parent
  });
});
