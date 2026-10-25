jest.mock('fs', () => ({ ...jest.requireActual('fs'), unlink: jest.fn((p, cb) => cb && cb()) }));
jest.mock('../controllers/activityController', () => ({ createActivityFromEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../services/notifications', () => ({ notify: jest.fn(), teacherIds: jest.fn().mockResolvedValue([]), studentIds: jest.fn().mockResolvedValue([]) }));

const fs = require('fs');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { updateSubmission } = require('../controllers/studentController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const file = (name) => ({ filename: name, originalname: `${name}.pdf`, path: `uploads/chat/${name}`, size: 10, mimetype: 'application/pdf' });

const setup = (status = 'submitted', attachments = [file('a'), file('b')]) => {
  const mine = { student: { toString: () => 's1' }, status, submission: { text: 'hi', attachments } };
  const assignment = { _id: 'asg1', title: 'Networks', assignedTo: [mine], save: jest.fn().mockResolvedValue(undefined) };
  jest.spyOn(User, 'findById').mockResolvedValue({ _id: { toString: () => 's1' }, role: 'student', firstName: 'Joud', lastName: 'El Daher' });
  jest.spyOn(Assignment, 'findById').mockResolvedValue(assignment);
  return { mine, assignment };
};

const call = async (body = {}, files = []) => {
  const res = mockRes();
  await updateSubmission({ params: { id: 'asg1' }, user: { id: 's1' }, body, files }, res);
  return res;
};

afterEach(() => { jest.restoreAllMocks(); fs.unlink.mockClear(); });

describe('student edits a submission', () => {
  it('keeps the chosen files, adds new ones, removes the rest and stamps the edit', async () => {
    const { mine, assignment } = setup();
    const res = await call({ keep: JSON.stringify(['a']) }, [file('c')]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mine.submission.attachments.map(a => a.filename)).toEqual(['a', 'c']);
    expect(mine.submission.editedAt).toBeInstanceOf(Date);
    expect(assignment.save).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('uploads/chat/b', expect.any(Function)); // the replaced file is deleted
    expect(fs.unlink).not.toHaveBeenCalledWith('uploads/chat/a', expect.any(Function));
  });

  it('keeps everything when no list is sent (only adds files)', async () => {
    const { mine } = setup();
    await call({}, [file('c')]);
    expect(mine.submission.attachments.map(a => a.filename)).toEqual(['a', 'b', 'c']);
  });

  it('refuses once the work has been graded, and cleans up the upload', async () => {
    const { assignment } = setup('graded');
    const res = await call({}, [file('c')]);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(assignment.save).not.toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('uploads/chat/c', expect.any(Function));
  });

  it('refuses work that was never submitted', async () => {
    setup('assigned', []);
    expect((await call({}, [file('c')])).status).toHaveBeenCalledWith(400);
  });

  it('will not leave a submission with no files', async () => {
    const { assignment } = setup();
    const res = await call({ keep: '[]' }, []);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(assignment.save).not.toHaveBeenCalled();
  });

  it('caps the number of files', async () => {
    setup('submitted', Array.from({ length: 9 }, (_, i) => file(`f${i}`)));
    expect((await call({}, [file('x'), file('y')])).status).toHaveBeenCalledWith(400);
  });
});
