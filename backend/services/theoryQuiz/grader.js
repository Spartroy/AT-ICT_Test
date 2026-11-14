// Marks a student's answers against the Classified mark scheme.
//
// Objective questions (true/false, tick tables, fill-in, word bank, pick N, match) are marked exactly and are final.
// Written answers get a *suggested* mark from the mark-scheme points (keyword matching here, or an AI call on top,
// see aiGrader.js); the teacher confirms those before the student sees them.
const { norm, tokens } = require('./classify');

const roundHalf = (n) => Math.round(n * 2) / 2;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function editDistance1(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Does the student's token set contain every token of `want`, allowing a one-letter slip in longer words? */
function containsTokens(student, want) {
  return want.every(w => student.some(s => s === w || (w.length >= 5 && editDistance1(s, w))));
}

const stripArticles = (s) => norm(s).replace(/^(a|an|the)\s+/, '');

/** A short answer (fill-in, name it) against every accepted wording. */
function fillMatches(given, answers) {
  const g = stripArticles(given);
  if (!g) return false;
  const gt = tokens(given);
  return answers.some(a => {
    const na = stripArticles(a);
    if (!na) return false;
    if (na === g) return true;
    const at = tokens(a);
    return at.length > 0 && containsTokens(gt, at) && gt.length <= at.length + 2;
  });
}

const sameOption = (a, b) => norm(a) === norm(b);

/** Fraction-per-row marking shared by the row-based types. */
function rows(item, rowsDetail, maxMarks) {
  const right = rowsDetail.filter(r => r.correct).length;
  const awarded = rowsDetail.length ? roundHalf((right / rowsDetail.length) * maxMarks) : 0;
  return { max: maxMarks, awarded, final: true, kind: 'objective', rows: rowsDetail.map(r => ({ ...r, awarded: undefined })) };
}

// ---- written answers --------------------------------------------------------------------------------------------

/** The scoring points of a model answer: its ; and . separated statements, grouped by "Advantages:" style labels. */
function pointsOf(model) {
  const groups = [];
  String(model || '').split('\n').forEach(line => {
    const m = line.match(/^([A-Za-z][A-Za-z ]{2,24}):\s*(.*)$/);
    const label = m ? m[1] : null;
    const rest = m ? m[2] : line;
    const segs = rest.split(/;|(?<=[a-z0-9)])\.\s+(?=[A-Z])/).map(s => s.replace(/^[(\d]+[).]?\s*/, '').replace(/\.$/, '').trim()).filter(Boolean);
    if (label && /advantage|disadvantage|similarit|difference|benefit|drawback|positive|negative|health|safety/i.test(label)) groups.push({ label, segs });
    else if (groups.length && !label) groups[groups.length - 1].segs.push(...segs);
    else groups.push({ label: null, segs });
  });
  return groups;
}

/** Keyword suggestion for a written answer. Always flagged provisional. */
function keywordGrade(answer, model, max) {
  const given = tokens(answer);
  if (!given.length || !max) return { awarded: 0, max, matched: [], missed: [], source: 'keyword' };
  const groups = pointsOf(model);
  const all = groups.flatMap(g => g.segs.map(text => ({ text, kw: [...new Set(tokens(text))] })).filter(p => p.kw.length));
  const matched = [];
  const missed = [];
  const hit = (p) => {
    const found = p.kw.filter(w => containsTokens(given, [w])).length;
    const need = p.kw.length <= 2 ? p.kw.length : Math.ceil(p.kw.length * 0.5);
    return found >= need;
  };
  const perPoint = all.length >= max ? 1 : max / Math.max(1, all.length);
  const labelled = groups.filter(g => g.label).length >= 2;
  let total = 0;
  groups.forEach(g => {
    const pts = g.segs.map(text => ({ text, kw: [...new Set(tokens(text))] })).filter(p => p.kw.length);
    let sub = 0;
    pts.forEach(p => { if (hit(p)) { sub += perPoint; matched.push(p.text); } else missed.push(p.text); });
    total += labelled ? Math.min(sub, Math.ceil(max / groups.filter(x => x.label).length)) : sub;
  });
  return { awarded: clamp(roundHalf(total), 0, max), max, matched, missed, source: 'keyword' };
}

// ---- one quiz item ----------------------------------------------------------------------------------------------

/** Marks one item. `res` is the student's response for it (shape depends on the type). */
function gradeItem(item, res) {
  const max = item.marks;
  const scale = item.baseMarks ? max / item.baseMarks : 1;
  switch (item.type) {
    case 'tf': {
      const given = Array.isArray(res) ? res : [];
      return rows(item, item.items.map((r, i) => ({ label: r.text, expected: r.answer ? 'True' : 'False', given: given[i] === true ? 'True' : given[i] === false ? 'False' : '', correct: given[i] === r.answer })), max);
    }
    case 'tick': {
      const given = Array.isArray(res) ? res : [];
      return rows(item, item.items.map((r, i) => ({ label: r.text, expected: r.answer, given: given[i] || '', correct: !!given[i] && sameOption(given[i], r.answer) })), max);
    }
    case 'match': {
      const given = Array.isArray(res) ? res : [];
      return rows(item, item.items.map((r, i) => ({ label: r.text, expected: r.answer, given: given[i] || '', correct: !!given[i] && sameOption(given[i], r.answer) })), max);
    }
    case 'fill': {
      const given = Array.isArray(res) ? res : [];
      return rows(item, item.items.map((r, i) => ({ label: r.text, expected: r.answers[0], given: given[i] || '', correct: fillMatches(given[i] || '', r.answers) })), max);
    }
    case 'pick': {
      const chosen = Array.isArray(res) ? res : [];
      const right = chosen.filter(c => item.answers.some(a => sameOption(a, c))).length;
      const wrong = chosen.length - right;
      const awarded = roundHalf(clamp(right - wrong, 0, item.n) / item.n * max);
      return { max, awarded, final: true, kind: 'objective', rows: item.answers.map(a => ({ label: a, expected: a, given: chosen.some(c => sameOption(c, a)) ? a : '', correct: chosen.some(c => sameOption(c, a)) })), note: wrong ? `${wrong} wrong choice${wrong === 1 ? '' : 's'} cancel${wrong === 1 ? 's' : ''} a correct one` : undefined };
    }
    case 'multi': {
      const given = Array.isArray(res) ? res : [];
      const parts = item.parts.map((p, i) => {
        const pmax = roundHalf(p.marks * scale * 2) / 2 || p.marks * scale;
        const k = keywordGrade(given[i] || '', p.model, pmax);
        return { label: p.label, text: p.text, answer: given[i] || '', max: pmax, awarded: k.awarded, matched: k.matched, missed: k.missed, source: 'keyword', model: p.model };
      });
      return { max, awarded: roundHalf(parts.reduce((n, p) => n + p.awarded, 0)), final: false, kind: 'written', parts };
    }
    default: { // written
      const k = keywordGrade(typeof res === 'string' ? res : '', item.model, max);
      return { max, awarded: k.awarded, final: false, kind: 'written', parts: [{ label: '', text: item.lead, answer: typeof res === 'string' ? res : '', max, awarded: k.awarded, matched: k.matched, missed: k.missed, source: 'keyword', model: item.model }] };
    }
  }
}

/** Total of an item grade (written items count their parts' marks). */
const itemScore = (g) => (g.parts ? roundHalf(g.parts.reduce((n, p) => n + (Number(p.awarded) || 0), 0)) : g.awarded);

function gradeAttempt(items, answers) {
  return items.map(item => ({ uid: item.uid, ...gradeItem(item, (answers || {})[item.uid]) }));
}

/** Score + whether anything still waits for the teacher. */
function totals(grades) {
  const score = roundHalf(grades.reduce((n, g) => n + itemScore(g), 0));
  const max = grades.reduce((n, g) => n + g.max, 0);
  const pending = grades.some(g => !g.final);
  const objectiveScore = roundHalf(grades.filter(g => g.final).reduce((n, g) => n + itemScore(g), 0));
  const objectiveMax = grades.filter(g => g.final).reduce((n, g) => n + g.max, 0);
  return { score, max, pending, objectiveScore, objectiveMax };
}

module.exports = { gradeItem, gradeAttempt, itemScore, totals, keywordGrade, fillMatches, roundHalf, clamp, pointsOf };
