// The student journey and the teacher review, with the database replaced by in-memory fakes.
const mockStore = { attempts: [], quizzes: [] };
const QID = '64b7f0f0f0f0f0f0f0f0f0f0';

jest.mock('../models/TheoryQuiz', () => ({ findById: jest.fn(async (id) => mockStore.quizzes.find(q => String(q._id) === String(id)) || null), find: jest.fn() }));
jest.mock('../models/TheoryAttempt', () => {
  class Fake {
    constructor(doc) { Object.assign(this, { events: [], answers: {}, grades: [], status: 'in_progress' }, doc); this._id = require('crypto').randomBytes(12).toString('hex'); }
    async save() { if (!mockStore.attempts.includes(this)) mockStore.attempts.push(this); return this; }
    markModified() {}
  }
  const match = (a, f) => Object.entries(f).every(([k, v]) => (typeof v === 'object' && v !== null ? true : String(a[k]) === String(v)));
  return {
    create: jest.fn(async (doc) => { const a = new Fake(doc); await a.save(); return a; }),
    findOne: jest.fn(async (f) => mockStore.attempts.find(a => match(a, f)) || null),
    find: jest.fn(async () => mockStore.attempts),
    countDocuments: jest.fn(async () => mockStore.attempts.length)
  };
});
jest.mock('../models/User', () => ({ find: jest.fn(() => ({ select: () => ({ sort: async () => [] }) })) }));
jest.mock('../services/notifications', () => ({ notify: jest.fn() }));

const bank = require('../data/theoryBank.json');
const { toItem } = require('../services/theoryQuiz/generator');
const student = require('../controllers/theoryQuizStudentController');
const teacher = require('../controllers/theoryQuizTeacherController');

const q = (id) => ({ ...bank.questions.find(x => x.srcId === id), _id: id });
const res = () => { const r = { code: 200 }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const user = { _id: 'stu1', id: 'stu1', role: 'student', studentInfo: { group: 'A' } };

let quiz;
beforeEach(() => {
  mockStore.attempts.length = 0;
  const items = [toItem(q('c01-q10')), toItem(q('c01-q20')), toItem(q('c01-q1'))];
  quiz = {
    _id: QID, title: 'Test', status: 'published', mode: 'online', items, totalMarks: items.reduce((n, i) => n + i.marks, 0),
    settings: { durationMin: 20, shuffleQuestions: false, warnOnLeave: true, blockPaste: true, fullscreen: false, pledge: false, passMark: 50 },
    audience: { all: true, groups: [], students: [] }
  };
  mockStore.quizzes.length = 0;
  mockStore.quizzes.push(quiz);
});

const start = async () => { const r = res(); await student.startQuiz({ params: { id: QID }, body: {}, user }, r); return r; };

describe('taking a quiz', () => {
  test('starting gives questions without answers and a server deadline', async () => {
    const r = await start();
    expect(r.code).toBe(201);
    expect(r.body.data.items).toHaveLength(3);
    expect(JSON.stringify(r.body.data.items)).not.toMatch(/"answer"|"answers"|"model"|"points"/);
    expect(new Date(r.body.data.endsAt) - new Date(r.body.data.startedAt)).toBe(20 * 60000);
  });

  test('starting again resumes instead of making a second attempt', async () => {
    await start();
    const again = await start();
    expect(again.code).toBe(200);
    expect(mockStore.attempts).toHaveLength(1);
  });

  test('the pledge is required when the quiz asks for it', async () => {
    quiz.settings.pledge = true;
    const r = res();
    await student.startQuiz({ params: { id: QID }, body: {}, user }, r);
    expect(r.code).toBe(400);
  });

  test('a quiz that is not open yet cannot be started', async () => {
    quiz.settings.opensAt = new Date(Date.now() + 3600000);
    const r = await start();
    expect(r.code).toBe(400);
    expect(mockStore.attempts).toHaveLength(0);
  });

  test('a student outside the audience gets nothing', async () => {
    quiz.audience = { all: false, groups: ['B'], students: [] };
    const r = await start();
    expect(r.code).toBe(404);
  });

  test('saving keeps only answers for real questions and cleans the events', async () => {
    const a = (await start()).body.data;
    const r = res();
    await student.saveProgress({ params: { id: a.attemptId }, user, body: { answers: { [quiz.items[0].uid]: [true, true, true, false], nope: 'x' }, events: [{ type: 'blur', t: 100 }, { type: 'evil', t: 1 }] } }, r);
    expect(r.body.status).toBe('success');
    const saved = mockStore.attempts[0];
    expect(Object.keys(saved.answers)).toEqual([quiz.items[0].uid]);
    expect(saved.events.map(e => e.type)).toEqual(['blur']);
  });

  test('submitting marks objective questions at once and holds the written one for review', async () => {
    const a = (await start()).body.data;
    const [tf, tick, written] = quiz.items;
    const r = res();
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: { [tf.uid]: [true, true, true, false], [tick.uid]: tick.items.map(i => i.answer), [written.uid]: 'It takes input, processes data and produces output.' }, events: [] } }, r);
    const d = r.body.data;
    expect(d.reviewed).toBe(false);
    expect(d.awaitingReview).toBe(true);
    expect(d.score).toBe(tf.marks + tick.marks); // only the objective marks are shown
    expect(d.items[2].pending).toBe(true);
    expect(d.items[2].awarded).toBeUndefined();
    expect(mockStore.attempts[0].status).toBe('submitted');
  });

  test('a second submit does not change the result', async () => {
    const a = (await start()).body.data;
    const body = { answers: {}, events: [] };
    await student.submitQuiz({ params: { id: a.attemptId }, user, body }, res());
    const first = mockStore.attempts[0].submittedAt;
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: { [quiz.items[0].uid]: [true] } } }, res());
    expect(mockStore.attempts[0].submittedAt).toBe(first);
    expect(mockStore.attempts[0].answers[quiz.items[0].uid]).toBeUndefined();
  });

  test('answers sent long after the deadline are ignored and the attempt is closed', async () => {
    const a = (await start()).body.data;
    const att = mockStore.attempts[0];
    att.endsAt = new Date(Date.now() - 120000);
    const r = res();
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: { [quiz.items[0].uid]: [true, true, true, false] } } }, r);
    expect(att.status).toBe('submitted');
    expect(att.answers[quiz.items[0].uid]).toBeUndefined();
  });

  test('an attempt with leaves and pastes gets an integrity summary', async () => {
    const a = (await start()).body.data;
    const events = [{ type: 'hidden', t: 1000 }, { type: 'visible', t: 50000 }, { type: 'paste', t: 60000, len: 200 }];
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: {}, events } }, res());
    const att = mockStore.attempts[0];
    expect(att.integrity.tabLeaves).toBe(1);
    expect(att.integrity.flags.map(f => f.id)).toEqual(expect.arrayContaining(['tabs', 'paste']));
  });
});

describe('the teacher confirms the written marks', () => {
  test('editing and confirming releases the full score to the student', async () => {
    const a = (await start()).body.data;
    const [tf, , written] = quiz.items;
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: { [tf.uid]: [true, true, true, false], [written.uid]: 'input processing output' } } }, res());
    const att = mockStore.attempts[0];
    const before = att.score;

    const r = res();
    await teacher.reviewAttempt({ params: { id: QID, aid: att._id }, user: { id: 't1' }, body: { marks: { '2:0': 2 }, comments: { '2:0': 'Good' }, confirm: true } }, r);
    expect(r.body.data.status).toBe('graded');
    expect(att.grades[2].parts[0].awarded).toBe(2);
    expect(att.grades[2].parts[0].source).toBe('teacher');
    expect(att.score).toBeGreaterThanOrEqual(before);

    const out = res();
    await student.getResult({ params: { id: att._id }, user }, out);
    expect(out.body.data.reviewed).toBe(true);
    expect(out.body.data.items[2].pending).toBe(false);
    expect(out.body.data.items[2].parts[0].feedback).toBe('Good');
    expect(out.body.data.percent).toBe(Math.round((att.score / att.maxScore) * 100));
  });

  test('a mark cannot go above what the question is worth', async () => {
    const a = (await start()).body.data;
    await student.submitQuiz({ params: { id: a.attemptId }, user, body: { answers: {} } }, res());
    const att = mockStore.attempts[0];
    await teacher.reviewAttempt({ params: { id: QID, aid: att._id }, user: { id: 't1' }, body: { marks: { '2:0': 99 } } }, res());
    expect(att.grades[2].parts[0].awarded).toBe(quiz.items[2].marks);
    expect(att.status).toBe('submitted');
  });
});

describe('paper quizzes', () => {
  test('students cannot start a paper quiz', async () => {
    quiz.mode = 'paper';
    const r = await start();
    expect(r.code).toBe(400);
    expect(mockStore.attempts).toHaveLength(0);
  });
});
