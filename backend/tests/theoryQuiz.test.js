const bankFile = require('../data/theoryBank.json');
const { gradeItem, gradeAttempt, totals, itemScore, fillMatches, keywordGrade } = require('../services/theoryQuiz/grader');
const { generate, availability, forStudent, toItem } = require('../services/theoryQuiz/generator');
const { categoryOf, isWordBankEligible } = require('../services/theoryQuiz/categories');
const { commandOf, difficultyOf } = require('../services/theoryQuiz/classify');
const cheat = require('../services/theoryQuiz/cheat');
const { sanitizeQuestion } = require('../validators/theoryQuestion');
const { chapters } = require('../services/theoryQuiz/bank');

const byId = (id) => bankFile.questions.find(q => q.srcId === id);
const pool = bankFile.questions.map((q, i) => ({ ...q, _id: `q${i}`, category: categoryOf(q) }));

describe('the seeded bank', () => {
  test('holds every Classified question with its marks', () => {
    expect(bankFile.questions).toHaveLength(353);
    expect(bankFile.questions.reduce((n, q) => n + q.marks, 0)).toBe(1606);
  });

  test('every question has a chapter, topic, difficulty and a way to be marked', () => {
    bankFile.questions.forEach(q => {
      expect(q.chapterKey).toBeTruthy();
      expect(q.topic).toBeTruthy();
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      if (q.type === 'multi') expect(q.parts.reduce((n, p) => n + p.marks, 0)).toBe(q.marks);
      if (q.type === 'tf') expect(q.items.every(i => typeof i.answer === 'boolean')).toBe(true);
      if (q.type === 'tick') expect(q.items.every(i => q.columns.includes(i.answer))).toBe(true);
      if (q.type === 'pick') expect(q.answers).toHaveLength(q.n);
    });
  });

  test('network questions are split between part 1 and part 2', () => {
    const keys = new Set(bankFile.questions.filter(q => q.chapter === 6).map(q => q.chapterKey));
    expect(keys).toEqual(new Set(['6a', '6b']));
  });

  test('flags duplicates and picture-dependent questions', () => {
    expect(byId('c01-q17').dupOf).toBe('c01-q14');
    expect(byId('c01-q5').needsContext).toBe(true);
  });
});

describe('classification', () => {
  test('command words', () => {
    expect(commandOf('Compare and contrast a hub and a switch.', 4)).toBe('compare');
    expect(commandOf('Discuss the advantages and disadvantages of cloud storage.', 6)).toBe('discuss');
    expect(commandOf('Give three advantages of an SSD', 3)).toBe('advdis');
    expect(commandOf('Explain what is meant by RAM.', 3)).toBe('explain');
    expect(commandOf('Describe the purpose of ROM.', 2)).toBe('describe');
    expect(commandOf('What does ALU stand for?', 1)).toBe('define');
    expect(commandOf('State two characteristics of input devices.', 2)).toBe('state');
  });

  test('difficulty follows marks and command', () => {
    expect(difficultyOf({ marks: 1, command: 'define', type: 'written' })).toBe('easy');
    expect(difficultyOf({ marks: 4, command: 'describe', type: 'written' })).toBe('medium');
    expect(difficultyOf({ marks: 6, command: 'discuss', type: 'written' })).toBe('hard');
  });
});

describe('marking objective questions', () => {
  const tf = toItem({ ...byId('c01-q10'), _id: 'a' });
  test('true/false gives a fraction of the marks per row', () => {
    const g = gradeItem(tf, [true, true, true, false]);
    expect(itemScore(g)).toBe(2);
    expect(g.final).toBe(true);
    expect(itemScore(gradeItem(tf, [true, true, false, false]))).toBe(1.5);
    expect(itemScore(gradeItem(tf, []))).toBe(0);
  });

  test('tick tables compare the chosen column', () => {
    const item = toItem({ ...byId('c01-q20'), _id: 'b' });
    const g = gradeItem(item, item.items.map(i => i.answer));
    expect(itemScore(g)).toBe(item.marks);
  });

  test('fill-in accepts wording variants, articles and a one-letter slip', () => {
    expect(fillMatches('the hardware', ['hardware'])).toBe(true);
    expect(fillMatches('Hardwere', ['hardware'])).toBe(true);
    expect(fillMatches('software', ['hardware'])).toBe(false);
    expect(fillMatches('', ['hardware'])).toBe(false);
    expect(fillMatches('thermal bubble', ['thermal bubble (bubble-jet)', 'thermal bubble', 'bubble-jet'])).toBe(true);
  });

  test('pick-N penalises wrong choices', () => {
    const item = toItem({ ...byId('c02-q3'), _id: 'c' });
    expect(itemScore(gradeItem(item, item.answers))).toBe(item.marks);
    expect(itemScore(gradeItem(item, [...item.answers.slice(0, 2), 'Speaker']))).toBeLessThan(item.marks);
  });

  test('scales when the teacher changes the marks', () => {
    const item = { ...tf, marks: 4 };
    expect(itemScore(gradeItem(item, [true, true, true, false]))).toBe(4);
  });
});

describe('marking written answers', () => {
  const item = toItem({ ...byId('c01-q1'), _id: 'w' });
  test('suggests marks from the mark-scheme points and stays provisional', () => {
    const g = gradeItem(item, 'A computer takes in input, processes the data and produces an output.');
    expect(g.final).toBe(false);
    expect(g.parts[0].awarded).toBe(2);
    expect(gradeItem(item, 'it is a machine').parts[0].awarded).toBeLessThan(2);
    expect(gradeItem(item, '').parts[0].awarded).toBe(0);
  });

  test('a structured question is marked part by part and never exceeds its marks', () => {
    const m = toItem({ ...byId('c06-q11'), _id: 'm' });
    const g = gradeItem(m, [m.parts[0].model, m.parts[1].model]);
    expect(g.parts).toHaveLength(2);
    expect(itemScore(g)).toBeLessThanOrEqual(m.marks);
  });

  test('keyword marking caps per side for advantages & disadvantages', () => {
    const model = 'Advantages: easy to use; no commands to learn; icons are intuitive.\nDisadvantages: uses more memory; needs powerful hardware; slower to load.';
    const k = keywordGrade('Easy to use and no commands to learn and icons are intuitive and simple', model, 2);
    expect(k.awarded).toBeLessThanOrEqual(1);
  });

  test('totals separate final from pending marks', () => {
    const grades = gradeAttempt([tf(), item], { [tf().uid]: [true] });
    const t = totals(grades);
    expect(t.pending).toBe(true);
    expect(t.max).toBe(tf().marks + item.marks);
  });
  function tf() { return { ...toItem({ ...byId('c01-q10'), _id: 'a' }), uid: 'fixed' }; }
});

describe('the generator', () => {
  test('gives the requested number per type, no duplicates, nothing hidden', () => {
    const { items, shortages } = generate({ pool, counts: { tf: 2, tick: 2, complete: 2, discuss: 3, describe: 2, multi: 1 } });
    expect(shortages).toEqual([]);
    expect(items).toHaveLength(12);
    expect(new Set(items.map(i => i.srcId)).size).toBe(12);
    expect(items.every(i => !byId(i.srcId).dupOf && !byId(i.srcId).needsContext)).toBe(true);
  });

  test('exam order: objective first, long written last', () => {
    const { items } = generate({ pool, counts: { discuss: 1, tf: 1, state: 1 } });
    expect(items.map(i => i.category)).toEqual(['tf', 'state', 'discuss']);
  });

  test('reports a shortage instead of failing', () => {
    const { items, shortages } = generate({ pool, counts: { match: 5 } });
    expect(items).toHaveLength(1);
    expect(shortages).toEqual([{ category: 'match', wanted: 5, got: 1 }]);
  });

  test('word bank turns short complete questions into a bank with extra words', () => {
    const { items } = generate({ pool, counts: { wordbank: 2 } });
    expect(items).toHaveLength(2);
    items.forEach(i => {
      expect(i.presentation).toBe('wordbank');
      expect(i.wordbank.length).toBeGreaterThan(i.items.length);
      i.items.forEach(r => expect(i.wordbank).toContain(r.answers[0]));
    });
    expect(pool.filter(isWordBankEligible).length).toBeGreaterThan(5);
  });

  test('respects the chapter and topic scope', () => {
    const scoped = pool.filter(q => q.chapterKey === '3');
    const { items } = generate({ pool: scoped, counts: { tf: 1, tick: 2 } });
    expect(items.every(i => i.chapterKey === '3')).toBe(true);
    expect(availability(scoped).tick.total).toBeGreaterThan(0);
  });

  test('a harder mix prefers harder questions', () => {
    const avg = (d) => { let n = 0; let t = 0; for (let k = 0; k < 20; k++) { generate({ pool, counts: { state: 6 }, difficulty: d }).items.forEach(i => { n++; t += { easy: 1, medium: 2, hard: 3 }[i.difficulty]; }); } return t / n; };
    expect(avg('harder')).toBeGreaterThanOrEqual(avg('easier'));
  });
});

describe('what students see', () => {
  test('never includes answers, points or tips, and shuffles options per student', () => {
    const tfq = toItem({ ...byId('c01-q10'), _id: 'a' });
    const pick = toItem({ ...byId('c02-q3'), _id: 'p' });
    const view = JSON.stringify([forStudent(tfq, 's1'), forStudent(pick, 's1')]);
    expect(view).not.toMatch(/"answer"|"answers"|"model"|"points"|"tip"/);
    const a = forStudent(pick, 'seed-a').options;
    const b = forStudent(pick, 'seed-b').options;
    expect([...a].sort()).toEqual([...b].sort());
    expect(forStudent(pick, 'seed-a').options).toEqual(a); // stable for one student
  });
});

describe('integrity signals', () => {
  test('counts tab leaves and long pastes', () => {
    const events = [{ t: 1000, type: 'hidden' }, { t: 9000, type: 'visible' }, { t: 12000, type: 'hidden' }, { t: 40000, type: 'visible' }, { t: 50000, type: 'hidden' }, { t: 52000, type: 'visible' }, { t: 60000, type: 'paste', len: 120 }];
    const s = cheat.summarise(events, { durationMs: 600000, spentMs: 120000 });
    expect(s.tabLeaves).toBe(3);
    expect(s.awayMs).toBe(38000);
    expect(s.flags.map(f => f.id)).toEqual(expect.arrayContaining(['tabs', 'away', 'paste']));
    expect(['medium', 'high']).toContain(s.risk);
  });

  test('a clean attempt has no flags and bad events are dropped', () => {
    expect(cheat.summarise([], {}).risk).toBe('none');
    expect(cheat.cleanEvents([{ type: 'nope', t: 1 }, { type: 'blur', t: 'x' }, { type: 'blur', t: 5 }])).toEqual([{ t: 5, type: 'blur', len: undefined, q: undefined }]);
  });

  test('similar written answers between two students are flagged', () => {
    const text = 'A router connects different networks together and forwards data packets to the correct destination using IP addresses';
    const r = cheat.similarity({ answers: { x: text } }, { answers: { x: `${text} .` } });
    expect(r.score).toBeGreaterThan(0);
    expect(cheat.similarity({ answers: { x: text } }, { answers: { x: 'completely different words about monitors and printers and ink' } }).score).toBe(0);
  });
});

describe('teacher-written questions', () => {
  const ch = chapters();
  test('accepts a valid true/false and rejects a broken one', () => {
    const ok = sanitizeQuestion({ type: 'tf', chapterKey: '1', lead: 'Tick true or false:', marks: 2, items: [{ text: 'RAM is volatile', answer: true }] }, ch);
    expect(ok.doc.category).toBe('tf');
    expect(sanitizeQuestion({ type: 'tf', chapterKey: '1', lead: 'x', marks: 2, items: [] }, ch).error).toMatch(/statement/);
    expect(sanitizeQuestion({ type: 'written', chapterKey: '99', marks: 2 }, ch).error).toMatch(/chapter/);
  });

  test('a structured question takes its marks from its parts', () => {
    const r = sanitizeQuestion({ type: 'multi', chapterKey: '7', marks: 99, parts: [{ text: 'Explain hacking', marks: 3, model: 'x' }, { text: 'Describe two protections', marks: 2, model: 'y' }] }, ch);
    expect(r.doc.marks).toBe(5);
  });
});
