const { validationResult } = require('express-validator');
const { registrationValidation } = require('../validators/registrationValidation');

const settings = {
  examSessions: [
    { code: 'JUN 27', label: 'June 2027', open: true },
    { code: 'NOV 27', label: 'November 2027', open: true },
    { code: 'NOV 25', label: 'November 2025', open: false }
  ],
  royalClasses: ['9H', '9J']
};

const common = {
  firstName: 'Joud',
  lastName: 'El Daher',
  email: 'joud@example.com',
  password: 'secret123',
  contactNumber: '01012345678',
  parentNumber: '+20 101 234 5678',
  techKnowledge: 5,
  englishLevel: 7
};

const royal = { ...common, schoolType: 'royal', royalClass: '9H' };
const center = {
  ...common,
  schoolType: 'center',
  year: '11',
  session: 'JUN 27',
  school: 'IG Stars',
  nationality: 'Egyptian',
  city: 'Cairo',
  country: 'Egypt',
  isRetaker: false,
  otherSubjects: ''
};

async function validate(body) {
  const req = { body: { ...body }, appSettings: settings };
  for (const chain of registrationValidation) {
    await chain.run(req);
  }
  const errors = validationResult(req).array();
  return { req, fields: errors.map(e => e.path), errors };
}

const without = (obj, ...keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

describe('registration validation: Royal College', () => {
  it('accepts a class without year, session, nationality or location', async () => {
    const { fields } = await validate(royal);
    expect(fields).toEqual([]);
  });

  it('requires a class', async () => {
    const { fields } = await validate(without(royal, 'royalClass'));
    expect(fields).toEqual(['royalClass']);
  });

  it('rejects a class that is not in the teacher-managed list', async () => {
    const { fields } = await validate({ ...royal, royalClass: '10A' });
    expect(fields).toEqual(['royalClass']);
  });

  it('normalises the class to upper case', async () => {
    const { req, fields } = await validate({ ...royal, royalClass: '9j' });
    expect(fields).toEqual([]);
    expect(req.body.royalClass).toBe('9J');
  });

  it('ignores centre-only fields, even invalid ones', async () => {
    const { fields } = await validate({ ...royal, year: '99', session: 'NOV 25', city: '' });
    expect(fields).toEqual([]);
  });

  it('no longer requires royalNationality', async () => {
    const { fields } = await validate(without(royal, 'royalNationality'));
    expect(fields).not.toContain('royalNationality');
  });
});

describe('registration validation: Center / other school', () => {
  it('accepts a complete centre registration', async () => {
    const { fields } = await validate(center);
    expect(fields).toEqual([]);
  });

  it.each(['year', 'session', 'school', 'nationality', 'city', 'country'])('requires %s', async (field) => {
    const { fields } = await validate(without(center, field));
    expect(fields).toEqual([field]);
  });

  it('does not require a Royal class', async () => {
    const { fields } = await validate(center);
    expect(fields).not.toContain('royalClass');
  });

  it('only accepts open exam sessions', async () => {
    expect((await validate({ ...center, session: 'NOV 25' })).fields).toEqual(['session']);
    expect((await validate({ ...center, session: 'JUN 26' })).fields).toEqual(['session']);
    expect((await validate({ ...center, session: 'nov 27' })).fields).toEqual([]);
  });

  it('rejects a year outside 10-12', async () => {
    expect((await validate({ ...center, year: '9' })).fields).toEqual(['year']);
  });
});

describe('registration validation: common fields', () => {
  it('requires a known school type', async () => {
    expect((await validate({ ...royal, schoolType: 'other' })).fields).toContain('schoolType');
    expect((await validate(without(royal, 'schoolType'))).fields).toContain('schoolType');
  });

  it('validates phones, levels and email for both paths', async () => {
    for (const base of [royal, center]) {
      const { fields } = await validate({ ...base, contactNumber: '12', parentNumber: 'abc', techKnowledge: 0, englishLevel: 11, email: 'nope' });
      expect(fields.sort()).toEqual(['contactNumber', 'email', 'englishLevel', 'parentNumber', 'techKnowledge']);
    }
  });

  it('rejects names the User model would refuse', async () => {
    expect((await validate({ ...royal, firstName: 'J0ud' })).fields).toEqual(['firstName']);
  });
});
