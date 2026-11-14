// Seeds the question bank from data/theoryBank.json the first time it is needed, and answers bank queries.
const TheoryQuestion = require('../../models/TheoryQuestion');
const seed = require('../../data/theoryBank.json');
const { categoryOf } = require('./categories');

let seeding = null;

/** Inserts the Classified questions once. Existing (possibly edited) ones are never overwritten. */
function ensureBank() {
  if (!seeding) {
    seeding = (async () => {
      // Structured questions were regrouped (parts, sub-parts and marks): refresh the ones nobody has edited
      const REV = 2;
      const regrouped = seed.questions.filter(q => q.type === 'multi');
      await Promise.all(regrouped.map(q => TheoryQuestion.updateOne(
        { source: 'classified', srcId: q.srcId, edited: { $ne: true }, rev: { $not: { $gte: REV } } },
        { $set: { type: q.type, category: categoryOf(q), lead: q.lead, context: q.context, parts: q.parts, marks: q.marks, model: q.model, points: q.points, command: q.command, difficulty: q.difficulty, needsContext: q.needsContext, rev: REV } }
      )));
      await TheoryQuestion.updateMany({ source: 'classified', rev: { $not: { $gte: REV } } }, { $set: { rev: REV } });
      const have = await TheoryQuestion.countDocuments({ source: 'classified' });
      if (have >= seed.questions.length) return;
      const known = new Set((await TheoryQuestion.find({ source: 'classified' }).select('srcId').lean()).map(q => q.srcId));
      const docs = seed.questions.filter(q => !known.has(q.srcId)).map(q => ({ ...q, source: 'classified', category: categoryOf(q), rev: 2 }));
      if (docs.length) await TheoryQuestion.insertMany(docs, { ordered: false });
    })().catch(err => { seeding = null; throw err; });
  }
  return seeding;
}

/** Chapters (with topics) as the generator shows them. */
const chapters = () => seed.chapters.map(c => ({ key: c.key, n: c.n, title: c.title, phase: c.phase, topics: c.topics }));

module.exports = { ensureBank, chapters };
