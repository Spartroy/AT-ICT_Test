jest.mock('../models/AssistantAudit', () => ({ create: jest.fn(), find: jest.fn() }));
jest.mock('../models/DeviceSession', () => ({ deactivateAllSessions: jest.fn().mockResolvedValue({}) }));

const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const { create, update, resetPassword, remove, list } = require('../controllers/assistantController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const teacherReq = (body = {}, params = {}) => ({ user: { _id: 't1' }, body, params, query: {} });
const valid = { firstName: 'Sara', lastName: 'Hassan', email: 'sara@example.com', password: 'secret1' };

afterEach(() => jest.restoreAllMocks());

describe('creating an assistant', () => {
  it('links it to the calling teacher, forces the role and normalises permissions', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const created = jest.spyOn(User, 'create').mockImplementation(async (doc) => ({ _id: 'a1', ...doc }));
    const res = mockRes();
    await create(teacherReq({ ...valid, role: 'teacher', permissions: { homework: 'edit', videos: 'root', payments: 'edit' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    const doc = created.mock.calls[0][0];
    expect(doc.role).toBe('assistant');
    expect(doc.assistantInfo.teacher).toBe('t1');
    expect(doc.assistantInfo.permissions).toMatchObject({ studentList: 'view', homework: 'edit', videos: 'none', chat: 'none' });
    const sent = res.json.mock.calls[0][0].data.assistant;
    expect(sent.password).toBeUndefined();
  });

  it.each([
    [{ ...valid, firstName: 'S4ra' }, 'letters'],
    [{ ...valid, email: 'nope' }, 'email'],
    [{ ...valid, password: '123' }, '6 characters']
  ])('rejects bad input (%#)', async (body, text) => {
    const create_ = jest.spyOn(User, 'create');
    const res = mockRes();
    await create(teacherReq(body), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain(text);
    expect(create_).not.toHaveBeenCalled();
  });

  it('rejects an email that is already used', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'x' });
    const res = mockRes();
    await create(teacherReq(valid), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('managing assistants', () => {
  it('only looks up assistants that belong to the calling teacher', async () => {
    const find = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const res = mockRes();
    await update(teacherReq({ isActive: false }, { id: 'a9' }), res);
    expect(find).toHaveBeenCalledWith({ _id: 'a9', role: 'assistant', 'assistantInfo.teacher': 't1' });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('keeps unmentioned areas when permissions are updated, and signs out a suspended assistant', async () => {
    const user = {
      _id: 'a1', firstName: 'S', lastName: 'H', isActive: true,
      assistantInfo: { teacher: 't1', permissions: { studentList: 'edit', homework: 'view', chat: 'none' } },
      save: jest.fn().mockResolvedValue(undefined)
    };
    jest.spyOn(User, 'findOne').mockResolvedValue(user);
    const res = mockRes();
    await update(teacherReq({ permissions: { chat: 'edit' }, isActive: false }, { id: 'a1' }), res);
    expect(user.assistantInfo.permissions).toMatchObject({ studentList: 'edit', homework: 'view', chat: 'edit', videos: 'none' });
    expect(user.isActive).toBe(false);
    expect(DeviceSession.deactivateAllSessions).toHaveBeenCalledWith('a1');
  });

  it('resets a password only for a valid new one and ends their sessions', async () => {
    const user = { _id: 'a1', save: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(User, 'findOne').mockReturnValue({ select: () => Promise.resolve(user) });
    const bad = mockRes();
    await resetPassword(teacherReq({ password: '12' }, { id: 'a1' }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);
    const ok = mockRes();
    await resetPassword(teacherReq({ password: 'newsecret' }, { id: 'a1' }), ok);
    expect(user.password).toBe('newsecret');
    expect(DeviceSession.deactivateAllSessions).toHaveBeenCalledWith('a1');
  });

  it('deletes an assistant and ends their sessions', async () => {
    const user = { _id: 'a1', deleteOne: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(User, 'findOne').mockResolvedValue(user);
    await remove(teacherReq({}, { id: 'a1' }), mockRes());
    expect(user.deleteOne).toHaveBeenCalled();
    expect(DeviceSession.deactivateAllSessions).toHaveBeenCalledWith('a1');
  });

  it('lists without password hashes', async () => {
    jest.spyOn(User, 'find').mockReturnValue({ sort: () => Promise.resolve([{ _id: 'a1', firstName: 'S', lastName: 'H', email: 's@x.com', isActive: true, password: 'hash', assistantInfo: { permissions: {} } }]) });
    const res = mockRes();
    await list(teacherReq(), res);
    const a = res.json.mock.calls[0][0].data.assistants[0];
    expect(a.password).toBeUndefined();
    expect(a.permissions.studentList).toBe('view');
  });
});
