jest.mock('../models/AssistantAudit', () => ({ create: jest.fn().mockResolvedValue({}) }));

const User = require('../models/User');
const AssistantAudit = require('../models/AssistantAudit');
const { applyAssistantAccess } = require('../middleware/assistantGate');
const { requirePermission } = require('../middleware/auth');

const teacher = { _id: 't1', role: 'teacher', isActive: true };
const assistantWith = (permissions) => ({ _id: 'a1', role: 'assistant', isActive: true, assistantInfo: { teacher: 't1', permissions } });

const mockRes = () => {
  const res = { statusCode: 200, handlers: {} };
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn(() => res);
  res.on = jest.fn((ev, fn) => { res.handlers[ev] = fn; });
  return res;
};
const req = (method, originalUrl) => ({ method, originalUrl, headers: {} });

beforeEach(() => {
  jest.spyOn(User, 'findById').mockResolvedValue(teacher);
  AssistantAudit.create.mockClear();
});
afterEach(() => jest.restoreAllMocks());

describe('applyAssistantAccess', () => {
  it('lets a permitted request run as the teacher', async () => {
    const r = req('GET', '/api/teacher/submissions?status=needs');
    const a = assistantWith({ work: 'view' });
    expect(await applyAssistantAccess(r, mockRes(), a)).toBe(true);
    expect(r.user).toBe(teacher);
    expect(r.assistant).toBe(a);
  });

  it('refuses an area the assistant has no access to', async () => {
    const res = mockRes();
    const ok = await applyAssistantAccess(req('GET', '/api/teacher/videos'), res, assistantWith({ work: 'edit', library: 'none' }));
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('refuses a write on a view-only area and logs the attempt', async () => {
    const res = mockRes();
    const ok = await applyAssistantAccess(req('PUT', '/api/teacher/assignments/x/students/y'), res, assistantWith({ work: 'view' }));
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(AssistantAudit.create).toHaveBeenCalledWith(expect.objectContaining({ allowed: false, method: 'PUT', area: 'work', level: 'edit' }));
  });

  it('refuses hidden routes even with every permission on', async () => {
    const all = assistantWith({ students: 'edit', work: 'edit', library: 'edit', schedule: 'edit', inbox: 'edit' });
    for (const [m, u] of [['GET', '/api/teacher/income/summary'], ['GET', '/api/teacher/assistants'], ['GET', '/api/registration/pending'], ['PUT', '/api/teacher/settings']]) {
      const res = mockRes();
      expect(await applyAssistantAccess(req(m, u), res, all)).toBe(false);
      expect(res.status).toHaveBeenCalledWith(403);
    }
  });

  it('refuses when the linked teacher is missing or inactive', async () => {
    User.findById.mockResolvedValue({ ...teacher, isActive: false });
    const res = mockRes();
    expect(await applyAssistantAccess(req('GET', '/api/teacher/students'), res, assistantWith({ students: 'view' }))).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('keeps the assistant as the user on their own account routes', async () => {
    const r = req('GET', '/api/auth/me');
    const a = assistantWith({});
    expect(await applyAssistantAccess(r, mockRes(), a)).toBe(true);
    expect(r.user).toBe(a);
  });

  it('strips hidden fields from JSON responses', async () => {
    const r = req('GET', '/api/teacher/students');
    const res = mockRes();
    const send = res.json;
    await applyAssistantAccess(r, res, assistantWith({ students: 'view' }));
    res.json({ data: { students: [{ firstName: 'A', email: 'a@x.com', contactNumber: '1' }] } });
    expect(send).toHaveBeenCalledWith({ data: { students: [{ firstName: 'A' }] } });
  });

  it('logs successful writes once the response finishes', async () => {
    const r = req('POST', '/api/chat/send');
    const res = mockRes();
    await applyAssistantAccess(r, res, assistantWith({ inbox: 'edit' }));
    expect(AssistantAudit.create).not.toHaveBeenCalled();
    res.statusCode = 201;
    res.handlers.finish();
    expect(AssistantAudit.create).toHaveBeenCalledWith(expect.objectContaining({ assistant: 'a1', teacher: 't1', method: 'POST', path: '/chat/send', status: 201, allowed: true }));
  });

  it('does not log plain reads', async () => {
    const res = mockRes();
    await applyAssistantAccess(req('GET', '/api/chat/conversations'), res, assistantWith({ inbox: 'view' }));
    expect(res.handlers.finish).toBeUndefined();
  });

  it('reuses the first decision when a second router runs protect again', async () => {
    const r = req('GET', '/api/teacher/students');
    const a = assistantWith({ students: 'view' });
    await applyAssistantAccess(r, mockRes(), a);
    r.user = a;
    User.findById.mockClear();
    expect(await applyAssistantAccess(r, mockRes(), a)).toBe(true);
    expect(r.user).toBe(teacher);
    expect(User.findById).not.toHaveBeenCalled();
  });
});

describe('requirePermission', () => {
  const run = (r) => {
    const res = mockRes();
    const next = jest.fn();
    requirePermission('work', 'edit')(r, res, next);
    return { res, next };
  };

  it('passes teachers', () => {
    expect(run({ user: { role: 'teacher' } }).next).toHaveBeenCalled();
  });

  it('checks the assistant level', () => {
    expect(run({ user: teacher, assistant: assistantWith({ work: 'edit' }) }).next).toHaveBeenCalled();
    const denied = run({ user: teacher, assistant: assistantWith({ work: 'view' }) });
    expect(denied.next).not.toHaveBeenCalled();
    expect(denied.res.status).toHaveBeenCalledWith(403);
  });

  it('rejects students and unauthenticated requests', () => {
    expect(run({ user: { role: 'student' } }).res.status).toHaveBeenCalledWith(403);
    expect(run({}).res.status).toHaveBeenCalledWith(401);
  });
});
