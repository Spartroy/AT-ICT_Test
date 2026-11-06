// Pure helpers for the study guide: the same document is read by students and edited by the teacher.
// Document shape: { version, chapters: [{ id, key, n, title, hl, blurb, secs: [{ id, num, title, blocks }], quiz }] }

let counter = 0;
/** Short id for a new chapter, section, block or question. */
export const uid = (prefix = 'x') => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

/** The guide's three phases, as the chapters group in the contents list. */
export const PHASES = [
  { title: 'Computer hardware', keys: ['1', '2', '3', '4'] },
  { title: 'Data, networks and security', keys: ['5', '6a', '6b', '7'] },
  { title: 'Systems and applications', keys: ['8', '9', '10', '11', '12', '13'] }
];

/** Chapters grouped by phase. A chapter the teacher added (key not in any phase) lands in the last group. */
export function groupChapters(chapters) {
  const groups = PHASES.map(p => ({ title: p.title, items: [] }));
  chapters.forEach((ch, index) => {
    const at = PHASES.findIndex(p => p.keys.includes(ch.key));
    groups[at === -1 ? groups.length - 1 : at].items.push({ ch, index });
  });
  return groups.filter(g => g.items.length);
}

// ---------- text ----------

/** Text colours the teacher can pick. Bold text is crimson by default; `auto` removes a chosen colour. */
export const TEXT_COLORS = [
  { id: 'crimson', hex: '#ca133e', label: 'Crimson' },
  { id: 'ink', hex: '#1a1a1a', label: 'Black' },
  { id: 'blue', hex: '#1d4ed8', label: 'Blue' },
  { id: 'green', hex: '#059669', label: 'Green' },
  { id: 'orange', hex: '#d97706', label: 'Orange' },
  { id: 'purple', hex: '#7c3aed', label: 'Purple' },
  { id: 'grey', hex: '#6b7280', label: 'Grey' }
];
/** execCommand colour that means "back to the default": it is dropped when the text is cleaned. */
export const AUTO_COLOR = '#000001';
/** Text sizes: the value is the execCommand fontSize (1-7) and the cleaned class. Normal has no class. */
export const TEXT_SIZES = [
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
export function cleanHtml(html) {
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
    })
    .replace(/ /g, ' ')
    .replace(/(<br>)+$/g, '');
}

/** Text without markup, for labels and sorting. */
export const plainText = (html) => cleanHtml(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

// ---------- immutable updates by path ----------

export function getIn(obj, path) {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj };
  copy[head] = setIn(obj?.[head], rest, value);
  return copy;
}

/** Remove item `index` of the array at `path`. */
export function removeAt(obj, path, index) {
  return setIn(obj, path, (getIn(obj, path) || []).filter((_, i) => i !== index));
}

/** Insert `item` into the array at `path` so it ends up at `index`. */
export function insertAt(obj, path, index, item) {
  const list = (getIn(obj, path) || []).slice();
  list.splice(index, 0, item);
  return setIn(obj, path, list);
}

/** Move item `from` to position `to` in the array at `path`. */
export function moveItem(obj, path, from, to) {
  const list = getIn(obj, path);
  if (to < 0 || to >= list.length || from === to) return obj;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return setIn(obj, path, next);
}

// ---------- block kinds ----------

/** Practical activities: the interactive demos. Each is a custom element registered by /guide/demos.js. */
export const ACTIVITY_TAGS = {
  ipo: 'ipo-calc', compiler: 'compiler-demo', linker: 'linker-demo', keyboard: 'keyboard-demo', printer3d: 'printer3d-demo',
  speaker: 'speaker-demo', actuator: 'actuator-lab', access: 'access-demo', hdd: 'hdd-demo', cd: 'cd-demo', wifi: 'wifi-demo',
  hubswitch: 'hubswitch-demo', router: 'router-demo', protocol: 'protocol-demo', http: 'http-demo', ftp: 'ftp-demo',
  urlgame: 'url-game', webterms: 'webterms-demo', browser: 'browser-demo'
};
export const isActivity = (type) => type in ACTIVITY_TAGS;

const ACTIVITY_LABELS = {
  ipo: 'Calculator: input, process, output', compiler: 'Compiler', linker: 'Linker', keyboard: 'How a keyboard works', printer3d: '3D printer',
  speaker: 'Inside a speaker', actuator: 'Build an actuator circuit', access: 'Serial vs direct access', hdd: 'Inside a hard disk drive',
  cd: 'How a CD is read', wifi: 'How Wi-Fi works', hubswitch: 'Hub vs switch', router: 'How a router works', protocol: 'How a protocol works',
  http: 'HTTP, SSL and HTTPS', ftp: 'Publishing with FTP', urlgame: 'Build a URL', webterms: 'Web terms', browser: 'How a web browser works'
};

/** What the teacher can add. `make` returns a fresh, filled-in block so nothing starts empty. */
export const BLOCK_KINDS = [
  { t: 'def', group: 'Notes', label: 'Definition', hint: 'A key term and its meaning', make: () => ({ l: 'Term', h: 'Explain it in one clear sentence.' }) },
  { t: 'cards', group: 'Notes', label: 'Cards', hint: 'A grid of short headed points', make: () => ({ title: 'Heading', items: [['Point one', 'Detail'], ['Point two', 'Detail']] }) },
  { t: 'flow', group: 'Notes', label: 'Steps', hint: 'A numbered sequence with arrows', make: () => ({ title: 'How it works', steps: [['Step one', 'What happens'], ['Step two', 'What happens']] }) },
  { t: 'tree', group: 'Notes', label: 'Tree', hint: 'A topic split into branches', make: () => ({ root: 'Topic', kids: [['Branch one', ['Point']], ['Branch two', ['Point']]] }) },
  { t: 'table', group: 'Notes', label: 'Table', hint: 'Compare things side by side', make: () => ({ title: 'Comparison', head: ['Feature', 'Option A', 'Option B'], rows: [['', '', ''], ['', '', '']] }) },
  { t: 'tabs', group: 'Notes', label: 'Panels', hint: 'Device or term panels with pros and cons', make: () => ({ title: 'Panels', tabs: [{ n: 'Name', d: 'Describe it.', p: ['Advantage'], c: ['Disadvantage'] }] }) },
  { t: 'parts', group: 'Notes', label: 'Parts', hint: 'Named parts and what each is', make: () => ({ title: 'Parts', items: [['Part', 'What it is']] }) },
  { t: 'chips', group: 'Notes', label: 'Tags', hint: 'A short list shown as pills', make: () => ({ title: 'Key points', items: ['One', 'Two'] }) },
  { t: 'meter', group: 'Notes', label: 'Scale', hint: 'Bars that rank things', make: () => ({ title: 'Scale', items: [['Item', 50, 'Medium']] }) },
  { t: 'hint', group: 'Exam help', label: 'Exam tip', hint: 'A tip to remember', make: () => ({ h: 'Write the tip here.' }) },
  { t: 'mis', group: 'Exam help', label: 'Common mistake', hint: 'What students write vs the correct answer', make: () => ({ w: '"What students often write."', r: 'The correct answer.' }) },
  { t: 'qc', group: 'Exam help', label: 'Quick check', hint: 'A question with a reveal-answer', make: () => ({ q: 'Question?', a: 'Answer.' }) },
  ...Object.keys(ACTIVITY_TAGS).map(t => ({
    t, group: 'Practical activities', label: ACTIVITY_LABELS[t], hint: 'Interactive demo', make: () => ({ title: ACTIVITY_LABELS[t], ins: 'Press the buttons and follow what happens.' })
  }))
];
const KIND_BY_TYPE = Object.fromEntries(BLOCK_KINDS.map(k => [k.t, k]));
export const kindOf = (type) => KIND_BY_TYPE[type];

export const newBlock = (type) => ({ id: uid('b'), t: type, ...KIND_BY_TYPE[type].make() });
export const newSection = (chapter) => ({ id: uid('s'), num: `${chapter.n}.${chapter.secs.length + 1}`, title: 'New section', blocks: [newBlock('def')] });
export const newQuestion = (sec = '') => ({ id: uid('q'), sec, t: 'Question?', o: ['Option A', 'Option B', 'Option C', 'Option D'], c: 0, e: 'Why this is the right answer.' });

// ---------- quiz ----------

/** Score for one chapter. `answers` maps question index to the option picked. */
export function scoreQuiz(quiz, answers) {
  const answered = Object.keys(answers).length;
  const score = quiz.filter((q, i) => answers[i] === q.c).length;
  const missed = [...new Set(quiz.filter((q, i) => answers[i] !== undefined && answers[i] !== q.c).map(q => q.sec))];
  return { answered, score, missed, done: answered === quiz.length && answered > 0 };
}

export function verdict(score, total) {
  const r = total ? score / total : 0;
  if (r >= 0.9) return 'A* material. Chapter locked in.';
  if (r >= 0.7) return "Solid. A quick revisit and you're there.";
  return 'Good start. Re-read the sections above, then retry.';
}

/** Chapter heading as shown in lists: "Ch 6 P1". */
export const chapterTag = (ch) => `Ch ${String(ch.n).replace(' · PART ', ' P')}`;

/** Section number for display: "Overview" for x.0. */
export const sectionNum = (sec) => (String(sec.num).endsWith('.0') ? 'Overview' : sec.num);
