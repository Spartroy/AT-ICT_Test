// Small shared text helpers plus the two categorisations used by the quiz generator:
// the command word of a written question and its difficulty.

const STOP = new Set(('the a an and or of to in on for with is are be by as at it its that this these those from into than then so '
  + 'can may will would should could has have had not no yes also such which what when where who how why one two three four five').split(' '));

/** Lower-case, no punctuation, single spaces. */
const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+#]+/g, ' ').trim();

const stem = (w) => (w.length > 5 ? w.replace(/(ing|ed|es|s)$/, '') : w.replace(/s$/, ''));

/** Meaningful lower-case words, lightly stemmed. */
const tokens = (s) => norm(s).split(' ').filter(w => w.length > 1 && !STOP.has(w)).map(stem);

/**
 * The command word of a question, mapped to the teacher's categories:
 * compare, explain, describe, advdis (advantages & disadvantages), state (state / identify / give / list),
 * discuss (discuss / evaluate / analyse), define (what is / stands for), design.
 */
function commandOf(text, marks = 0) {
  const t = norm(text).replace(/^(a|b|c|d|i|ii|iii)\s+/, '');
  if (/^(design|draw|sketch)\b/.test(t)) return 'design';
  if (/\b(compare|contrast)\b|similarities|differences between|\bhow does .* differ/.test(t)) return 'compare';
  if (/^(discuss|evaluate|analyse|analyze|assess)\b|^(describe|explain)\b.*\b(benefits? and drawbacks?|advantages and disadvantages)/.test(t)) return 'discuss';
  if (/advantages|disadvantages|benefits|drawbacks|pros|cons/.test(t) && !/^(explain|describe) what/.test(t)) return /^(what are|give|state|list|identify)\b/.test(t) && marks <= 4 ? 'advdis' : 'advdis';
  if (/^(what is|what are the meaning|what does .* stand|define|state what is meant|what is meant)\b/.test(t)) return 'define';
  if (/^(explain|why|using examples explain|using examples, explain)\b/.test(t)) return /\bwhat is meant\b/.test(t) && marks <= 2 ? 'define' : 'explain';
  if (/^(describe|how|using examples, describe)\b/.test(t)) return /\bwhat is meant\b/.test(t) && marks <= 2 ? 'define' : 'describe';
  if (/^(state|give|list|identify|name|write|select|mention|which|what)\b/.test(t)) return 'state';
  return marks >= 3 ? 'describe' : 'state';
}

/** easy / medium / hard from the marks and the command word. */
function difficultyOf(q) {
  const m = q.marks || 0;
  const cmd = q.command;
  if (cmd === 'discuss' || cmd === 'design') return 'hard';
  if (m >= 5) return 'hard';
  if (m <= 2) return ['explain', 'describe', 'compare', 'advdis'].includes(cmd) && m === 2 && q.type !== 'tf' ? 'medium' : 'easy';
  if (cmd === 'compare') return 'hard';
  return 'medium';
}

module.exports = { norm, tokens, commandOf, difficultyOf };
