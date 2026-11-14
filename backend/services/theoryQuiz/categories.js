// The question types a teacher can ask for. A bank question belongs to exactly one category; word-bank is a second way
// to present short "complete / name" questions, so those can be asked for either way.

const CATEGORIES = [
  { id: 'tf', label: 'True / False table', group: 'objective', hint: 'Tick true or false for each statement' },
  { id: 'tick', label: 'Tick table', group: 'objective', hint: 'One tick per row across 2–4 columns' },
  { id: 'complete', label: 'Complete the sentence', group: 'objective', hint: 'Fill the gaps' },
  { id: 'wordbank', label: 'Word bank', group: 'objective', hint: 'Drag words into the gaps' },
  { id: 'identify', label: 'Name / identify from a description', group: 'objective', hint: 'Short answers' },
  { id: 'pick', label: 'Tick N from a list', group: 'objective', hint: 'Choose the right options' },
  { id: 'match', label: 'Match / connect', group: 'objective', hint: 'Drag terms to statements' },
  { id: 'define', label: 'Define / what is meant by', group: 'written', hint: '1–2 mark recall' },
  { id: 'state', label: 'State / give / list', group: 'written', hint: 'Short points' },
  { id: 'describe', label: 'Describe', group: 'written', hint: '3–4 marks' },
  { id: 'explain', label: 'Explain', group: 'written', hint: 'Reasons and effects' },
  { id: 'compare', label: 'Compare / contrast', group: 'written', hint: 'Similarities and differences' },
  { id: 'advdis', label: 'Advantages & disadvantages', group: 'written', hint: 'Both sides' },
  { id: 'discuss', label: 'Discuss / evaluate', group: 'written', hint: '6+ marks, balanced' },
  { id: 'multi', label: 'Structured (a)(b)(c)', group: 'written', hint: 'Several parts, mixed types' }
];
const IDS = CATEGORIES.map(c => c.id);

/** Short "complete / name" questions that read well as a word bank. */
const isWordBankEligible = (q) => q.type === 'fill'
  && !q.needsContext
  && (q.items || []).length >= 2
  && q.items.every(i => ((i.text || '').match(/…+|\.{3,}|_{3,}/g) || []).length <= 1)
  && q.items.every(i => (i.answers || []).length && i.answers[0].split(/\s+/).length <= 3 && !/[\/;]/.test(i.answers[0]));

/** The category a bank question counts under in the blueprint. (Word bank is chosen at generation time.) */
function categoryOf(q) {
  if (q.type === 'fill') return q.command === 'identify' ? 'identify' : 'complete';
  if (q.type === 'written') return q.command === 'design' ? 'describe' : q.command;
  return q.type; // tf, tick, pick, match, multi
}

module.exports = { CATEGORIES, IDS, categoryOf, isWordBankEligible };
