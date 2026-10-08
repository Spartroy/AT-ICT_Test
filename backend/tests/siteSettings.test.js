const { DEFAULT_SITE, withDefaults, normalizeSite } = require('../validators/siteSettings');

describe('site settings defaults', () => {
  it('fills everything in for a settings document that has no site field yet', () => {
    const site = withDefaults(undefined);
    expect(site.heroStats).toHaveLength(4);
    expect(site.sections).toEqual({ fees: false, hallOfFame: true, results: true });
    expect(site.banner.enabled).toBe(false);
  });

  it('keeps stored values and fills only the missing keys', () => {
    const site = withDefaults({ whatsappNumber: '201000000000', sections: { fees: true } });
    expect(site.whatsappNumber).toBe('201000000000');
    expect(site.sections).toEqual({ fees: true, hallOfFame: true, results: true });
  });
});

describe('normalizeSite', () => {
  it('applies a partial update and leaves the rest alone', () => {
    const { value, errors } = normalizeSite({ sections: { fees: true } }, undefined);
    expect(errors).toEqual([]);
    expect(value.sections.fees).toBe(true);
    expect(value.emails).toEqual(DEFAULT_SITE.emails);
  });

  it('cleans the headline numbers', () => {
    const { value, errors } = normalizeSite({ heroStats: [{ n: '450.4', suffix: ' + ', label: ' Students taught ' }] }, undefined);
    expect(errors).toEqual([]);
    expect(value.heroStats).toEqual([{ n: 450, suffix: '+', label: 'Students taught' }]);
  });

  it('rejects bad numbers, empty labels and too many items', () => {
    const bad = normalizeSite({ heroStats: [{ n: -1, suffix: '', label: 'x' }] }, undefined).errors.map(e => e.path);
    expect(bad).toEqual(expect.arrayContaining(['heroStats.0.n', 'heroStats.0.label']));
    const many = Array.from({ length: 5 }, () => ({ n: 1, suffix: '', label: 'Students' }));
    expect(normalizeSite({ resultCounters: many }, undefined).errors[0].path).toBe('resultCounters');
  });

  it('keeps only the digits of the WhatsApp number and validates the length', () => {
    expect(normalizeSite({ whatsappNumber: '+20 127 458 4000' }, undefined).value.whatsappNumber).toBe('201274584000');
    expect(normalizeSite({ whatsappNumber: '123' }, undefined).errors[0].path).toBe('whatsappNumber');
  });

  it('validates emails and phones', () => {
    expect(normalizeSite({ emails: ['not-an-email'] }, undefined).errors[0].path).toBe('emails.0');
    expect(normalizeSite({ phones: ['abc'] }, undefined).errors[0].path).toBe('phones.0');
    const ok = normalizeSite({ emails: ['a@b.co'], phones: ['(+20) 127 458 4000'] }, undefined);
    expect(ok.errors).toEqual([]);
  });

  it('only accepts known section switches', () => {
    const { value } = normalizeSite({ sections: { fees: 'true', hallOfFame: false, hacked: true } }, undefined);
    expect(value.sections).toEqual({ fees: true, hallOfFame: false, results: true });
  });

  describe('banner', () => {
    it('needs text when enabled and only allows https or relative links', () => {
      expect(normalizeSite({ banner: { enabled: true, text: '', link: '' } }, undefined).errors[0].path).toBe('banner.text');
      expect(normalizeSite({ banner: { enabled: true, text: 'Hi', link: 'javascript:alert(1)' } }, undefined).errors[0].path).toBe('banner.link');
      const ok = normalizeSite({ banner: { enabled: true, text: 'Registration closes Friday', link: '/register' } }, undefined);
      expect(ok.errors).toEqual([]);
      expect(ok.value.banner).toEqual({ enabled: true, text: 'Registration closes Friday', link: '/register' });
    });
  });
});
