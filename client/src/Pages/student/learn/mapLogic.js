// Pure logic behind the Learn maps (serpentine video map + notes orbit). No React here so it can be unit-tested.

export const PHASE_COLORS = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)'];

export const PROGRAMS = [
  { key: 'word', title: 'Microsoft Word', color: 'var(--prog-word)', icon: 'doc' },
  { key: 'powerpoint', title: 'Microsoft PowerPoint', color: 'var(--prog-powerpoint)', icon: 'slides' },
  { key: 'access', title: 'Microsoft Access', color: 'var(--prog-access)', icon: 'db' },
  { key: 'excel', title: 'Microsoft Excel', color: 'var(--prog-excel)', icon: 'grid' },
  { key: 'sharepoint', title: 'Microsoft SharePoint', color: 'var(--prog-sharepoint)', icon: 'share' }
];

const byOrder = (a, b) => (a.chapter ?? 0) - (b.chapter ?? 0) || (a.order ?? 0) - (b.order ?? 0) || String(a.title).localeCompare(String(b.title));

/**
 * Turns GET /api/student/videos `data.videos` into map groups per section.
 * Returns { theory: Group[], practical: Group[], other: Group[] } where
 * Group = { key, title, sub, color, icon, num?, kind, items: [{ id, title, url, description }] }.
 */
export function buildVideoGroups(videos = {}) {
  const toItem = v => ({ id: String(v._id), title: v.title, url: v.videoUrl, description: v.description || '' });
  const theory = [1, 2, 3].map((n, i) => {
    const items = [...(videos.theory?.[`phase${n}`] || [])].sort(byOrder).map(toItem);
    return { key: `phase${n}`, title: `Phase ${n}`, sub: `${items.length} lesson${items.length === 1 ? '' : 's'}`, color: PHASE_COLORS[i], icon: 'play', num: n, kind: 'Video lesson', items };
  });
  const practical = PROGRAMS.map(p => {
    const group = videos.practical?.[p.key] || {};
    const guides = [...(group.guides || [])].sort(byOrder).map(toItem);
    const tasks = [...(group.tasks || [])].sort(byOrder).map(toItem);
    const items = [...guides, ...tasks];
    const parts = [guides.length && `${guides.length} guide${guides.length === 1 ? '' : 's'}`, tasks.length && `${tasks.length} task${tasks.length === 1 ? '' : 's'}`].filter(Boolean);
    return { key: p.key, title: p.title, sub: parts.join(' · ') || 'No videos yet', color: p.color, icon: p.icon, kind: `${p.title.replace('Microsoft ', '')} practical video`, items };
  });
  const otherItems = [...(videos.other || [])].sort(byOrder).map(toItem);
  const other = [{ key: 'other', title: 'Valuable revisions', sub: `${otherItems.length} revision video${otherItems.length === 1 ? '' : 's'}`, color: 'var(--gold-500)', icon: 'star', kind: 'Revision video', items: otherItems }];
  return { theory, practical, other };
}

/** Node state per item: 'done', 'cur' (first unfinished = START) or 'open'. */
export function nodeStates(items, doneIds) {
  const done = doneIds instanceof Set ? doneIds : new Set(doneIds);
  const cur = items.findIndex(it => !done.has(it.id));
  return items.map((it, i) => ({ ...it, state: done.has(it.id) ? 'done' : i === cur ? 'cur' : 'open' }));
}

export const doneCount = (items, doneIds) => {
  const done = doneIds instanceof Set ? doneIds : new Set(doneIds);
  return items.filter(it => done.has(it.id)).length;
};

/** Index of the group to open by default: the first with unfinished lessons (else the first). */
export function defaultOpenGroup(groups, doneIds) {
  const i = groups.findIndex(g => g.items.length && doneCount(g.items, doneIds) < g.items.length);
  return i === -1 ? 0 : i;
}

/**
 * Splits items into serpentine rows of `cols` (4 desktop, 3 ≤700px). Odd rows run right-to-left.
 * `more` marks rows followed by another row (they get the vertical connector).
 */
export function serpentineRows(items, cols) {
  const rows = [];
  for (let r = 0; r * cols < items.length; r++) {
    rows.push({ items: items.slice(r * cols, r * cols + cols), start: r * cols, reverse: r % 2 === 1, more: (r + 1) * cols < items.length });
  }
  return rows;
}

/** "CH 6 Networks" → { num: '6', title: 'Networks' }. Uses the note's chapter field when present. */
export function chapterInfo(note) {
  const m = String(note.title || '').match(/^\s*CH\s*(\d+)\s*(.*)$/i);
  return { num: note.chapter ? String(note.chapter) : m ? m[1] : '', title: m ? m[2] || note.title : note.title };
}

/** Splits a title into two balanced lines for the orbit circles. */
export function twoLines(s) {
  const w = String(s).split(' ');
  if (w.length < 2) return [s];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < w.length; i++) {
    const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}

/** Orbit positions for n chapters around the hub, starting at 12 o'clock. */
export function orbitPositions(n, radius) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: Math.round(radius * Math.cos(a)), y: Math.round(radius * Math.sin(a)) };
  });
}
