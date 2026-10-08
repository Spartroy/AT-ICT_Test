jest.mock('../controllers/activityController', () => ({
  createActivityFromEvent: jest.fn().mockResolvedValue(undefined)
}));

const User = require('../models/User');
const { login } = require('../controllers/authController');
const { submitRegistration } = require('../controllers/registrationController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('login: registration status', () => {
  const studentWith = (registrationStatus) => ({
    role: 'student',
    registrationStatus,
    isActive: true,
    isLocked: () => false,
    matchPassword: jest.fn().mockResolvedValue(true),
    incLoginAttempts: jest.fn(),
    save: jest.fn()
  });

  const attempt = async (user) => {
    jest.spyOn(User, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = mockRes();
    await login({ body: { email: 'joud@example.com', password: 'secret123' }, headers: {}, ip: '127.0.0.1' }, res);
    return res;
  };

  it('rejects a pending student with REGISTRATION_PENDING and an awaiting-confirmation message', async () => {
    const user = studentWith('pending');
    const res = await attempt(user);
    expect(res.status).toHaveBeenCalledWith(403);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe('REGISTRATION_PENDING');
    expect(body.message).toMatch(/awaiting admin confirmation/i);
    expect(body.data).toBeUndefined(); // no token issued
    expect(user.save).not.toHaveBeenCalled();
  });

  it('rejects a rejected student with REGISTRATION_REJECTED', async () => {
    const res = await attempt(studentWith('rejected'));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].code).toBe('REGISTRATION_REJECTED');
  });

  it('checks the password before revealing the pending status', async () => {
    const user = studentWith('pending');
    user.matchPassword.mockResolvedValue(false);
    const res = await attempt(user);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].code).toBeUndefined();
  });
});

describe('User model: centre-only student fields', () => {
  const base = {
    firstName: 'Joud',
    lastName: 'Daher',
    email: 'joud@example.com',
    password: 'secret123',
    role: 'student',
    contactNumber: '01012345678'
  };
  const info = { techKnowledge: 5, englishLevel: 5, parentContactNumber: '01012345678' };
  const errorsOf = async (doc) => {
    try { await doc.validate(); return []; } catch (e) { return Object.keys(e.errors); }
  };

  it('accepts a new Royal College student with null year, session and nationality', async () => {
    const doc = new User({ ...base, studentInfo: { ...info, schoolType: 'royal', royalClass: '9H', school: 'The Royal College School', year: null, session: null, nationality: null } });
    expect(await errorsOf(doc)).toEqual([]);
  });

  it('requires a class for a new Royal College student', async () => {
    const doc = new User({ ...base, studentInfo: { ...info, schoolType: 'royal', school: 'The Royal College School', year: null, session: null, nationality: null } });
    expect(await errorsOf(doc)).toEqual(['studentInfo.royalClass']);
  });

  it('still requires year, session and nationality for centre students', async () => {
    const doc = new User({ ...base, studentInfo: { ...info, schoolType: 'center', school: 'IG Stars', year: null, session: null, nationality: null } });
    expect((await errorsOf(doc)).sort()).toEqual(['studentInfo.nationality', 'studentInfo.session', 'studentInfo.year']);
  });

  it('accepts the new sessions and keeps legacy ones valid', async () => {
    for (const session of ['JUN 27', 'NOV 27', 'NOV 25', 'JUN 26']) {
      const doc = new User({ ...base, studentInfo: { ...info, schoolType: 'center', school: 'IG Stars', year: 11, session, nationality: 'Egyptian' } });
      expect(await errorsOf(doc)).toEqual([]);
    }
  });
});

describe('submitRegistration', () => {
  const run = async (body) => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockImplementation(async (data) => ({ _id: 'u1', createdAt: new Date(), ...data }));
    const res = mockRes();
    await submitRegistration({ body }, res);
    return { res, saved: create.mock.calls[0]?.[0] };
  };
  const common = {
    firstName: 'Joud', lastName: 'Daher', email: 'joud@example.com', password: 'secret123',
    contactNumber: '01012345678', parentNumber: '01112345678', techKnowledge: 4, englishLevel: 8
  };

  it('stores a Royal College student as pending with a class and null centre fields', async () => {
    const { res, saved } = await run({ ...common, schoolType: 'royal', royalClass: '9J', year: '11', session: 'JUN 27', city: 'Cairo' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(saved.registrationStatus).toBe('pending');
    expect(saved.studentInfo).toMatchObject({
      schoolType: 'royal', royalClass: '9J', school: 'The Royal College School',
      year: null, session: null, nationality: null, isRetaker: false, otherSubjects: null,
      parentContactNumber: '01112345678', techKnowledge: 4, englishLevel: 8
    });
    expect(saved.address).toEqual({ city: null, country: null });
  });

  it('stores a centre student with session, location and country', async () => {
    const { saved } = await run({
      ...common, schoolType: 'center', year: '10', session: 'NOV 27', school: 'IG Stars',
      nationality: 'Egyptian', city: 'Cairo', country: 'Egypt', isRetaker: true, otherSubjects: 'Maths'
    });
    expect(saved.studentInfo).toMatchObject({ year: 10, session: 'NOV 27', school: 'IG Stars', nationality: 'Egyptian', isRetaker: true, otherSubjects: 'Maths' });
    expect(saved.studentInfo.royalClass).toBeUndefined();
    expect(saved.address).toEqual({ city: 'Cairo', country: 'Egypt' });
  });

  it('returns a field-level error for a duplicate email', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: 'existing' });
    const res = mockRes();
    await submitRegistration({ body: { ...common, schoolType: 'royal', royalClass: '9H' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].errors).toEqual([{ path: 'email', msg: expect.stringMatching(/already exists/) }]);
  });
});
