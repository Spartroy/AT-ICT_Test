// Cheating signals. These are *flags for the teacher to look at*, never a verdict: browsers cannot prove cheating.
//
// The student page records events ({ t: ms since start, type, ... }). `summarise` turns them into counts and flags;
// `similarity` compares two attempts of the same quiz.
const { tokens, norm } = require('./classify');

const EVENT_TYPES = new Set(['hidden', 'visible', 'blur', 'focus', 'fs_exit', 'fs_enter', 'paste', 'copy', 'cut', 'contextmenu', 'print', 'offline', 'online', 'resume', 'devtools', 'violation', 'card']);

/** Keeps only well-formed events and caps the list so a hostile client cannot bloat the document. */
function cleanEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.slice(0, 500)
    .filter(e => e && EVENT_TYPES.has(e.type) && Number.isFinite(Number(e.t)))
    .map(e => ({ t: Math.max(0, Math.round(Number(e.t))), type: e.type, len: Number.isFinite(Number(e.len)) ? Math.round(Number(e.len)) : undefined, q: typeof e.q === 'string' ? e.q.slice(0, 40) : undefined, n: Number.isFinite(Number(e.n)) ? Math.max(0, Math.min(99, Math.round(Number(e.n)))) : undefined }));
}

/**
 * The in-quiz discipline ladder, rebuilt from the events the page recorded:
 * 1st illegal action = reminder, 2nd = yellow card + 30s pause, 3rd = second yellow + 2 marks off, 4th = red card (sent off).
 */
const PENALTY_MARKS = 2;
function discipline(events) {
  const ev = cleanEvents(events);
  const cards = ev.filter(e => e.type === 'card').map(e => e.q);
  const red = cards.includes('red');
  return {
    violations: ev.filter(e => e.type === 'violation').length,
    yellows: cards.filter(c => c === 'yellow1' || c === 'yellow2').length,
    sentOff: red,
    penalty: red || cards.includes('yellow2') ? PENALTY_MARKS : 0
  };
}

function summarise(events, { durationMs = 0, spentMs = 0, suggestedMs = 0, scoreRatio = null } = {}) {
  const ev = cleanEvents(events);
  const count = (type) => ev.filter(e => e.type === type).length;
  // Time away: hidden→visible, blur→focus (whichever pair closes first)
  let awayMs = 0;
  let openAt = null;
  ev.forEach(e => {
    if (e.type === 'hidden' || e.type === 'blur') { if (openAt === null) openAt = e.t; }
    if ((e.type === 'visible' || e.type === 'focus') && openAt !== null) { awayMs += e.t - openAt; openAt = null; }
  });
  if (openAt !== null && durationMs) awayMs += Math.max(0, spentMs - openAt);
  const leaves = ev.filter(e => e.type === 'hidden').length || Math.ceil(count('blur') / 1);
  const pastes = ev.filter(e => e.type === 'paste');
  const bigPastes = pastes.filter(e => (e.len || 0) >= 40).length;
  const flags = [];
  const flag = (id, severity, text) => flags.push({ id, severity, text });
  if (leaves >= 6) flag('tabs', 'high', `Left the quiz tab ${leaves} times`);
  else if (leaves >= 3) flag('tabs', 'medium', `Left the quiz tab ${leaves} times`);
  else if (leaves >= 1) flag('tabs', 'low', `Left the quiz tab ${leaves} time${leaves === 1 ? '' : 's'}`);
  if (awayMs >= 90000) flag('away', 'high', `Away from the quiz for ${Math.round(awayMs / 1000)}s in total`);
  else if (awayMs >= 30000) flag('away', 'medium', `Away from the quiz for ${Math.round(awayMs / 1000)}s in total`);
  if (bigPastes >= 3) flag('paste', 'high', `Pasted long text ${bigPastes} times`);
  else if (bigPastes >= 1) flag('paste', 'medium', `Pasted long text ${bigPastes} time${bigPastes === 1 ? '' : 's'}`);
  else if (pastes.length) flag('paste', 'low', `Pasted ${pastes.length} time${pastes.length === 1 ? '' : 's'}`);
  if (count('fs_exit') >= 2) flag('fullscreen', 'medium', `Left fullscreen ${count('fs_exit')} times`);
  if (count('print') || count('devtools')) flag('tools', 'medium', 'Tried to print or open developer tools');
  const d = discipline(ev);
  if (d.sentOff) flag('red', 'high', 'Sent off with a red card. The quiz ended with the answers given so far');
  else if (d.yellows) flag('yellow', 'medium', `${d.yellows} yellow card${d.yellows === 1 ? '' : 's'}${d.penalty ? `, ${d.penalty} marks deducted` : ''}`);
  if (count('offline') >= 2) flag('offline', 'low', `Connection dropped ${count('offline')} times`);
  if (suggestedMs && spentMs && spentMs < suggestedMs * 0.2 && scoreRatio !== null && scoreRatio >= 0.8) flag('fast', 'medium', 'Finished in under 20% of the expected time with a high score');
  const rank = { low: 1, medium: 2, high: 3 };
  const top = flags.reduce((m, f) => Math.max(m, rank[f.severity]), 0);
  const points = flags.reduce((n, f) => n + rank[f.severity], 0);
  const risk = top === 3 || points >= 6 ? 'high' : top === 2 || points >= 3 ? 'medium' : 'low';
  return { tabLeaves: leaves, awayMs, fullscreenExits: count('fs_exit'), pastes: pastes.length, bigPastes, copies: count('copy') + count('cut'), rightClicks: count('contextmenu'), flags, risk: flags.length ? risk : 'none' };
}

const jaccard = (a, b) => {
  const A = new Set(a);
  const B = new Set(b);
  let both = 0;
  A.forEach(x => { if (B.has(x)) both++; });
  return both / Math.max(1, A.size + B.size - both);
};

/** Compares two attempts. answers: { uid: response }, wrong: Set of uids answered wrongly in objective items. */
function similarity(a, b) {
  const reasons = [];
  let score = 0;
  const written = [];
  Object.keys(a.answers || {}).forEach(uid => {
    const x = a.answers[uid];
    const y = (b.answers || {})[uid];
    const xs = Array.isArray(x) ? x.join(' ') : x;
    const ys = Array.isArray(y) ? y.join(' ') : y;
    if (typeof xs !== 'string' || typeof ys !== 'string' || xs.length < 30 || ys.length < 30) return;
    const j = jaccard(tokens(xs), tokens(ys));
    if (j >= 0.8) written.push(Math.round(j * 100));
  });
  if (written.length) { score += written.length * 2; reasons.push(`${written.length} written answer${written.length === 1 ? '' : 's'} are ${Math.min(...written)}%+ alike`); }
  // Same wrong answers on objective questions are much more telling than the same right ones
  let sharedWrong = 0;
  (a.wrongObjective || []).forEach(w => {
    const other = (b.wrongObjective || []).find(o => o.uid === w.uid);
    if (other && w.given && norm(other.given) === norm(w.given)) sharedWrong++;
  });
  if (sharedWrong >= 3) { score += sharedWrong; reasons.push(`${sharedWrong} identical wrong answers`); }
  return { score, reasons };
}

module.exports = { discipline, PENALTY_MARKS, cleanEvents, summarise, similarity, EVENT_TYPES };
