import { PHASES, PROGRAMS } from './curriculum';

// Title choices for a free-sample card, taken from the same curriculum the Library uses
// (theory chapters by phase, practical guides and tasks by program), plus a custom title.

export const CUSTOM_TITLE = '__custom';

export const KIND_OPTIONS = [
  { value: 'notes', label: 'Interactive notes (Prezi…)', short: 'Interactive notes' },
  { value: 'video', label: 'Video', short: 'Video' },
  { value: 'file', label: 'File / worksheet', short: 'File' }
];
export const kindLabel = (kind) => KIND_OPTIONS.find(k => k.value === kind)?.short || 'Sample';

/** [{ label: 'Theory · Phase 1', options: [{ value, label }] }, …] for a grouped <select>. */
export const TITLE_GROUPS = [
  ...PHASES.map(p => ({ label: `Theory · ${p.label}`, options: p.chapters.map(c => ({ value: c, label: c })) })),
  ...PROGRAMS.map(p => ({
    label: `Practical · ${p.short}`,
    options: ['Guide', 'Task'].flatMap(kind => Array.from({ length: p.count }, (_, i) => {
      const value = `${p.short} ${kind} ${i + 1}`;
      return { value, label: value };
    }))
  }))
];

const ALL_TITLES = new Set(TITLE_GROUPS.flatMap(g => g.options.map(o => o.value)));
export const isKnownTitle = (title) => ALL_TITLES.has(title);

/** "CH 6 P1 Networks" → "Networks"; "Excel Task 2" stays as is. */
const topicName = (title) => title.replace(/^CH\s*\d+\s*(P\d\s*)?/i, '').trim() || title;

/** Ready-made description for a title + type; the teacher can edit it afterwards. */
export function presetDescription(title, kind) {
  const t = (title || '').trim();
  if (!t) return '';
  const practical = PROGRAMS.map(p => ({ p, m: t.match(new RegExp(`^${p.short}\\s+(Guide|Task)\\s+(\\d+)$`, 'i')) })).find(x => x.m);
  if (practical) {
    const { p, m } = practical;
    const what = `Microsoft ${p.short} ${m[1].toLowerCase()} ${m[2]}`;
    if (kind === 'video') return `Watch a screen-recorded walkthrough of ${what}, step by step.`;
    if (kind === 'file') return `A ready-to-use file for ${what}: open it and follow along.`;
    return m[1].toLowerCase() === 'guide'
      ? `Follow ${what} step by step, with clear screenshots and tips.`
      : `Try ${what} yourself, then check your work against the marking points.`;
  }
  if (isKnownTitle(t)) {
    const name = topicName(t);
    if (kind === 'video') return `Watch the ${name} explanation: the theory step by step, with exam tips.`;
    if (kind === 'file') return `A ${name} worksheet to practise what you learned, with exam-style questions.`;
    return `Learn ${name} with our interactive notes: key ideas, diagrams and quick revision points.`;
  }
  if (kind === 'video') return `A free video lesson from the AT-ICT IGCSE ICT course: ${t}.`;
  if (kind === 'file') return `A free file from the AT-ICT IGCSE ICT course: ${t}.`;
  return `Free interactive notes from the AT-ICT IGCSE ICT course: ${t}.`;
}
