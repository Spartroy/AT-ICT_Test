// Seeds the question bank from data/theoryBank.json the first time it is needed, and answers bank queries.
const TheoryQuestion = require('../../models/TheoryQuestion');
const seed = require('../../data/theoryBank.json');
const { categoryOf } = require('./categories');

let seeding = null;

/** Inserts the Classified questions once. Existing (possibly edited) ones are never overwritten. */
function ensureBank() {
  if (!seeding) {
    seeding = (async () => {
      const have = await TheoryQuestion.countDocuments({ source: 'classified' });
      if (have >= seed.questions.length) return;
      const known = new Set((await TheoryQuestion.find({ source: 'classified' }).select('srcId').lean()).map(q => q.srcId));
      const docs = seed.questions.filter(q => !known.has(q.srcId)).map(q => ({ ...q, source: 'classified', category: categoryOf(q) }));
      if (docs.length) await TheoryQuestion.insertMany(docs, { ordered: false });
    })().catch(err => { seeding = null; throw err; });
  }
  return seeding;
}

/** Chapters (with topics) as the generator shows them. */
const chapters = () => seed.chapters.map(c => ({ key: c.key, n: c.n, title: c.title, phase: c.phase, topics: c.topics }));

module.exports = { ensureBank, chapters };
