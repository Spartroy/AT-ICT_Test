#!/usr/bin/env node
/**
 * Builds backend/data/chapterFlashcards.json (one flashcard stack per chapter) from the revision study guide
 * (client/public/study-guide.html, a "bundler" page whose chapter data is packed inside).
 *
 *   node backend/scripts/buildChapterFlashcards.js [path/to/study-guide.html]
 *
 * Re-run it whenever the study guide changes, then use Library > Flashcards > "Import chapter flashcards".
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC = process.argv[2] || path.join(__dirname, '..', '..', 'client', 'public', 'study-guide.html');
const OUT = path.join(__dirname, '..', 'data', 'chapterFlashcards.json');
const MAX = 1000; // model limit for a card side

// ---------- unpack the study guide ----------
const readBlock = (html, type) => {
  const m = html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`));
  return m ? JSON.parse(m[1]) : null;
};

function loadChapters(file) {
  const html = fs.readFileSync(file, 'utf8');
  const manifest = readBlock(html, 'manifest');
  if (!manifest) throw new Error('This does not look like the bundled study guide (no manifest).');
  const sandbox = {};
  for (const entry of Object.values(manifest)) {
    if (!/javascript/.test(entry.mime)) continue;
    let raw = Buffer.from(entry.data, 'base64');
    if (entry.compressed) raw = zlib.gunzipSync(raw);
    const code = raw.toString('utf8');
    if (!code.includes('ATICT_CH')) continue;
    // eslint-disable-next-line no-new-func
    new Function('window', code)(sandbox);
  }
  return sandbox.ATICT_CH || {};
}

// ---------- text helpers ----------
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const clean = (h = '') => String(h)
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTITIES[m])
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s+/g, '\n')
  .trim();

const cut = (s) => (s.length <= MAX ? s : `${s.slice(0, MAX - 1).trimEnd()}…`);
const bullets = (list) => list.map(x => `• ${clean(x)}`).join('\n');

// ---------- block -> cards ----------
function cardsForBlock(b, sec) {
  const out = [];
  const add = (front, back) => {
    const f = clean(front);
    const k = clean(back);
    if (f && k) out.push({ front: cut(f), back: cut(k) });
  };

  switch (b.t) {
    case 'def':
      add(`Define: ${b.l}`, b.h);
      break;
    case 'qc':
      add(b.q, b.a);
      break;
    case 'mis':
      add(`Common mistake: ${b.w}\nWhat is wrong with it?`, b.r);
      break;
    case 'hint':
      add(`Exam tip: ${sec.title}`, b.h);
      break;
    case 'cards':
      add(b.title, b.items.map(([a, c]) => `${a}: ${c}`).join('\n'));
      break;
    case 'chips':
      add(`${b.title}: list them`, bullets(b.items));
      break;
    case 'parts':
      add(b.title, b.items.map(([a, c]) => `${a}: ${c}`).join('\n'));
      break;
    case 'meter':
      add(b.title, b.items.map(([n, , note]) => `${n}: ${note}`).join('\n'));
      break;
    case 'flow':
      add(`${b.title}: what are the steps, in order?`, b.steps.map(([s, d], i) => `${i + 1}. ${s}${d ? ` – ${d}` : ''}`).join('\n'));
      break;
    case 'tree':
      add(`${b.root}: what are the parts?`, b.kids.map(([k, items]) => `${k}:\n${bullets(items)}`).join('\n\n'));
      break;
    case 'table':
      if (b.head.length === 2) {
        // Two-column comparison: one card for the whole table.
        add(`${b.title}: ${b.head[0]} vs ${b.head[1]}`, b.rows.map(([x, y]) => `• ${x}  |  ${y}`).join('\n'));
      } else {
        // Feature table: one card per row.
        b.rows.forEach(([key, ...rest]) => {
          add(`${b.title}: ${key}`, rest.map((v, i) => `${b.head[i + 1]}: ${v}`).join('\n'));
        });
      }
      break;
    case 'tabs':
      b.tabs.forEach((t) => {
        const parts = [t.d];
        if (t.u) parts.push(`Used for: ${t.u}`);
        if (t.p?.length) parts.push(`Advantages:\n${bullets(t.p)}`);
        if (t.c?.length) parts.push(`Disadvantages:\n${bullets(t.c)}`);
        add(`${sec.title}: ${t.n}`, parts.join('\n'));
      });
      break;
    default:
      break; // unknown block types are ignored
  }
  return out;
}

// "Storage" + "Devices." -> "Storage Devices"; "Data" + "bases." -> "Databases".
const fullTitle = (ch) => {
  const hl = clean(ch.hl).replace(/\.$/, '');
  return /^[a-z]/.test(hl) ? `${clean(ch.title)}${hl}` : `${clean(ch.title)} ${hl}`.trim();
};

function stackFor(number, chapters) {
  const first = chapters[0];
  const cards = [];
  chapters.forEach(ch => ch.secs.forEach(sec => sec.blocks.forEach(b => cards.push(...cardsForBlock(b, sec)))));
  // Drop exact duplicates but keep order.
  const seen = new Set();
  const unique = cards.filter(c => (seen.has(`${c.front}|${c.back}`) ? false : seen.add(`${c.front}|${c.back}`)));
  return {
    title: `Chapter ${number} – ${chapters.length > 1 ? clean(first.title) : fullTitle(first)}`,
    description: clean(first.blurb).slice(0, 500),
    subject: 'IGCSE ICT',
    cards: unique
  };
}

function build() {
  const CH = loadChapters(SRC);
  // Keys are 1..13, with chapter 6 split into "6a" and "6b" (Networks part 1 and 2).
  const numbers = {};
  Object.keys(CH).forEach((key) => {
    const n = parseInt(key, 10);
    (numbers[n] = numbers[n] || []).push({ key, ch: CH[key] });
  });
  const stacks = Object.keys(numbers).map(Number).sort((a, b) => a - b).map((n) => {
    const parts = numbers[n].sort((a, b) => a.key.localeCompare(b.key)).map(p => p.ch);
    return stackFor(n, parts);
  });
  return stacks;
}

if (require.main === module) {
  const stacks = build();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(stacks, null, 2)}\n`);
  stacks.forEach(s => console.log(`${s.title}: ${s.cards.length} cards`));
  console.log(`\nWrote ${stacks.length} stacks (${stacks.reduce((n, s) => n + s.cards.length, 0)} cards) to ${path.relative(process.cwd(), OUT)}`);
}

module.exports = { build, cardsForBlock, clean };
