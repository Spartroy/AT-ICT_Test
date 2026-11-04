const { normalizePhone, isUsablePhone, escapeRegex } = require('../utils/phone');

describe('normalizePhone', () => {
  it('treats local and international forms of one number as equal', () => {
    const forms = ['01012345678', '010 1234 5678', '+20 101 234 5678', '0020 101 234 5678', '(010) 1234-5678'];
    expect(new Set(forms.map(normalizePhone))).toEqual(new Set(['01012345678']));
  });
  it('returns an empty string for nothing', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone('N/A')).toBe('');
  });
});

describe('isUsablePhone', () => {
  it('rejects placeholders and too-short values', () => {
    expect(isUsablePhone('1000000000')).toBe(false);
    expect(isUsablePhone('0000000000')).toBe(false);
    expect(isUsablePhone('N/A')).toBe(false);
    expect(isUsablePhone('123')).toBe(false);
  });
  it('accepts a real number', () => {
    expect(isUsablePhone('01012345678')).toBe(true);
  });
});

describe('escapeRegex', () => {
  it('makes user text match literally', () => {
    const rx = new RegExp(escapeRegex('a.b(c)*'));
    expect(rx.test('a.b(c)*')).toBe(true);
    expect(rx.test('aXb(c)')).toBe(false);
  });
});
