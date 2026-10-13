jest.mock('../models/AppSettings', () => ({ getGlobal: jest.fn() }));
jest.mock('../models/User', () => ({ distinct: jest.fn(), updateMany: jest.fn(), aggregate: jest.fn() }));
jest.mock('../models/Registration', () => ({ updateMany: jest.fn() }));

const AppSettings = require('../models/AppSettings');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { updateSettings } = require('../controllers/settingsController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const session = (code, open = true) => ({ code, label: code, open });
const reqOf = (body) => ({ body, user: { _id: 'teacher' }, express: {} });

let settings;
beforeEach(() => {
  settings = {
    examSessions: [session('JUN 27'), session('NOV 25', false), session('JUN 26', false)],
    royalClasses: ['9H'],
    save: jest.fn().mockResolvedValue(),
    updatedAt: new Date()
  };
  AppSettings.getGlobal.mockResolvedValue(settings);
  User.distinct.mockResolvedValue(['NOV 25', 'JUN 26']);
  User.updateMany.mockResolvedValue({});
  Registration.updateMany.mockResolvedValue({});
});
afterEach(() => jest.clearAllMocks());

describe('removing exam sessions that still have students', () => {
  const keep = [session('JUN 27')];

  it('refuses when no target session is given', async () => {
    const res = mockRes();
    await updateSettings(reqOf({ examSessions: keep }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.updateMany).not.toHaveBeenCalled();
    expect(settings.save).not.toHaveBeenCalled();
  });

  it('refuses when the target is not one of the remaining sessions', async () => {
    const res = mockRes();
    await updateSettings(reqOf({ examSessions: keep, moveStudents: { 'NOV 25': 'JUN 27', 'JUN 26': 'NOV 27' } }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toContain('JUN 26');
    expect(User.updateMany).not.toHaveBeenCalled();
  });

  it('moves students and pending registrations first, then removes the sessions', async () => {
    const res = mockRes();
    await updateSettings(reqOf({ examSessions: keep, moveStudents: { 'NOV 25': 'JUN 27', 'JUN 26': 'JUN 27' } }), res);
    expect(User.updateMany).toHaveBeenCalledWith({ role: 'student', 'studentInfo.session': 'NOV 25' }, { $set: { 'studentInfo.session': 'JUN 27' } });
    expect(User.updateMany).toHaveBeenCalledWith({ role: 'student', 'studentInfo.session': 'JUN 26' }, { $set: { 'studentInfo.session': 'JUN 27' } });
    expect(Registration.updateMany).toHaveBeenCalledTimes(2);
    expect(settings.examSessions).toEqual(keep);
    expect(settings.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('does not touch anyone when the removed sessions have no students', async () => {
    User.distinct.mockResolvedValue([]);
    const res = mockRes();
    await updateSettings(reqOf({ examSessions: keep }), res);
    expect(User.updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('quick actions', () => {
  it('saves the chosen order', async () => {
    const res = mockRes();
    await updateSettings(reqOf({ quickActions: ['quiz', 'hw'] }), res);
    expect(settings.quickActions).toEqual(['quiz', 'hw']);
    expect(settings.save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.quickActions).toEqual(['quiz', 'hw']);
  });
});
