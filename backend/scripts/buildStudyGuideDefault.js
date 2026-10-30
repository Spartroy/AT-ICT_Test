/**
 * Builds backend/data/studyGuideDefault.json (the guide's starting content) from the designer's
 * standalone export, whose chapter data is packed inside as `window.ATICT_CH[...] = {...}`.
 *
 *   node backend/scripts/buildStudyGuideDefault.js path/to/AT-ICT_Study_Guide_Print_Interactive.html
 *
 * Besides converting, it gives every chapter, section, block and question a stable id and tidies the
 * order inside each section: notes first, "Try it" activities next to the topic they illustrate, and
 * the exam-skill trio (tip, common mistake, quick check) always last.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = process.argv[2];
const OUT = path.join(__dirname, '..', 'data', 'studyGuideDefault.json');
if (!SRC) {
  console.error('Usage: node backend/scripts/buildStudyGuideDefault.js <study-guide.html>');
  process.exit(1);
}

const CHAPTER_ORDER = ['1', '2', '3', '4', '5', '6a', '6b', '7', '8', '9', '10', '11', '12', '13'];

// One line telling the student what to do. Teachers can reword it in the editor.
const ACTIVITY_HELP = {
  ipo: 'Type a calculation and follow the data through input, process and output.',
  compiler: 'Press Replay and watch source code become machine code the CPU can run.',
  linker: 'Press Replay to see several object files combine into one program.',
  keyboard: 'Tap a key (or type one) and follow the signal from the circuit board to the CPU.',
  printer3d: 'Switch between Direct, Binder and Subtractive to compare how each builds an object.',
  speaker: 'Press play and watch how electrical signals become sound.',
  actuator: 'Drag an actuator into the circuit and switch it on.',
  access: 'Find the file with serial access, then with direct access. Compare the effort.',
  hdd: 'Step through a read: platters spin, the arm moves, the head reads the data.',
  cd: 'Watch the laser read the pits and lands on a disc.',
  wifi: 'Follow a request from your device through the wireless router.',
  hubswitch: 'Send a packet through a hub, then through a switch. Who receives it?',
  router: 'Follow a packet across networks as the router reads its routing table.',
  protocol: 'Step through how two devices agree on a protocol before they talk.',
  http: 'Compare plain HTTP with HTTPS and see what SSL does to the data.',
  ftp: 'Step through uploading a website to a server with FTP.',
  urlgame: 'Drag the pieces into the right order to build a full URL, then press Check.',
  webterms: 'Tap each term to see how the website, webpage, server and browser fit together.',
  browser: 'Step through what a browser does from typing an address to showing the page.'
};
const ACTIVITIES = new Set(Object.keys(ACTIVITY_HELP));
const TRAILING = ['hint', 'mis', 'qc'];

const html = fs.readFileSync(SRC, 'utf8');
const win = {};
const ctx = vm.createContext({ window: win });
const re = /\(window\.ATICT_CH=window\.ATICT_CH\|\|\{\}\)[\s\S]*?(?=<\/script>)/g;
let m;
while ((m = re.exec(html))) vm.runInContext(m[0], ctx);
const D = win.ATICT_CH;
if (!D) throw new Error('No chapter data found in that file');

let seq = 0;
const id = (p) => `${p}${(++seq).toString(36)}`;

/** Notes, then the rest in their original order, then tip, common mistake, quick check. */
function tidy(sec) {
  const rest = sec.blocks.filter(b => !TRAILING.includes(b.t));
  const tail = TRAILING.flatMap(t => sec.blocks.filter(b => b.t === t));
  let blocks = [...rest, ...tail];

  // 6.3: the hub/switch activity belongs after "How a switch works", not between the table and its flow.
  if (sec.id === '6.3') {
    const hub = blocks.find(b => b.t === 'hubswitch');
    const flowAt = blocks.findIndex(b => b.t === 'flow' && /switch works/i.test(b.title || ''));
    if (hub && flowAt > -1) {
      blocks = blocks.filter(b => b !== hub);
      blocks.splice(blocks.findIndex(b => b.t === 'flow' && /switch works/i.test(b.title || '')) + 1, 0, hub);
    }
  }
  return blocks;
}

const chapters = CHAPTER_ORDER.filter(k => D[k]).map((key) => {
  const c = D[key];
  return {
    id: id('c'),
    key,
    n: String(c.n),
    title: c.title,
    hl: c.hl,
    blurb: c.blurb,
    secs: c.secs.map(s => ({
      id: id('s'),
      num: s.id,
      title: s.title,
      blocks: tidy(s).map(b => {
        const out = { id: id('b'), ...b };
        // All panels are shown at once, so "Tap each device" becomes "Devices".
        if (b.t === 'tabs' && /^Tap each /i.test(b.title || '')) {
          const noun = b.title.replace(/^Tap each /i, '');
          out.title = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}s`;
        }
        if (ACTIVITIES.has(b.t)) out.ins = ACTIVITY_HELP[b.t];
        return out;
      })
    })),
    quiz: c.quiz.map(q => ({ id: id('q'), sec: q.sec, t: q.t, o: q.o, c: q.c, e: q.e }))
  };
});

fs.writeFileSync(OUT, JSON.stringify({ version: 1, chapters }));
const blocks = chapters.reduce((n, c) => n + c.secs.reduce((k, s) => k + s.blocks.length, 0), 0);
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${chapters.length} chapters, ${blocks} blocks`);
