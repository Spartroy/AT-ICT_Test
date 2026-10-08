import { initialValues, validateStep, firstInvalidStep, buildPayload, mapServerErrors, passwordStrength, schoolSummary } from './registration';

const personal = { firstName: 'Joud', lastName: 'El Daher', email: 'joud@example.com', password: 'Secret123', confirmPassword: 'Secret123' };
const contact = { contactNumber: '01012345678', parentNumber: '+20 111 234 5678' };
const royal = { ...initialValues, ...personal, ...contact, schoolType: 'royal', royalClass: '9H', terms: true };
const center = {
  ...initialValues, ...personal, ...contact,
  schoolType: 'center', year: '11', session: 'JUN 27', school: 'IG Stars', nationality: 'Egyptian',
  city: 'Cairo', country: 'Egypt', terms: true
};

describe('validateStep', () => {
  it('step 1 requires names, email and matching 8+ char passwords', () => {
    expect(Object.keys(validateStep(0, initialValues))).toEqual(['firstName', 'lastName', 'email', 'password', 'confirmPassword']);
    expect(validateStep(0, { ...royal, confirmPassword: 'other' })).toEqual({ confirmPassword: 'Passwords do not match' });
    expect(validateStep(0, { ...royal, firstName: 'J0ud' })).toEqual({ firstName: 'Use letters and spaces only' });
  });

  it('step 2 asks Royal College students for a class only', () => {
    expect(validateStep(1, { ...royal, royalClass: '' })).toEqual({ royalClass: 'Select your class' });
    expect(validateStep(1, royal)).toEqual({});
  });

  it('step 2 asks centre students for year, session, school and nationality', () => {
    const blank = { ...center, year: '', session: '', school: ' ', nationality: '' };
    expect(Object.keys(validateStep(1, blank))).toEqual(['year', 'session', 'school', 'nationality']);
    expect(validateStep(1, center)).toEqual({});
  });

  it('step 3 needs a location from centre students only', () => {
    expect(validateStep(2, { ...royal, city: '', country: '' })).toEqual({});
    expect(Object.keys(validateStep(2, { ...center, city: '', country: '' }))).toEqual(['city', 'country']);
    expect(validateStep(2, { ...royal, contactNumber: '12' })).toEqual({ contactNumber: 'Enter a valid phone number' });
  });

  it('step 4 requires accepting the terms', () => {
    expect(validateStep(3, { ...royal, terms: false })).toEqual({ terms: 'Please accept to continue' });
  });

  it('firstInvalidStep finds the earliest broken step', () => {
    expect(firstInvalidStep(royal)).toBeNull();
    expect(firstInvalidStep({ ...center, city: '', email: 'bad' })).toEqual({ step: 0, errors: { email: 'Enter a valid email address' } });
  });
});

describe('buildPayload', () => {
  it('sends Royal College students with a class and no centre fields', () => {
    expect(buildPayload({ ...royal, year: '11', city: 'Cairo' })).toEqual({
      firstName: 'Joud', lastName: 'El Daher', email: 'joud@example.com', password: 'Secret123',
      schoolType: 'royal', school: 'The Royal College School', royalClass: '9H',
      contactNumber: '01012345678', parentNumber: '+20 111 234 5678', techKnowledge: 5, englishLevel: 5
    });
  });

  it('sends centre students with session, location and optional subjects as null', () => {
    const payload = buildPayload(center);
    expect(payload).toMatchObject({ schoolType: 'center', year: '11', session: 'JUN 27', city: 'Cairo', country: 'Egypt', isRetaker: false, otherSubjects: null });
    expect(payload).not.toHaveProperty('royalClass');
    expect(payload).not.toHaveProperty('confirmPassword');
    expect(payload).not.toHaveProperty('terms');
  });
});

describe('mapServerErrors', () => {
  it('maps a duplicate email to step 1', () => {
    expect(mapServerErrors({ errors: [{ path: 'email', msg: 'An account with this email already exists' }] }))
      .toEqual({ fields: { email: 'An account with this email already exists' }, step: 0, message: null });
  });

  it('jumps to the earliest step with an error and accepts Mongoose-style errors', () => {
    const r = mapServerErrors({ errors: [{ field: 'studentInfo.session', path: 'session', message: 'x', msg: 'Bad session' }, { path: 'city', msg: 'City is required' }] });
    expect(r.step).toBe(1);
    expect(r.fields).toEqual({ session: 'Bad session', city: 'City is required' });
  });

  it('falls back to a general message', () => {
    expect(mapServerErrors({ message: 'Server error' })).toEqual({ fields: {}, step: null, message: 'Server error' });
  });
});

it('scores password strength 0-4', () => {
  expect(passwordStrength('')).toBe(0);
  expect(passwordStrength('abcdefgh')).toBe(1);
  expect(passwordStrength('Abcdefg1!')).toBe(4);
});

it('summarises the school line for the review card', () => {
  expect(schoolSummary(royal)).toBe('The Royal College School · Class 9H');
  expect(schoolSummary(center, [{ code: 'JUN 27', label: 'June 2027' }])).toBe('IG Stars · Year 11 · June 2027');
});
