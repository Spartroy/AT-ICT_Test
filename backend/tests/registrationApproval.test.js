jest.mock('../controllers/activityController', () => ({ createActivityFromEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../services/notifications', () => ({ notify: jest.fn(), teacherIds: jest.fn().mockResolvedValue([]) }));

const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Activity = require('../models/Activity');
const groupsSvc = require('../services/groups');
const { approveRegistration } = require('../controllers/registrationController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('approving a registration', () => {
  it('does not hand the new student homework or quizzes that were set before they joined', async () => {
    const user = {
      _id: 'u1', role: 'student', registrationStatus: 'pending', firstName: 'New', lastName: 'Kid', email: 'n@x.com',
      studentInfo: {}, save: jest.fn().mockResolvedValue(undefined)
    };
    jest.spyOn(User, 'findById').mockResolvedValue(user);
    jest.spyOn(groupsSvc, 'autoAssignNewStudent').mockResolvedValue('A');
    jest.spyOn(Activity, 'updateOne').mockReturnValue({ catch: () => {} });
    const aFind = jest.spyOn(Assignment, 'find');
    const qFind = jest.spyOn(Quiz, 'find');

    const res = mockRes();
    await approveRegistration({ params: { id: 'u1' }, body: {}, user: { _id: 't1' } }, res);

    expect(user.registrationStatus).toBe('approved');
    expect(aFind).not.toHaveBeenCalled();
    expect(qFind).not.toHaveBeenCalled();
  });
});
