// Shape check and clean-up for the study guide the teacher edits. The guide is one JSON document:
// { version, chapters: [{ id, key, n, title, hl, blurb, secs: [{ id, num, title, blocks: [...] }], quiz: [...] }] }
// Every string may hold light formatting (<b>, <i>, <u>, <br> and colour/size <span>s); anything else is stripped before it is stored.

const BLOCK_TYPES = [
  'def', 'flow', 'tree', 'cards', 'parts', 'chips', 'meter', 'table', 'tabs', 'hint', 'mis', 'qc',
  'ipo', 'compiler', 'linker', 'keyboard', 'printer3d', 'speaker', 'actuator', 'access', 'hdd', 'cd',
  'wifi', 'hubswitch', 'router', 'protocol', 'http', 'ftp', 'urlgame', 'webterms', 'browser'
];

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_STRING = 6000;
const MAX_CHAPTERS = 40;


/** Text colours the teacher can pick. Bold text is crimson by default; `auto` removes a chosen colour. */
const TEXT_COLORS = [
  { id: 'crimson', hex: '#ca133e', label: 'Crimson' },
  { id: 'ink', hex: '#1a1a1a', label: 'Black' },
  { id: 'blue', hex: '#1d4ed8', label: 'Blue' },
  { id: 'green', hex: '#059669', label: 'Green' },
  { id: 'orange', hex: '#d97706', label: 'Orange' },
  { id: 'purple', hex: '#7c3aed', label: 'Purple' },
  { id: 'grey', hex: '#6b7280', label: 'Grey' }
];
/** execCommand colour that means "back to the default": it is dropped when the text is cleaned. */
const AUTO_COLOR = '#000001';
/** Text sizes: the value is the execCommand fontSize (1-7) and the cleaned class. Normal has no class. */
const TEXT_SIZES = [
  { id: 'sm', size: '2', label: 'Small' },
  { id: 'normal', size: '3', label: 'Normal' },
  { id: 'lg', size: '5', label: 'Large' },
  { id: 'xl', size: '6', label: 'Huge' }
];

const COLOR_BY_HEX = Object.fromEntries(TEXT_COLORS.map(c => [c.hex, c.id]));
const SIZE_BY_NUMBER = { 1: 'sm', 2: 'sm', 4: 'lg', 5: 'lg', 6: 'xl', 7: 'xl' };
const SIZE_BY_WORD = { 'x-small': 'sm', small: 'sm', large: 'lg', 'x-large': 'lg', 'xx-large': 'xl', 'xxx-large': 'xl' };
const KEEP_CLASS = /^(c-(crimson|ink|blue|green|orange|purple|grey)|s-(sm|lg|xl))$/;

const TAG = /<\/?[a-zA-Z!][^>]*>/g;
const TAG_PARTS = /^<(\/?)([a-zA-Z0-9]+)([\s\S]*?)>$/;

const toHex = (v) => {
  const s = String(v || '').trim().toLowerCase();
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s);
  if (rgb) return `#${[rgb[1], rgb[2], rgb[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('')}`;
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return s;
};
const attr = (attrs, name) => {
  const m = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3]) : '';
};

/** The colour/size classes for a <span> or <font>: from our own class names or from what the browser's editor produced. */
function spanClasses(attrs) {
  const out = new Set(attr(attrs, 'class').split(/\s+/).filter(c => KEEP_CLASS.test(c)));
  const colour = COLOR_BY_HEX[toHex(attr(attrs, 'color'))];
  if (colour) out.add(`c-${colour}`);
  const size = SIZE_BY_NUMBER[attr(attrs, 'size')];
  if (size) out.add(`s-${size}`);
  const style = attr(attrs, 'style');
  const sc = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style);
  if (sc && COLOR_BY_HEX[toHex(sc[1])]) out.add(`c-${COLOR_BY_HEX[toHex(sc[1])]}`);
  const fs = /font-size\s*:\s*([a-z-]+)/i.exec(style);
  if (fs && SIZE_BY_WORD[fs[1].toLowerCase()]) out.add(`s-${SIZE_BY_WORD[fs[1].toLowerCase()]}`);
  return [...out].sort();
}

/**
 * Keeps bold, italic, underline, line breaks and the colour/size spans above; drops every other tag and
 * attribute. Safe to render as HTML. The browser's <font> output is turned into the same spans.
 */
function cleanHtml(html) {
  const open = []; // for each <span>/<font> seen: did we keep it?
  return String(html ?? '')
    .replace(TAG, (tag) => {
      const m = TAG_PARTS.exec(tag);
      if (!m) return '';
      const closing = m[1] === '/';
      const name = m[2].toLowerCase();
      if (name === 'b' || name === 'strong') return closing ? '</b>' : '<b>';
      if (name === 'i' || name === 'em') return closing ? '</i>' : '<i>';
      if (name === 'u') return closing ? '</u>' : '<u>';
      if (name === 'br') return closing ? '' : '<br>';
      if (name === 'span' || name === 'font') {
        if (closing) return open.pop() ? '</span>' : '';
        const classes = spanClasses(m[3]);
        open.push(classes.length > 0);
        return classes.length ? `<span class="${classes.join(' ')}">` : '';
      }
      return '';
    });
}


const cleanString = (s) => cleanHtml(s).slice(0, MAX_STRING);

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
