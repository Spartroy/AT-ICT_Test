// Checks and cleans a bank question sent by the teacher (create or edit). Returns { doc } or { error }.
const { categoryOf } = require('../services/theoryQuiz/categories');
const { commandOf, difficultyOf } = require('../services/theoryQuiz/classify');

const str = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
const list = (v, max = 40) => (Array.isArray(v) ? v.map(x => str(x, 400)).filter(Boolean).slice(0, max) : []);
const WRITTEN_COMMANDS = ['define', 'state', 'describe', 'explain', 'compare', 'advdis', 'discuss'];
const TYPES = ['tf', 'tick', 'fill', 'pick', 'match', 'written', 'multi'];

function sanitizeQuestion(body, chapters, existing = null) {
  const b = body || {};
  const type = existing?.type || str(b.type, 20);
  if (!TYPES.includes(type)) return { error: 'Choose a question type' };
  const chapter = chapters.find(c => c.key === str(b.chapterKey ?? existing?.chapterKey, 5));
  if (!chapter) return { error: 'Choose a chapter' };
  const doc = { type, chapterKey: chapter.key, chapter: chapter.n, chapterTitle: chapter.title };
  doc.topic = chapter.topics.includes(str(b.topic)) ? str(b.topic) : (str(b.topic, 80) || chapter.topics[0] || '');
  doc.lead = str(b.lead, 1500);
  doc.context = str(b.context, 2000);
  doc.model = str(b.model, 6000);
  doc.points = list(b.points, 20);
  doc.tip = str(b.tip, 400);
  doc.hidden = !!b.hidden;
  doc.contextNote = str(b.contextNote, 2000);
  doc.imageUrl = str(b.imageUrl, 500);
  if (doc.imageUrl && !/^(https?:\/\/|\/uploads\/)/i.test(doc.imageUrl)) return { error: 'The image link must start with https://' };

  let marks = Number(b.marks);
  const rows = (min = 1) => (Array.isArray(b.items) ? b.items : []).filter(i => i && str(i.text)).slice(0, 30);

  if (type === 'tf') {
    const items = rows().map(i => ({ text: str(i.text, 500), answer: !!i.answer }));
    if (!items.length) return { error: 'Add at least one statement' };
    doc.items = items;
  } else if (type === 'tick') {
    const columns = list(b.columns, 6);
    if (columns.length < 2) return { error: 'Add at least two columns' };
    const items = rows().map(i => ({ text: str(i.text, 500), answer: columns.includes(str(i.answer)) ? str(i.answer) : '' }));
    if (!items.length || items.some(i => !i.answer)) return { error: 'Every row needs one of the columns as its answer' };
    doc.columns = columns;
    doc.items = items;
  } else if (type === 'fill') {
    const items = rows().map(i => ({ text: str(i.text, 500), answers: list(i.answers, 8) }));
    if (!items.length || items.some(i => !i.answers.length)) return { error: 'Every item needs an accepted answer' };
    doc.items = items;
    const bank = list(b.wordbank, 30);
    if (bank.length) doc.wordbank = bank;
    doc.command = /…|\.{3}|_{3}/.test(items.map(i => i.text).join(' ')) ? 'complete' : 'identify';
  } else if (type === 'pick') {
    const options = list(b.options, 16);
    const answers = list(b.answers, 8).filter(a => options.includes(a));
    if (options.length < 3) return { error: 'Add at least three options' };
    if (!answers.length || answers.length >= options.length) return { error: 'Choose which options are correct' };
    doc.options = options;
    doc.answers = answers;
    doc.n = answers.length;
  } else if (type === 'match') {
    const items = rows().map(i => ({ text: str(i.text, 400), answer: str(i.answer, 200) }));
    if (items.length < 2 || items.some(i => !i.answer)) return { error: 'Add at least two pairs' };
    doc.items = items;
    doc.terms = items.map(i => i.answer);
  } else if (type === 'multi') {
    const parts = (Array.isArray(b.parts) ? b.parts : []).filter(p => p && str(p.text)).slice(0, 8).map((p, i) => ({
      label: str(p.label, 4) || String.fromCharCode(97 + i), text: str(p.text, 1500), marks: Math.max(1, Math.round(Number(p.marks) || 1)), model: str(p.model, 3000), points: list(p.points, 12)
    }));
    if (parts.length < 2) return { error: 'A structured question needs at least two parts' };
    parts.forEach(p => { p.command = commandOf(p.text, p.marks); });
    doc.parts = parts;
    marks = parts.reduce((n, p) => n + p.marks, 0);
  } else {
    if (!doc.lead) return { error: 'Write the question' };
    if (!doc.model) return { error: 'Write the model answer' };
    doc.command = WRITTEN_COMMANDS.includes(b.command) ? b.command : commandOf(doc.lead, marks);
  }
  if (type !== 'written' && !doc.lead && ['tf', 'tick', 'fill', 'match', 'pick'].includes(type)) return { error: 'Write the instruction for the question' };
  if (!Number.isFinite(marks) || marks < 1 || marks > 30) return { error: 'Marks must be between 1 and 30' };
  doc.marks = Math.round(marks * 2) / 2;
  doc.command = doc.command || (type === 'multi' ? 'multi' : type);
  doc.difficulty = ['easy', 'medium', 'hard'].includes(b.difficulty) ? b.difficulty : difficultyOf({ marks: doc.marks, command: doc.command, type });
  doc.category = categoryOf(doc);
  return { doc };
}

module.exports = { sanitizeQuestion };
