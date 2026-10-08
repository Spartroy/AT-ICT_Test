// Library folder tree built from item paths, e.g. ['Theory', 'Phase 1', 'Chapter 2'].
// Top two levels always show; deeper levels only under the selected branch.

const key = (p) => p.join('\u001f');

const RANK = { Theory: 0, Practical: 1, Other: 2 };
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Natural order: Theory, Practical, Other first, then "Phase 2" before "Phase 10", then title. */
export function sortByPath(items) {
  return [...items].sort((a, b) => {
    for (let i = 0; i < Math.max(a.path.length, b.path.length); i++) {
      const x = a.path[i] ?? '';
      const y = b.path[i] ?? '';
      if (x === y) continue;
      if (i === 0 && (x in RANK || y in RANK)) return (RANK[x] ?? 9) - (RANK[y] ?? 9);
      return collator.compare(x, y);
    }
    return collator.compare(a.title || '', b.title || '');
  });
}

/** True when `path` starts with `prefix` (an empty prefix matches everything). */
export const inPath = (path, prefix) => prefix.every((p, i) => path[i] === p);

/**
 * items: [{ path: string[] }]. selected: current path.
 * Returns [{ key, label, level (1-based), path, count, selected }] in first-seen order.
 */
export function buildTree(items, selected = []) {
  const nodes = new Map();
  items.forEach(it => {
    it.path.forEach((_, i) => {
      const p = it.path.slice(0, i + 1);
      const k = key(p);
      const n = nodes.get(k) || { key: k, label: p[p.length - 1], level: p.length, path: p, count: 0 };
      n.count += 1;
      nodes.set(k, n);
    });
  });
  return [...nodes.values()]
    // Deeper levels appear once their parent (or something inside it) is selected.
    .filter(n => n.level <= 2 || inPath(selected, n.path.slice(0, -1)))
    .map(n => ({ ...n, selected: key(n.path) === key(selected) }));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML-escaped text with case-insensitive matches of `q` wrapped in <mark>. */
export function highlight(text, q) {
  const safe = esc(text);
  if (!q) return safe;
  const re = new RegExp(`(${esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return safe.replace(re, '<mark>$1</mark>');
}
