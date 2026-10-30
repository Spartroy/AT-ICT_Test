// Shape check and clean-up for the study guide the teacher edits. The guide is one JSON document:
// { version, chapters: [{ id, key, n, title, hl, blurb, secs: [{ id, num, title, blocks: [...] }], quiz: [...] }] }
// Every string may hold light formatting (<b>, <i>, <br>); anything else is stripped before it is stored.

const BLOCK_TYPES = [
  'def', 'flow', 'tree', 'cards', 'parts', 'chips', 'meter', 'table', 'tabs', 'hint', 'mis', 'qc',
  'ipo', 'compiler', 'linker', 'keyboard', 'printer3d', 'speaker', 'actuator', 'access', 'hdd', 'cd',
  'wifi', 'hubswitch', 'router', 'protocol', 'http', 'ftp', 'urlgame', 'webterms', 'browser'
];

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_STRING = 6000;
const MAX_CHAPTERS = 40;

// Keeps <b>, <i> and <br> (attributes removed) and drops every other tag. Text such as "a < b" is left alone: a tag must start with a letter.
const TAG = /<\/?[a-zA-Z!][^>]*>/g;
const FORMAT = /^<(\/?)(b|i)(?:\s[^>]*)?>$/i;
const BREAK = /^<br\b[^>]*>$/i;

const cleanString = (s) => s.replace(TAG, (tag) => {
  const format = FORMAT.exec(tag);
  if (format) return `<${format[1]}${format[2].toLowerCase()}>`;
  return BREAK.test(tag) ? '<br>' : '';
}).slice(0, MAX_STRING);

const clean = (value) => {
  if (typeof value === 'string') return cleanString(value);
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  }
  return value;
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Returns { doc } with a cleaned copy, or { error } describing what is wrong. */
function sanitizeGuide(input) {
  if (!isObj(input) || !Array.isArray(input.chapters)) return { error: 'The guide must have a list of chapters' };
  if (!input.chapters.length || input.chapters.length > MAX_CHAPTERS) return { error: `A guide needs 1 to ${MAX_CHAPTERS} chapters` };
  if (Buffer.byteLength(JSON.stringify(input)) > MAX_BYTES) return { error: 'The guide is too large to save' };

  for (const ch of input.chapters) {
    if (!isObj(ch) || typeof ch.id !== 'string' || typeof ch.title !== 'string' || !Array.isArray(ch.secs) || !Array.isArray(ch.quiz)) {
      return { error: 'Every chapter needs an id, a title, sections and quiz questions' };
    }
    for (const sec of ch.secs) {
      if (!isObj(sec) || typeof sec.id !== 'string' || typeof sec.title !== 'string' || !Array.isArray(sec.blocks)) {
        return { error: `Section "${sec?.title || ''}" in chapter ${ch.n} is not valid` };
      }
      for (const b of sec.blocks) {
        if (!isObj(b) || typeof b.id !== 'string' || !BLOCK_TYPES.includes(b.t)) {
          return { error: `Unknown block type in section ${sec.num || sec.title}` };
        }
      }
    }
    for (const q of ch.quiz) {
      if (!isObj(q) || typeof q.t !== 'string' || !Array.isArray(q.o) || q.o.length < 2 || !Number.isInteger(q.c) || q.c < 0 || q.c >= q.o.length) {
        return { error: `A quiz question in chapter ${ch.n} needs text, at least two options and a correct answer` };
      }
    }
  }
  return { doc: { version: 1, chapters: clean(input.chapters) } };
}

module.exports = { sanitizeGuide, cleanString, BLOCK_TYPES };
