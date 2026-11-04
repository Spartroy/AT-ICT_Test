import { BUILT_IN_TEMPLATES, fillTemplate, telHref, whatsappLink, whatsappNumber } from './messageTemplates';

describe('fillTemplate', () => {
  it('fills every placeholder', () => {
    expect(fillTemplate('Hi {parent}, {student} ({group}) — {teacher}', { parent: 'Mr Ali', student: 'Omar', group: 'A', teacher: 'Ahmad' })).toBe('Hi Mr Ali, Omar (A) — Ahmad');
  });
  it('never leaves raw braces behind', () => {
    const out = fillTemplate(BUILT_IN_TEMPLATES[0].body, {});
    expect(out).not.toMatch(/[{}]/);
    expect(out).toContain('your child');
  });
});

describe('whatsapp and tel links', () => {
  it('turns Egyptian local numbers into international digits', () => {
    expect(whatsappNumber('01012345678')).toBe('201012345678');
    expect(whatsappNumber('+20 101 234 5678')).toBe('201012345678');
    expect(whatsappNumber('0020 101 234 5678')).toBe('201012345678');
  });
  it('gives no link for unusable numbers', () => {
    expect(whatsappLink('N/A', 'hi')).toBe('');
    expect(whatsappLink('123', 'hi')).toBe('');
    expect(telHref('')).toBe('');
  });
  it('encodes the message', () => {
    expect(whatsappLink('01012345678', 'a b&c')).toBe('https://wa.me/201012345678?text=a%20b%26c');
  });
  it('keeps one leading plus for tel:', () => {
    expect(telHref('+20 101 234 5678')).toBe('tel:+201012345678');
    expect(telHref('010-1234-5678')).toBe('tel:01012345678');
  });
});
