jest.mock('../models/AssistantAudit', () => ({ create: jest.fn(), find: jest.fn() }));
jest.mock('../models/AssistantTask', () => ({ find: jest.fn(), findOne: jest.fn(), create: jest.fn() }));

const User = require('../models/User');
const AssistantTask = require('../models/AssistantTask');
const { createTask, updateTask, myTasks, markDone, mineFilter } = require('../controllers/assistantTaskController');
const { requirementFor } = require('../config/assistantAccess');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const ID = 'a'.repeat(24);
const assistant = { _id: 'a1', assistantInfo: { teacher: 't1' } };

afterEach(() => { jest.restoreAllMocks(); Object.values(AssistantTask).forEach(f => f.mockReset()); });

describe('teacher creating tasks', () => {
  it('needs a title', async () => {
    const res = mockRes();
    await createTask({ user: { _id: 't1' }, body: { title: '  ' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(AssistantTask.create).not.toHaveBeenCalled();
  });

  it('only accepts an assignee that is one of this teacher’s assistants', async () => {
    const find = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const res = mockRes();
    await createTask({ user: { _id: 't1' }, body: { title: 'Call parents', assignee: ID } }, res);
    expect(find).toHaveBeenCalledWith({ _id: ID, role: 'assistant', 'assistantInfo.teacher': 't1' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates a task for everyone when no assignee is given', async () => {
    AssistantTask.create.mockImplementation(async (d) => ({ _id: 'k1', done: false, ...d }));
    const res = mockRes();
    await createTask({ user: { _id: 't1' }, body: { title: ' Check attendance ', dueDate: '2026-11-05' } }, res);
    expect(AssistantTask.create).toHaveBeenCalledWith(expect.objectContaining({ teacher: 't1', title: 'Check attendance' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('cannot edit another teacher’s task', async () => {
    AssistantTask.findOne.mockResolvedValue(null);
    const res = mockRes();
    await updateTask({ user: { _id: 't1' }, params: { taskId: 'x' }, body: { done: true } }, res);
    expect(AssistantTask.findOne).toHaveBeenCalledWith({ _id: 'x', teacher: 't1' });
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('assistant tasks', () => {
  it('sees tasks for their teacher that are for everyone or for them', () => {
    expect(mineFilter(assistant)).toEqual({ teacher: 't1', $or: [{ assignee: null }, { assignee: 'a1' }] });
  });

  it('lists only those', async () => {
    const chain = { sort: () => chain, limit: () => chain, populate: () => Promise.resolve([]) };
    AssistantTask.find.mockReturnValue(chain);
    await myTasks({ user: assistant }, mockRes());
    expect(AssistantTask.find).toHaveBeenCalledWith(mineFilter(assistant));
  });

  it('ticks off a task and records who did it; cannot touch a task that is not theirs', async () => {
    const task = { _id: 'k1', save: jest.fn().mockResolvedValue(undefined) };
    AssistantTask.findOne.mockResolvedValueOnce(task);
    await markDone({ user: assistant, params: { taskId: 'k1' }, body: { done: true } }, mockRes());
    expect(task).toMatchObject({ done: true, doneBy: 'a1' });

    AssistantTask.findOne.mockResolvedValueOnce(null);
    const res = mockRes();
    await markDone({ user: assistant, params: { taskId: 'k2' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('access rules for the dashboard endpoints', () => {
  it('are the assistant’s own, needing no area', () => {
    expect(requirementFor('GET', '/api/assistant/tasks').area).toBe('self');
    expect(requirementFor('GET', '/api/assistant/activity').area).toBe('self');
    expect(requirementFor('PUT', '/api/assistant/tasks/abc/done').area).toBe('self');
  });

  it('keep task management with the teacher', () => {
    expect(requirementFor('POST', '/api/teacher/assistants/tasks')).toBeNull();
    expect(requirementFor('DELETE', '/api/teacher/assistants/tasks/abc')).toBeNull();
  });
});
