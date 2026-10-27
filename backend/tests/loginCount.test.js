const { nextLoginCount, HINT_LOGINS } = require('../utils/loginCount');

describe('nextLoginCount', () => {
  it('starts at 1 for a brand new student', () => {
    expect(nextLoginCount(undefined, undefined)).toBe(1);
  });
  it('counts up', () => {
    expect(nextLoginCount(1, new Date())).toBe(2);
    expect(nextLoginCount(0, undefined)).toBe(1);
  });
  it('puts students who signed in before the counter existed past the hint window', () => {
    expect(nextLoginCount(undefined, new Date('2026-01-01'))).toBe(HINT_LOGINS + 1);
  });
});
