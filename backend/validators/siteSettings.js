// Teacher-editable public-website settings: headline numbers, contact details, which sections show,
// and an optional announcement banner. Validation is plain functions so it can be unit-tested.

const DEFAULT_SITE = Object.freeze({
  heroStats: [
    { n: 400, suffix: '+', label: 'Students taught' },
    { n: 92, suffix: '%', label: 'Average A* – A' },
    { n: 5, suffix: '+', label: 'Years teaching' },
    { n: 12, suffix: '+', label: 'Countries reached' }
  ],
  resultCounters: [
    { n: 92, suffix: '%', label: 'average A* – A' },
    { n: 400, suffix: '+', label: 'students taught' },
    { n: 12, suffix: '+', label: 'countries' }
  ],
  whatsappNumber: '201274584000',
  emails: ['at.ictofficial@gmail.com', 'ahmad.tamer.ali11@gmail.com'],
  phones: ['(+20) 127 458 4000', '(+20) 107 089 5012'],
  sections: { fees: false, hallOfFame: true, results: true },
  banner: { enabled: false, text: '', link: '' }
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

const counters = (path, list, errors) => {
  if (!Array.isArray(list) || list.length < 1 || list.length > 4) {
    errors.push({ path, msg: 'Add between 1 and 4 numbers' });
    return undefined;
  }
  return list.map((item, i) => {
    const n = Number(item?.n);
    const suffix = String(item?.suffix ?? '').trim();
    const label = String(item?.label ?? '').trim();
    if (!Number.isFinite(n) || n < 0 || n > 1000000) errors.push({ path: `${path}.${i}.n`, msg: 'Number must be between 0 and 1,000,000' });
    if (suffix.length > 3) errors.push({ path: `${path}.${i}.suffix`, msg: 'Suffix can be at most 3 characters (e.g. + or %)' });
    if (label.length < 2 || label.length > 40) errors.push({ path: `${path}.${i}.label`, msg: 'Label must be 2-40 characters' });
    return { n: Math.round(n), suffix, label };
  });
};

const stringList = (path, list, { max, test, msg, length }, errors) => {
  if (!Array.isArray(list) || list.length < 1 || list.length > max) {
    errors.push({ path, msg: `Add between 1 and ${max} entries` });
    return undefined;
  }
  const cleaned = list.map(v => String(v ?? '').trim()).filter(Boolean);
  if (!cleaned.length) errors.push({ path, msg: 'Add at least one entry' });
  cleaned.forEach((v, i) => {
    if (v.length > length || (test && !test(v))) errors.push({ path: `${path}.${i}`, msg });
  });
  return cleaned;
};

/** Site settings with defaults filled in for anything the stored document doesn't have yet. */
const withDefaults = (stored) => {
  const s = isObj(stored) ? stored : {};
  return {
    ...DEFAULT_SITE,
    ...s,
    sections: { ...DEFAULT_SITE.sections, ...(isObj(s.sections) ? s.sections : {}) },
    banner: { ...DEFAULT_SITE.banner, ...(isObj(s.banner) ? s.banner : {}) }
  };
};

/**
 * Merges a partial update into the current settings and validates the result.
 * Returns { value, errors }; `value` is only meaningful when `errors` is empty.
 */
const normalizeSite = (input, current) => {
  const errors = [];
  const next = withDefaults(current);
  const body = isObj(input) ? input : {};

  if ('heroStats' in body) next.heroStats = counters('heroStats', body.heroStats, errors) || next.heroStats;
  if ('resultCounters' in body) next.resultCounters = counters('resultCounters', body.resultCounters, errors) || next.resultCounters;

  if ('whatsappNumber' in body) {
    const digits = String(body.whatsappNumber ?? '').replace(/[^\d]/g, '');
    if (digits.length < 8 || digits.length > 15) errors.push({ path: 'whatsappNumber', msg: 'Enter the number with country code, e.g. 201274584000' });
    else next.whatsappNumber = digits;
  }
  if ('emails' in body) next.emails = stringList('emails', body.emails, { max: 4, test: v => EMAIL.test(v), msg: 'Enter a valid email address', length: 120 }, errors) || next.emails;
  if ('phones' in body) next.phones = stringList('phones', body.phones, { max: 4, test: v => /^[+()\d][\d\s()+-]{5,28}$/.test(v), msg: 'Enter a valid phone number', length: 30 }, errors) || next.phones;

  if ('sections' in body) {
    if (!isObj(body.sections)) errors.push({ path: 'sections', msg: 'Invalid sections' });
    else {
      Object.keys(DEFAULT_SITE.sections).forEach((key) => {
        if (key in body.sections) next.sections[key] = body.sections[key] === true || body.sections[key] === 'true';
      });
    }
  }

  if ('banner' in body) {
    const b = isObj(body.banner) ? body.banner : {};
    const banner = {
      enabled: b.enabled === true || b.enabled === 'true',
      text: String(b.text ?? '').trim(),
      link: String(b.link ?? '').trim()
    };
    if (banner.enabled && !banner.text) errors.push({ path: 'banner.text', msg: 'Write the announcement text' });
    if (banner.text.length > 160) errors.push({ path: 'banner.text', msg: 'Keep the announcement under 160 characters' });
    if (banner.link && !/^(https:\/\/|\/)[^\s]*$/.test(banner.link)) errors.push({ path: 'banner.link', msg: 'Links must start with https:// or /' });
    if (banner.link.length > 300) errors.push({ path: 'banner.link', msg: 'Link is too long' });
    next.banner = banner;
  }

  return { value: next, errors };
};

module.exports = { DEFAULT_SITE, withDefaults, normalizeSite };
