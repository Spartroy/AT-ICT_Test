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
