// The short version of a quiz result that goes to a parent: the mark, a plain verdict, what went well and the weak points.
// No question text and no mark scheme, and cheating flags only appear as a neutral line about the quiz rules.
const { perTopic } = require('./quizService');

const verdict = (p) => (p >= 80 ? 'Excellent work' : p >= 65 ? 'A good result' : p >= 50 ? 'A pass, with room to improve' : 'This topic area needs support');

/**
 * quiz: { title, items }, attempt: { grades, score, maxScore, penalty, sentOff, submittedAt, integrity? }
 * Returns a plain object that is stored on the attempt, so what the parent sees never changes later.
 */
function buildParentReport(quiz, attempt, studentName = '') {
  const max = attempt.maxScore || 0;
  const percent = max ? Math.round((attempt.score / max) * 100) : 0;
  const topics = perTopic(quiz.items, attempt.grades || [])
    .filter(t => t.max > 0)
    .map(t => ({ topic: t.topic, chapterKey: t.chapterKey, got: t.got, max: t.max, percent: Math.round((t.got / t.max) * 100) }));
  const weak = topics.filter(t => t.percent < 60 && t.max >= 2).sort((a, b) => a.percent - b.percent).slice(0, 3)
    .map(t => ({ ...t, advice: `Go over “${t.topic}” again in the study guide and try a few practice questions.` }));
  const strong = topics.filter(t => t.percent >= 75 && t.max >= 2).sort((a, b) => b.percent - a.percent).slice(0, 2);
  let conduct = null;
  if (attempt.sentOff) conduct = 'The quiz ended early after repeated rule breaks (a red card). The mark counts what was answered so far.';
  else if (attempt.penalty) conduct = `Rule breaks during the quiz led to ${attempt.penalty} marks being taken off.`;
  return {
    student: studentName,
    title: quiz.title,
    takenAt: attempt.submittedAt || null,
    score: attempt.score,
    max,
    percent,
    headline: verdict(percent),
    strong,
    weak,
    conduct,
    next: weak.length ? `Focus next on: ${weak.map(w => w.topic).join(', ')}.` : 'Keep up the steady revision. No weak areas stood out.'
  };
}

/** One line for the notification the parent receives. */
const notificationLine = (r) => `${r.student ? `${r.student.split(' ')[0]}: ` : ''}${r.score}/${r.max} (${r.percent}%). ${r.weak.length ? `Needs work: ${r.weak.map(w => w.topic).join(', ')}.` : 'No weak areas.'}`.slice(0, 480);

module.exports = { buildParentReport, notificationLine, verdict };
