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

const TAG = /<\/?[a-zA-Z!][^>]*>/g;
const FORMAT = /^<(\/?)(b|strong|i|em)(?:\s[^>]*)?>$/i;
const BREAK = /^<br\b[^>]*>$/i;

/** Keeps bold, italic and line breaks; drops every other tag and all attributes. Safe to render as HTML. */
export function cleanHtml(html) {
  return String(html ?? '')
    .replace(TAG, (tag) => {
      const f = FORMAT.exec(tag);
      if (f) return `<${f[1]}${/^(b|strong)$/i.test(f[2]) ? 'b' : 'i'}>`;
      return BREAK.test(tag) ? '<br>' : '';
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
