// Turns the solved Classified mark scheme (HTML) into structured, gradable questions.
// Pure functions only, so it can be tested without a database.
const { commandOf, difficultyOf, norm, tokens } = require('./classify');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const text = (s) => decode(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const all = (re, s) => [...s.matchAll(re)].map(m => text(m[1]));

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const stripLabel = (s) => s.replace(/^\(\s*[a-z]{1,4}\s*\)\s*(\(\s*[ivx]+\s*\)\s*)?/i, '').replace(/^[A-Z]\)\s+/, '').trim();
const labelOf = (s) => (s.match(/^\(\s*([a-z])\s*\)/i) || [])[1]?.toLowerCase() || null;
const afterDash = (s) => (s.includes(' — ') ? s.split(' — ').slice(1).join(' — ') : s).trim();
const beforeDash = (s) => s.split(' — ')[0].trim();
const cleanAnswer = (s) => stripLabel(s).replace(/\s*\.$/, '').trim();

/** Alternatives accepted for a short answer: "a / b", "a or b", and a bracketed synonym. */
function alternatives(answer) {
  const base = cleanAnswer(answer);
  const out = new Set([base]);
  base.split(/\s*(?:\/|;|\bor\b)\s*/i).forEach(p => p && out.add(p.trim()));
  const m = base.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
  if (m) {
    out.add(`${m[1]} ${m[3]}`.trim());
    out.add(m[2].trim());
  }
  return [...out].filter(Boolean);
}

/** Fuzzy match of an answer line to the nearest option (by shared words). */
function bestOption(options, line) {
  const t = new Set(tokens(line));
  let best = -1;
  let score = 0;
  options.forEach((o, i) => {
    const ot = tokens(o);
    const hit = ot.filter(w => t.has(w)).length / Math.max(1, ot.length);
    if (hit > score) { score = hit; best = i; }
  });
  return score >= 0.5 ? best : -1;
}

function parseColumns(lead, answers) {
  let cols = null;
  const paren = lead.match(/\(([^)]*\/[^)]*)\)/);
  if (paren) cols = paren[1].split('/').map(s => s.trim());
  else {
    let head = lead.replace(/:\s*$/, '').replace(/^tick\s+(whether\s+)?(each\s+)?/i, '');
    for (let i = 0; i < 3; i++) head = head.replace(/^(is|are|refers? to|applies to|a feature of|be|as)\s+/i, '');
    const m = [null, head];
    if (m) cols = m[1].split(/\s*,\s*|\s+or\s+/).map(s => s.replace(/^(an?|the)\s+/i, '').replace(/^\s*(either)\s+/i, '').trim()).filter(Boolean);
  }
  const given = answers.map(a => afterDash(a).replace(/\s*\(.*\)\s*$/, '').trim());
  const ok = cols && cols.length >= 2 && given.every(g => cols.some(c => norm(c) === norm(g) || norm(c).includes(norm(g)) || norm(g).includes(norm(c))));
  if (!ok) cols = [...new Set(given)];
  // Row answers become the exact column label
  const pickCol = (g) => {
    const n = norm(g);
    const exact = cols.find(c => norm(c) === n);
    if (exact) return exact;
    const wider = cols.filter(c => norm(c).includes(n)).sort((a, b) => a.length - b.length)[0];
    if (wider) return wider;
    return cols.filter(c => n.includes(norm(c))).sort((a, b) => b.length - a.length)[0] || g;
  };
  const matched = given.map(pickCol);
  return { columns: cols, answers: matched };
}

function parseOne(raw, chapter) {
  const { qLines, ansLines, ms, tip } = raw;
  const lead = qLines[0] || '';
  let body = qLines.slice(1);
  // Rows given on one line, separated by semicolons ("Linker; Compiler; ...")
  if (body.length === 1 && body[0].includes(';') && ansLines.length > 1 && /^tick\b/i.test(lead)) body = body[0].replace(/\.$/, '').split(/\s*;\s*/);
  const totalMarks = raw.marks;
  const base = { chapter, qNo: raw.qNo, marks: totalMarks, lead, points: ms, tip: tip || '' };
  const model = ansLines.join('\n');
  const fullText = qLines.join(' ');

  // 1. True / false
  if (/true or false/i.test(lead) && body.length) {
    let ans = ansLines.map(a => /\bTRUE\b/.test(a.split(' — ').pop()));
    if (ans.length !== body.length) ans = (ansLines.join(' ').match(/\b(TRUE|FALSE)\b/g) || []).map(f => f === 'TRUE');
    if (ans.length === body.length) {
      return { ...base, type: 'tf', items: body.map((t, i) => ({ text: t, answer: ans[i] })), model };
    }
  }
  // 2. Word bank written into the stem
  if (/word bank/i.test(lead) && body.length) {
    const bank = lead.split(/word bank:?/i)[1]?.replace(/[.:]\s*$/, '').split(',').map(s => s.trim()).filter(Boolean) || [];
    if (bank.length && ansLines.length === body.length) {
      return { ...base, type: 'fill', wordbank: bank, items: body.map((t, i) => ({ text: stripLabel(t), answers: alternatives(ansLines[i]) })), model, lead: lead.replace(/\s*(using )?the word bank.*$/i, '').replace(/:\s*$/, ':') || 'Complete the sentences using the word bank:' };
    }
  }
  // 3. Connect / match
  if (/^connect each|^match/i.test(lead) && ansLines.length >= 2 && ansLines.every(a => a.includes(' — '))) {
    const left = ansLines.map(beforeDash);
    const right = ansLines.map(a => afterDash(a));
    return { ...base, type: 'match', items: left.map((l, i) => ({ text: l, answer: right[i] })), terms: right, model };
  }
  // 4. Tick table (one tick per row across a few columns)
  if (/^tick\b/i.test(lead) && !/^tick (two|three|four|five)\b/i.test(lead) && body.length >= 2 && ansLines.length === body.length && ansLines.every(a => a.includes(' — '))) {
    const { columns, answers } = parseColumns(lead, ansLines);
    if (columns.length >= 2) {
      return { ...base, type: 'tick', columns, items: body.map((t, i) => ({ text: t, answer: answers[i] })), model };
    }
  }
  // 5. Tick / circle N from a list
  const pickN = lead.match(/^(?:tick|circle)\b.*?\b(one|two|three|four|five|six)\b/i);
  if (pickN && !/^\(\w\)/.test(lead)) {
    const n = NUMBER_WORDS[pickN[1].toLowerCase()];
    let options = [];
    const afterColon = lead.includes(':') ? lead.slice(lead.indexOf(':') + 1) : '';
    if (afterColon.trim()) options = afterColon.split(/\s*[,;]\s*/).map(s => s.replace(/[.\s]+$/, '').trim()).filter(Boolean);
    else if (body.length >= n + 1) options = body;
    const src = ansLines.join('; ').split(/\s*[;,]\s*/).filter(Boolean);
    const correct = [...new Set(src.map(s => bestOption(options, s)).filter(i => i >= 0))];
    if (options.length > n && correct.length === n) {
      return { ...base, type: 'pick', n, options, answers: correct.map(i => options[i]), model, lead: lead.split(':')[0] + ':' };
    }
  }
  // 6. Complete / name / identify a list of items, each with a short answer
  const itemLines = body.length ? body : [];
  const blankLines = qLines.filter(l => /…|\.{3}/.test(l));
  if (blankLines.length && qLines.length === ansLines.length && !/^\(\w\)\s*(explain|describe|discuss)/i.test(fullText)) {
    return { ...base, type: 'fill', items: qLines.map((t, i) => ({ text: stripLabel(t), answers: alternatives(ansLines[i]) })), lead: '', model };
  }
  if (blankLines.length && !body.length && ansLines.length) {
    return { ...base, type: 'fill', items: [{ text: lead, answers: alternatives(ansLines.join(' and ')) }], lead: '', model };
  }
  if (/^(complete|name|identify|state|write|give)\b/i.test(lead) && itemLines.length >= 2 && ansLines.length === itemLines.length && itemLines.every(l => !/\[\d+\]/.test(l))) {
    const short = ansLines.every(a => tokens(cleanAnswer(afterDash(a))).length <= 6);
    if (short) {
      return { ...base, type: 'fill', items: itemLines.map((t, i) => ({ text: stripLabel(t), answers: alternatives(afterDash(ansLines[i])) })), model };
    }
  }
  // 7. Multi-part question
  const parts = splitParts(qLines, ansLines, ms, totalMarks);
  if (parts) return { ...base, type: 'multi', context: parts.context, parts: parts.list, model };

  // 8. Single written answer
  return { ...base, type: 'written', model };
}

/** (a)(b)(c) parts with [n] marks. Returns null when the marks cannot be reconciled. */
function splitParts(qLines, ansLines, ms, total) {
  const first = qLines.findIndex(l => /^\(\s*[a-z]\s*\)/i.test(l));
  if (first < 0) return null;
  const context = qLines.slice(0, first).join(' ');
  const groups = [];
  qLines.slice(first).forEach(l => {
    if (/^\(\s*[a-z]\s*\)/i.test(l) || !groups.length) groups.push({ label: labelOf(l), lines: [l] });
    else groups[groups.length - 1].lines.push(l);
  });
  const list = groups.map(g => {
    const t = g.lines.join(' ');
    const marks = [...t.matchAll(/\[(\d+)\]/g)].reduce((n, m) => n + Number(m[1]), 0);
    return { label: g.label, text: stripLabel(t).replace(/\s*\[\d+\]/g, '').trim(), marks };
  });
  const known = list.filter(p => p.marks);
  const missing = list.filter(p => !p.marks);
  const sum = known.reduce((n, p) => n + p.marks, 0);
  if (missing.length === 1 && sum < total) missing[0].marks = total - sum;
  else if (missing.length || sum !== total) {
    if (/total/i.test(qLines.join(' '))) return null;
    return null;
  }
  // Model answers by part label; otherwise everything is shared
  const byLabel = {};
  let cur = null;
  ansLines.forEach(a => {
    const l = labelOf(a);
    if (l) cur = l;
    (byLabel[cur || '_'] ||= []).push(a);
  });
  list.forEach(p => {
    const mine = byLabel[p.label];
    p.model = (mine || ansLines).map(stripLabel).join('\n');
    p.points = ms.filter(m => labelOf(m) === p.label).map(stripLabel);
    if (!p.points.length) p.points = ms.filter(m => !labelOf(m));
    p.command = commandOf(p.text, p.marks);
  });
  return { context, list };
}

function parseMarkscheme(html) {
  const chapters = html.split('<section class="chapter"').slice(1);
  const out = [];
  chapters.forEach(c => {
    const kicker = text((c.match(/ch-kicker">([^<]*)/) || [])[1] || '');
    const chapter = Number((kicker.match(/\d+/) || [])[0]);
    const title = text((c.match(/ch-title">([\s\S]*?)<\/h2/) || [])[1] || '');
    [...c.matchAll(/<article class="q">([\s\S]*?)<\/article>/g)].forEach(m => {
      const a = m[1];
      const qNo = text((a.match(/q-no">([^<]*)/) || [])[1] || '');
      const marks = Number(((a.match(/q-marks">\s*(\d+)/) || [])[1]) || 0);
      const qLines = all(/<p class="q-line">([\s\S]*?)<\/p>/g, a);
      const ansLines = all(/<p class="hw-line">([\s\S]*?)<\/p>/g, a);
      const ms = all(/<li>([\s\S]*?)<\/li>/g, (a.match(/<ul class="ms-list">([\s\S]*?)<\/ul>/) || [, ''])[1]);
      const tip = text((a.match(/<aside class="tip">([\s\S]*?)<\/aside>/) || [, ''])[1]).replace(/^Examiner tip\s*/i, '');
      const q = parseOne({ qNo, marks, qLines, ansLines, ms, tip }, chapter);
      q.srcId = `c${String(chapter).padStart(2, '0')}-${qNo.toLowerCase()}`;
      q.chapterTitle = title;
      q.command = q.type === 'written' ? commandOf(q.lead, marks) : q.type === 'fill' ? (q.wordbank || q.items.some(i => /…|\.{3}/.test(i.text)) ? 'complete' : 'identify') : q.type === 'multi' ? 'multi' : q.type;
      q.difficulty = difficultyOf(q);
      q.needsContext = needsContext(q, qLines);
      out.push(q);
    });
  });
  markDuplicates(out);
  return { questions: out };
}

const CONTEXT_RE = /true statements|screenshot|\bshown\b|each image|\bthe image\b|\bpicture\b|diagram|complete the table|\bin the system\b|design a|^draw|missing stages|smart security gate|correct places/i;
function needsContext(q, qLines) {
  return CONTEXT_RE.test(qLines.join(' ')) || (q.type === 'multi' && CONTEXT_RE.test(q.parts.map(p => p.text).join(' ')));
}

function markDuplicates(list) {
  const seen = new Map();
  list.forEach(q => {
    const key = tokens([q.lead, ...(q.items || []).map(i => i.text), ...(q.parts || []).map(p => p.text)].join(' ')).sort().join(' ');
    q.dupOf = null;
    if (key.length > 20 && seen.has(key)) q.dupOf = seen.get(key);
    else seen.set(key, q.srcId);
  });
}

module.exports = { parseMarkscheme, alternatives };
