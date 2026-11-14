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
