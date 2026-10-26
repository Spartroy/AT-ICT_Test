// Groups the flat past-paper list from the API into year shelves.

export const PAPERS = [
  { id: 1, label: 'Paper 1 · Theory' },
  { id: 2, label: 'Paper 2 · Practical' },
  { id: 3, label: 'Paper 3 · Practical' }
];
export const SESSION_LABEL = { jun: 'Jun', nov: 'Nov' };

/**
 * [{ year, sessions: [{ session: 'jun'|'nov', variants: [paperDoc…] }] }], newest year first.
 * Sessions without variants are left out; variants are in V1, V2… order.
 */
export function groupPastPapers(list = [], paper) {
  const years = new Map();
  list.filter(p => p.paper === paper).forEach((p) => {
    if (!years.has(p.year)) years.set(p.year, { jun: [], nov: [] });
    years.get(p.year)[p.session]?.push(p);
  });
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, bySession]) => ({
      year,
      sessions: ['jun', 'nov']
        .filter(s => bySession[s].length)
        .map(s => ({ session: s, variants: [...bySession[s]].sort((a, b) => a.variant - b.variant) }))
    }));
}

/** Theory papers are tall (one year per shelf); the practical papers (2 and 3) fit two years side by side on a shelf. */
export const yearsPerShelf = (paper) => (paper === 1 ? 1 : 2);

/** Splits year groups into shelves: [[year, year], [year], …], keeping the newest-first order. */
export function shelvesOf(years = [], paper) {
  const size = yearsPerShelf(paper);
  const shelves = [];
  for (let i = 0; i < years.length; i += size) shelves.push(years.slice(i, i + size));
  return shelves;
}

// Each variant gets its own accent colour (defined as --pv-1 … --pv-9 in books.css); V10 and up would wrap around.
const COLOURS = 9;
const indexOf = (variant) => ((Math.max(1, variant) - 1) % COLOURS) + 1;
export const variantColor = (variant) => `var(--pv-${indexOf(variant)})`;
variantColor.index = indexOf;

/** Stable id of a variant for the "practised" ticks, e.g. "2-2024-jun-1" (matches the backend). */
export const paperKey = (p) => `${p.paper}-${p.year}-${p.session}-${p.variant}`;

/** Per-year totals for the year chips: [{ year, done, total }], in the order of `years` (from groupPastPapers). */
export function yearStats(years = [], done = new Set()) {
  return years.map(({ year, sessions }) => {
    const all = sessions.flatMap(s => s.variants);
    return { year, total: all.length, done: all.filter(v => done.has(paperKey(v))).length };
  });
}

/** Keeps a remembered year/session only if it still exists; otherwise the newest year and its first session. */
export function resolveSelection(years = [], saved = {}) {
  const y = years.find(g => g.year === saved.year) || years[0];
  if (!y) return { year: null, session: null };
  const s = y.sessions.find(x => x.session === saved.session) || y.sessions[0];
  return { year: y.year, session: s?.session || null };
}
