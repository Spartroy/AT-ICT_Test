const { normalizePastPapers } = require('../validators/pastPapers');
const entries = require('../scripts/data/pastPapers.json');

describe('scripts/data/pastPapers.json', () => {
  it('has one entry per paper + year', () => {
    const keys = entries.map(e => `${e.paper}-${e.year}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(entries.map(e => [`Paper ${e.paper} ${e.year}`, e]))('%s passes the teacher-save validation without losing a variant', (_, entry) => {
    const { value, errors } = normalizePastPapers(entry);
    expect(errors).toEqual([]);
    // normalize drops empty variants and renumbers, so the count must match what the file lists
    const listed = ['jun', 'nov'].reduce((n, s) => n + (entry.sessions[s] || []).length, 0);
    expect(value.docs).toHaveLength(listed);
  });

  it('gives Paper 1 no source files and only Drive links', () => {
    entries.filter(e => e.paper === 1).forEach(e => ['jun', 'nov'].forEach(s => e.sessions[s].forEach(v => expect(v.src).toBe(''))));
    entries.forEach(e => ['jun', 'nov'].forEach(s => e.sessions[s].forEach(v => {
      [v.qp, v.src, v.ms].filter(Boolean).forEach(l => expect(l).toMatch(/^https:\/\/drive\.google\.com\/(file\/d|drive\/folders)\//));
    })));
  });
});
