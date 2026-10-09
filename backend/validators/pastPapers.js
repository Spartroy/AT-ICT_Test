// Validates what the teacher submits for one paper + year: Jun and Nov variants with their links.

const YEARS = { min: 2018, max: 2026 };
const MAX_VARIANTS = 9;
const SESSIONS = ['jun', 'nov'];
const LINK = /^https?:\/\/[^\s]+$/i;

/**
 * Input: { paper: 1|2|3, year, sessions: { jun: [{ qp, src, ms }], nov: [...] } }
 * Variants are numbered V1, V2… in the order given; empty variants are dropped.
 * Returns { value: { paper, year, docs: [{ paper, year, session, variant, qp, src, ms }] }, errors: [{ path, msg }] }.
 */
function normalizePastPapers(input = {}) {
  const errors = [];
  const paper = Number(input.paper);
  const year = Number(input.year);
  if (![1, 2, 3].includes(paper)) errors.push({ path: 'paper', msg: 'Choose Paper 1, 2 or 3' });
  if (!Number.isInteger(year) || year < YEARS.min || year > YEARS.max) errors.push({ path: 'year', msg: `Choose a year from ${YEARS.min} to ${YEARS.max}` });

  const docs = [];
  const sessions = input.sessions && typeof input.sessions === 'object' ? input.sessions : {};
  SESSIONS.forEach((session) => {
    const list = Array.isArray(sessions[session]) ? sessions[session] : [];
    if (list.length > MAX_VARIANTS) errors.push({ path: `sessions.${session}`, msg: `At most ${MAX_VARIANTS} variants per session` });
    let variant = 0;
    list.slice(0, MAX_VARIANTS).forEach((raw, i) => {
      const links = { qp: String(raw?.qp ?? '').trim(), src: paper === 1 ? '' : String(raw?.src ?? '').trim(), ms: String(raw?.ms ?? '').trim() };
      if (!links.qp && !links.src && !links.ms) return; // empty variant
      Object.entries(links).forEach(([key, link]) => {
        if (link && (!LINK.test(link) || link.length > 600)) errors.push({ path: `sessions.${session}.${i}.${key}`, msg: 'Links must start with http:// or https://' });
      });
      variant += 1;
      docs.push({ paper, year, session, variant, ...links });
    });
  });

  return { value: { paper, year, docs }, errors };
}

module.exports = { normalizePastPapers, YEARS, MAX_VARIANTS };
