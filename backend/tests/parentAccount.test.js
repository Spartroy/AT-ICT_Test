const { nameForEmail, parentEmail, freeParentEmail } = require('../utils/parentAccount');

describe('parent email', () => {
  it('uses the student name, a 3-digit code and _Parent', () => {
    expect(parentEmail('omar', '042')).toBe('Omar_042_Parent@atict.com');
    expect(parentEmail('  SARA  ali', '731')).toBe('Sara_731_Parent@atict.com');
  });

  it('keeps only letters and digits, falling back when nothing is left', () => {
    expect(nameForEmail("O'Brien")).toBe('Obrien');
    expect(nameForEmail('محمد')).toBe('Student');
    expect(nameForEmail('')).toBe('Student');
    expect(parentEmail('Jean-Luc', '001')).toBe('Jeanluc_001_Parent@atict.com');
  });

  it('matches the User schema email pattern', () => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    expect(re.test(parentEmail('Omar', '000'))).toBe(true);
  });

  it('retries on a taken address and finally walks every code', async () => {
    const used = new Set(['Omar_111_Parent@atict.com']);
    const codes = ['111', '222'];
    const email = await freeParentEmail('Omar', async e => used.has(e), { code: () => codes.shift() });
    expect(email).toBe('Omar_222_Parent@atict.com');

    const all = async e => e !== 'Omar_999_Parent@atict.com';
    expect(await freeParentEmail('Omar', all, { tries: 1, code: () => '000' })).toBe('Omar_999_Parent@atict.com');
    await expect(freeParentEmail('Omar', async () => true, { tries: 1 })).rejects.toThrow('No free parent email');
  });
});
