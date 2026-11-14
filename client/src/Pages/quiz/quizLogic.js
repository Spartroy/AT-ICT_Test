// Pure helpers shared by the teacher quiz builder, the printable paper and the student player.

export const DIFFICULTY = {
  easy: { label: 'Easy', cls: 'c-pr' },
  medium: { label: 'Medium', cls: 'c-am' },
  hard: { label: 'Hard', cls: 'c-rd' }
};

/** Quick starting points for the mix step. Counts per category. */
export const PRESETS = [
  { id: 'check', label: 'Quick check', note: 'About 10 min', counts: { tf: 1, complete: 2, state: 2, describe: 1 } },
  { id: 'test', label: 'Class test', note: 'About 30 min', counts: { tf: 2, tick: 1, complete: 2, wordbank: 1, define: 2, state: 2, describe: 2, explain: 1, advdis: 1, discuss: 1 } },
  { id: 'paper', label: 'Full paper', note: 'About 60 min', counts: { tf: 2, tick: 2, complete: 3, wordbank: 1, pick: 1, define: 3, state: 3, describe: 3, explain: 2, compare: 1, advdis: 2, discuss: 2, multi: 3 } }
];

/** Splits "The CPU is called a …" at its blanks. Returns [{ text } | { blank: index }]. */
export function splitBlanks(text = '') {
  const out = [];
  let n = 0;
  String(text).split(/(…+|\.{3,}|_{3,})/).forEach(piece => {
    if (!piece) return;
    if (/^(…+|\.{3,}|_{3,})$/.test(piece)) out.push({ blank: n++ });
    else out.push({ text: piece });
  });
  return out;
}

export const totalMarks = (items) => Math.round(items.reduce((n, i) => n + (Number(i.marks) || 0), 0) * 2) / 2;

/** Rough working time: about a minute a mark, a little less for ticks and fill-ins. */
export function suggestedMinutes(items) {
  const mins = items.reduce((n, i) => n + (['tf', 'tick', 'fill', 'pick', 'match'].includes(i.type) ? i.marks * 0.6 : i.marks * 1.2), 0);
  return Math.max(5, Math.round(mins / 5) * 5);
}

export const questionTitle = (item) => item.lead || item.context || item.parts?.[0]?.text || (item.items?.[0]?.text) || 'Question';

/** Lines of answer space for the printed paper: roughly one per mark, at least 2. */
export const answerLines = (marks) => Math.max(2, Math.min(14, Math.round(marks * 1.5)));

export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(sec).padStart(2, '0')}`;
}

/** Has the student put something in this answer? */
export function isAnswered(item, v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(x => x !== '' && x !== null && x !== undefined);
  return false;
}

/** Percentage badge colour class. */
export const pctClass = (p, pass = 50) => (p === null || p === undefined ? 'c-gy' : p >= Math.max(pass, 75) ? 'c-pr' : p >= pass ? 'c-am' : 'c-rd');

export const RISK = {
  none: { label: 'Clean', cls: 'c-pr' },
  low: { label: 'Low', cls: 'c-gy' },
  medium: { label: 'Check', cls: 'c-am' },
  high: { label: 'High', cls: 'c-rd' }
};

// ---- several boxes, one answer ---------------------------------------------------------------------------------
// The server marks one string per question row. When a sentence has several gaps, or a question asks for an
// explanation and an example, the student gets one box each and the boxes are joined back into that one string.

/** The text sitting between one blank and the next ("The CPU has … and …" -> [" and "]). */
export function gapJoins(text = '') {
  const joins = [];
  let seen = false;
  let cur = '';
  splitBlanks(text).forEach(p => {
    if (p.blank !== undefined) { if (seen) joins.push(cur); seen = true; cur = ''; } else if (seen) cur += p.text;
  });
  return joins;
}

export const blankCount = (text = '') => splitBlanks(text).filter(p => p.blank !== undefined).length;

export function composeGaps(boxes, joins) {
  if (!boxes.some(b => String(b || '').trim())) return '';
  return boxes.map((b, i) => String(b || '').trim() + (i < boxes.length - 1 ? (joins[i] ?? ' ') : '')).join('');
}

export function splitGaps(value = '', joins = [], count = 1) {
  const out = [];
  let rest = String(value || '');
  for (let i = 0; i < count - 1; i++) {
    const j = joins[i] || ' ';
    const at = rest.indexOf(j);
    if (at < 0) { out.push(rest); rest = ''; } else { out.push(rest.slice(0, at)); rest = rest.slice(at + j.length); }
  }
  out.push(rest);
  return out;
}

const NUMBER_WORDS = { two: 2, three: 3, four: 4, five: 5, 2: 2, 3: 3, 4: 4, 5: 5 };
const COUNT_RE = /\b(two|three|four|five|2|3|4|5)\s+(?:[\w-]+\s+){0,2}?(features|ways|advantages|disadvantages|reasons|points|uses|benefits|methods|characteristics|differences|similarities|effects|problems|issues|examples|functions|steps|types|ideas|factors)\b/gi;
const EXAMPLE_RE = /\b(giv(?:e|ing)|using|with|including)\s+(?:an?\s+|one\s+|some\s+)?examples?\b/i;
export const EXAMPLE_MARK = '\n\nExample: ';

/**
 * How a written question should be answered: null for one big box, or
 * { kind: 'parts', intro, parts: [{ label, text }] } for "(a) … (b) …" written into one sentence,
 * { kind: 'example' } for "explain … giving an example", { kind: 'count', n } for "describe three features".
 */
export function answerLayout(text = '', category = '') {
  const t = String(text || '');
  const marks = [...t.matchAll(/\(([a-z])\)\s*/g)];
  if (marks.length >= 2 && marks[0][1] === 'a' && marks[1][1] === 'b') {
    const parts = marks.map((m, i) => ({ label: m[1], text: t.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : undefined).trim() }));
    return { kind: 'parts', intro: t.slice(0, marks[0].index).trim(), parts };
  }
  if (EXAMPLE_RE.test(t) && !/\beach\b/i.test(t)) return { kind: 'example' };
  const counts = [...t.matchAll(COUNT_RE)];
  if (counts.length === 1 && !['compare', 'advdis', 'discuss'].includes(category)) return { kind: 'count', n: NUMBER_WORDS[counts[0][1].toLowerCase()], noun: counts[0][2].toLowerCase() };
  return null;
}

export function composeLayout(layout, boxes) {
  if (!boxes.some(b => String(b || '').trim())) return '';
  if (layout.kind === 'example') return `${String(boxes[0] || '').trim()}${EXAMPLE_MARK}${String(boxes[1] || '').trim()}`;
  if (layout.kind === 'parts') return layout.parts.map((p, i) => `(${p.label}) ${String(boxes[i] || '').trim()}`).join('\n');
  return boxes.map((b, i) => `${i + 1}. ${String(b || '').trim()}`).join('\n');
}

export function splitLayout(layout, value = '') {
  const v = String(value || '');
  if (layout.kind === 'example') {
    const at = v.indexOf(EXAMPLE_MARK);
    return at < 0 ? [v, ''] : [v.slice(0, at), v.slice(at + EXAMPLE_MARK.length)];
  }
  const n = layout.kind === 'parts' ? layout.parts.length : layout.n;
  const re = layout.kind === 'parts' ? /^\([a-z]\)\s?/m : /^\d+\.\s?/m;
  const chunks = v.split(new RegExp(re.source, 'gm')).slice(v.search(re) === 0 ? 1 : 0);
  return Array.from({ length: n }, (_, i) => (chunks[i] || '').trim());
}

/** "2d 03:04:05" / "03:04:05" / "04:05" until something opens. */
export function countdownLabel(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n) => String(n).padStart(2, '0');
  if (d) return `${d}d ${p(h)}:${p(m)}:${p(s % 60)}`;
  return h ? `${p(h)}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`;
}
