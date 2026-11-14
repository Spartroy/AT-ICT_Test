// Tags every question with a study-guide section ("topic") by word overlap, and builds the chapter list.
// Network questions land in Part 1 (6a) or Part 2 (6b) depending on which part's sections fit best.
const { tokens } = require('./classify');

const PHASES = { 1: [1, 2, 3, 4], 2: [5, 6, 7], 3: [8, 9, 10, 11, 12, 13] };
const phaseOf = (n) => Number(Object.keys(PHASES).find(p => PHASES[p].includes(n)));

const flat = (v) => (typeof v === 'string' ? v.replace(/<[^>]+>/g, ' ') : Array.isArray(v) ? v.map(flat).join(' ') : v && typeof v === 'object' ? Object.values(v).map(flat).join(' ') : '');

function questionText(q) {
  return [q.lead, q.context, ...(q.items || []).map(i => `${i.text} ${(i.answers || [i.answer]).join(' ')}`), ...(q.parts || []).map(p => `${p.text} ${p.model}`), q.model, ...(q.points || [])].join(' ');
}

function tagTopics(questions, guide) {
  const guideChapters = guide.chapters.filter(c => c.key !== '5');
  // Sections per classified chapter number
  const sectionsFor = (n) => guideChapters
    .filter(c => Number(String(c.key).replace(/\D/g, '')) === n)
    .flatMap(c => c.secs.map(s => ({ chapterKey: c.key, title: s.title, titleTokens: new Set(tokens(s.title)), words: tokens(`${s.title} ${s.title} ${s.title} ${flat(s.blocks)}`) })));

  const byChapter = {};
  questions.forEach(q => { (byChapter[q.chapter] ||= []).push(q); });

  Object.entries(byChapter).forEach(([n, list]) => {
    const secs = sectionsFor(Number(n));
    if (!secs.length) return;
    const df = {};
    secs.forEach(s => new Set(s.words).forEach(w => { df[w] = (df[w] || 0) + 1; }));
    const idf = (w) => Math.log(1 + secs.length / (df[w] || 1));
    secs.forEach(s => { s.set = new Set(s.words); });
    list.forEach(q => {
      const qt = [...new Set(tokens(questionText(q)))];
      let best = secs[0];
      let bestScore = -1;
      secs.forEach(s => {
        const sc = qt.reduce((acc, w) => acc + (s.set.has(w) ? idf(w) * (s.titleTokens.has(w) ? 4 : 1) : 0), 0);
        if (sc > bestScore) { bestScore = sc; best = s; }
      });
      q.chapterKey = best.chapterKey;
      q.topic = best.title;
    });
  });

  const chapters = guideChapters
        .map(c => ({
      key: c.key,
      n: Number(String(c.key).replace(/\D/g, '')),
      title: `${c.title} ${c.hl || ''}`.trim().replace(/\.$/, ''),
      phase: phaseOf(Number(String(c.key).replace(/\D/g, ''))),
      topics: c.secs.map(s => s.title),
      questions: questions.filter(q => q.chapterKey === c.key).length
    }));
  return { chapters };
}

module.exports = { tagTopics, PHASES, phaseOf };
