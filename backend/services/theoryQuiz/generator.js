// Picks questions for a quiz and turns bank questions into the snapshots a quiz stores and students answer.
const crypto = require('crypto');
const { CATEGORIES, categoryOf, isWordBankEligible } = require('./categories');

const uid = () => crypto.randomBytes(5).toString('hex');
const ORDER = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i]));
const WEIGHTS = {
  mixed: { easy: 1, medium: 1, hard: 1 },
  easier: { easy: 3, medium: 2, hard: 1 },
  harder: { easy: 1, medium: 2, hard: 3 }
};

/** Bank questions a quiz may use: visible, not a duplicate, and answerable without a missing picture. */
const usable = (q) => !q.hidden && !q.dupOf && !(q.needsContext && !q.imageUrl && !q.contextNote);

function plain(q) {
  const o = typeof q.toObject === 'function' ? q.toObject() : q;
  return { ...o, _id: o._id ? String(o._id) : undefined };
}

/** Everything a quiz stores about one question (a snapshot, so later bank edits never change a published quiz). */
function toItem(q, { presentation = 'default', marks, wordbank } = {}) {
  const b = plain(q);
  return {
    uid: uid(),
    bankId: b._id,
    srcId: b.srcId || '',
    type: b.type,
    category: presentation === 'wordbank' ? 'wordbank' : categoryOf(b),
    chapterKey: b.chapterKey,
    chapter: b.chapter,
    topic: b.topic,
    difficulty: b.difficulty,
    command: b.command,
    marks: marks ?? b.marks,
    baseMarks: b.marks,
    presentation,
    lead: b.lead || '',
    context: b.context || '',
    contextNote: b.contextNote || '',
    imageUrl: b.imageUrl || '',
    items: b.items || [],
    columns: b.columns || [],
    options: b.options || [],
    n: b.n || 0,
    answers: b.answers || [],
    terms: b.terms || [],
    wordbank: wordbank || b.wordbank || [],
    parts: b.parts || [],
    model: b.model || '',
    points: b.points || [],
    tip: b.tip || ''
  };
}

function distractors(item, others, count) {
  const own = new Set(item.items.map(i => i.answers[0].toLowerCase()));
  const pool = [];
  others.forEach(o => {
    if (o.srcId === item.srcId) return;
    (o.items || []).forEach(i => {
      const a = (i.answers || [])[0];
      if (a && a.split(/\s+/).length <= 3 && !/[\/;]/.test(a) && !own.has(a.toLowerCase())) pool.push({ a, same: o.chapter === item.chapter });
    });
  });
  pool.sort((x, y) => (y.same - x.same) || (Math.random() - 0.5));
  const seen = new Set();
  const out = [];
  for (const p of pool) {
    const k = p.a.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(p.a); }
    if (out.length >= count) break;
  }
  return out;
}

/** As a word bank: every answer of the block, plus a few believable extras. */
function asWordBank(q, allFill) {
  const b = plain(q);
  if (b.wordbank && b.wordbank.length) return toItem(b, { presentation: 'wordbank' });
  const answers = b.items.map(i => i.answers[0]);
  const extra = distractors(b, allFill, Math.max(2, Math.ceil(b.items.length / 2)));
  return toItem(b, { presentation: 'wordbank', wordbank: [...answers, ...extra] });
}

/**
 * counts: { tf: 2, wordbank: 1, discuss: 3 ... }
 * Returns { items, shortages: [{ category, wanted, got }] } ordered like an exam paper (short objective first, long written last).
 */
function generate({ pool, counts, difficulty = 'mixed', exclude = new Set(), preferNot = new Set() }) {
  const w = WEIGHTS[difficulty] || WEIGHTS.mixed;
  const used = new Set(exclude);
  const cover = {};
  const bank = pool.filter(usable).map(plain);
  const allFill = bank.filter(q => q.type === 'fill');
  const candidatesFor = (cat) => bank.filter(q => (cat === 'wordbank' ? isWordBankEligible(q) : categoryOf(q) === cat));
  const wanted = Object.entries(counts).map(([category, n]) => ({ category, n: Math.max(0, Math.floor(Number(n) || 0)) })).filter(c => c.n > 0 && ORDER[c.category] !== undefined);
  // Fill scarce categories first so they are not starved by common ones
  wanted.sort((a, b) => candidatesFor(a.category).length - candidatesFor(b.category).length);
  const picked = [];
  const shortages = [];
  wanted.forEach(({ category, n }) => {
    let got = 0;
    for (let k = 0; k < n; k++) {
      const left = candidatesFor(category).filter(q => !used.has(String(q._id || q.srcId)));
      if (!left.length) break;
      let best = null;
      let bestScore = -Infinity;
      left.forEach(q => {
        const seen = (cover[`${q.chapterKey}|${q.topic}`] || 0) * 1.5 + (cover[q.chapterKey] || 0) * 0.3;
        const score = (w[q.difficulty] || 1) / (1 + seen) + Math.random() * 0.35 - (preferNot.has(String(q._id || q.srcId)) ? 0.6 : 0);
        if (score > bestScore) { bestScore = score; best = q; }
      });
      used.add(String(best._id || best.srcId));
      cover[`${best.chapterKey}|${best.topic}`] = (cover[`${best.chapterKey}|${best.topic}`] || 0) + 1;
      cover[best.chapterKey] = (cover[best.chapterKey] || 0) + 1;
      picked.push(category === 'wordbank' ? asWordBank(best, allFill) : toItem(best));
      got++;
    }
    if (got < n) shortages.push({ category, wanted: n, got });
  });
  picked.sort((a, b) => (ORDER[a.category] - ORDER[b.category]) || (a.marks - b.marks));
  return { items: picked, shortages };
}

/** Counts the pool offers per category and difficulty (for the "how many are available" hints). */
function availability(pool) {
  const out = {};
  CATEGORIES.forEach(c => { out[c.id] = { total: 0, easy: 0, medium: 0, hard: 0, marks: 0 }; });
  pool.filter(usable).map(plain).forEach(q => {
    const cats = [categoryOf(q)];
    if (isWordBankEligible(q)) cats.push('wordbank');
    cats.forEach(c => {
      out[c].total++;
      out[c][q.difficulty] = (out[c][q.difficulty] || 0) + 1;
      out[c].marks += q.marks;
    });
  });
  return out;
}

// ---- what a student is allowed to see ---------------------------------------------------------------------------

function seeded(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) { h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The item without answers, mark-scheme points or tips; options are shuffled per student. */
function forStudent(item, seed) {
  const rand = seeded(`${seed}:${item.uid}`);
  const base = { uid: item.uid, type: item.type, category: item.category, presentation: item.presentation, marks: item.marks, lead: item.lead, context: item.context, contextNote: item.contextNote, imageUrl: item.imageUrl };
  switch (item.type) {
    case 'tf': return { ...base, items: item.items.map(i => ({ text: i.text })) };
    case 'tick': return { ...base, columns: item.columns, items: item.items.map(i => ({ text: i.text })) };
    case 'fill': return { ...base, items: item.items.map(i => ({ text: i.text })), wordbank: item.presentation === 'wordbank' ? shuffle(item.wordbank, rand) : undefined };
    case 'pick': return { ...base, n: item.n, options: shuffle(item.options, rand) };
    case 'match': return { ...base, items: item.items.map(i => ({ text: i.text })), terms: shuffle(item.terms, rand) };
    case 'multi': return { ...base, parts: item.parts.map(p => ({ label: p.label, text: p.text, marks: Math.round(p.marks * (item.marks / item.baseMarks) * 2) / 2 })) };
    default: return base;
  }
}

module.exports = { generate, availability, toItem, forStudent, shuffle, seeded, usable, plain, uid };
