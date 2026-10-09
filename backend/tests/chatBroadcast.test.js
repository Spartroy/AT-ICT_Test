jest.mock('../controllers/activityController', () => ({
  createActivityFromEvent: jest.fn().mockResolvedValue(undefined)
}));

const Message = require('../models/Message');
const User = require('../models/User');
const { broadcastMessage } = require('../controllers/chatController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const students = [{ _id: 's1' }, { _id: 's2' }, { _id: 's3' }];
const stubStudents = (list = students) => jest.spyOn(User, 'find').mockReturnValue({ select: jest.fn().mockResolvedValue(list) });

afterEach(() => jest.restoreAllMocks());

describe('broadcastMessage (teacher to all students)', () => {
  it('creates one message per approved student, each in that student\'s own conversation', async () => {
    stubStudents();
    const insert = jest.spyOn(Message, 'insertMany').mockResolvedValue([]);
    const res = mockRes();

    await broadcastMessage({ user: { id: 't1' }, body: { content: '  Class is at 5pm  ' }, files: [] }, res);

    const docs = insert.mock.calls[0][0];
    expect(docs).toHaveLength(3);
    expect(docs[0]).toMatchObject({ sender: 't1', recipient: 's1', content: 'Class is at 5pm', type: 'text' });
    expect(new Set(docs.map(d => d.conversationId)).size).toBe(3);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].data.sent).toBe(3);
  });

  it('shares the attachments and picks the type from the first file', async () => {
    stubStudents();
    const insert = jest.spyOn(Message, 'insertMany').mockResolvedValue([]);
    const files = [{ filename: 'voice.webm', originalname: 'voice-note.webm', path: 'uploads/chat/voice.webm', size: 10, mimetype: 'audio/webm' }];

    await broadcastMessage({ user: { id: 't1' }, body: {}, files }, mockRes());

    const docs = insert.mock.calls[0][0];
    expect(docs[0].type).toBe('audio');
    expect(docs[0].attachments[0]).toMatchObject({ filename: 'voice.webm', mimetype: 'audio/webm' });
    expect(docs.every(d => d.attachments === docs[0].attachments)).toBe(true);
  });

  it('needs a message or a file', async () => {
    const insert = jest.spyOn(Message, 'insertMany');
    const res = mockRes();
    await broadcastMessage({ user: { id: 't1' }, body: { content: '   ' }, files: [] }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('does nothing when there are no students', async () => {
    stubStudents([]);
    const insert = jest.spyOn(Message, 'insertMany');
    const res = mockRes();
    await broadcastMessage({ user: { id: 't1' }, body: { content: 'Hi' }, files: [] }, res);
    expect(insert).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.sent).toBe(0);
  });
});
