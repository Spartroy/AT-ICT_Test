// Builds backend/data/theoryBank.json (the quiz generator's question bank) from the solved Classified mark scheme.
//
//   node backend/scripts/buildTheoryBank.js "<path to Classified Markscheme SOLVED.html>"
//
// Every question is turned into a gradable shape (true/false table, tick table, fill-in, pick-N, match, written, or a
// multi-part question), tagged with its command word, a difficulty and a study-guide topic. The result is committed so
// the app never needs the HTML at run time; the teacher can then edit the bank from the portal.
const fs = require('fs');
const path = require('path');
const { parseMarkscheme } = require('../services/theoryQuiz/parseMarkscheme');
const { tagTopics } = require('../services/theoryQuiz/topics');

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('Usage: node backend/scripts/buildTheoryBank.js "<Classified Markscheme SOLVED.html>"');
  process.exit(1);
}

const guide = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/studyGuideDefault.json'), 'utf8'));
const html = fs.readFileSync(src, 'utf8');
const { questions } = parseMarkscheme(html);
const { chapters } = tagTopics(questions, guide);

const out = { version: 1, builtAt: new Date().toISOString(), chapters, questions };
fs.writeFileSync(path.join(__dirname, '../data/theoryBank.json'), JSON.stringify(out, null, 1));

const by = (f) => questions.reduce((m, q) => { const k = f(q); m[k] = (m[k] || 0) + 1; return m; }, {});
console.log(`${questions.length} questions, ${questions.reduce((n, q) => n + q.marks, 0)} marks`);
console.log('by type      ', by(q => q.type));
console.log('by command   ', by(q => q.command));
console.log('by difficulty', by(q => q.difficulty));
console.log('hidden       ', { needsContext: questions.filter(q => q.needsContext).length, duplicates: questions.filter(q => q.dupOf).length });
