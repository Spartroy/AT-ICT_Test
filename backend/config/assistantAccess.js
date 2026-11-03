/**
 * @fileoverview Assistant access rules
 * @description What an assistant (a staff user who helps the teacher) may reach. Pure functions, no database:
 * - AREAS / LEVELS: the permissions the teacher grants per assistant (none | view | edit per area).
 * - requirementFor(method, path): which area and level a request needs. Default deny: a request that matches
 *   no rule is refused, so a new endpoint is invisible to assistants until it is listed here.
 * - stripHidden(): removes contact details, payments and credentials from any response before it is sent.
 */

const AREAS = ['students', 'work', 'library', 'schedule', 'inbox'];
const LEVELS = ['none', 'view', 'edit'];
const RANK = { none: 0, view: 1, edit: 2 };

/** New assistants start read-only on students and nothing else. */
const DEFAULT_PERMISSIONS = Object.freeze({ students: 'view', work: 'none', library: 'none', schedule: 'none', inbox: 'none' });

/** Coerces untrusted input into a complete { area: level } object. Unknown areas/levels are dropped. */
const normalizePermissions = (input, base = DEFAULT_PERMISSIONS) => {
  const out = {};
  AREAS.forEach(area => {
    const level = input && typeof input === 'object' ? input[area] : undefined;
    out[area] = LEVELS.includes(level) ? level : (LEVELS.includes(base[area]) ? base[area] : 'none');
  });
  return out;
};

/** True when `permissions[area]` is at least `level`. */
const can = (permissions, area, level = 'view') => {
  const have = RANK[permissions && permissions[area]] || 0;
  return have >= (RANK[level] || 0) && have > 0;
};

const READ = ['GET', 'HEAD'];

/**
 * First match wins. `area: null` is an explicit deny (it shadows a broader allow below it).
 * `area: 'self'` is the assistant's own account (no permission needed, no impersonation of the teacher).
 * `level: 'auto'` means view for reads and edit for anything that writes.
 */
const RULES = [
  // Read-only app options (exam sessions, classes, groups) that the student filters need. Changing them stays with the teacher.
  { re: /^\/teacher\/settings$/, methods: READ, area: 'students', level: 'view' },

  // Never reachable, whatever the permissions: money, contact/account management, registrations, site settings.
  { re: /^\/teacher\/(income|payments|settings|samples|assistants|sessions|hall-of-fame|stories|legacy-students|reset-session-points)(\/|$)/, area: null },
  { re: /^\/teacher\/students\/[^/]+\/(payments|reset-password|create-parent|parent|recreate-parent)(\/|$)/, area: null },
  { re: /^\/(registration|parent|student)(\/|$)/, area: null },

  // The assistant's own account
  { re: /^\/auth\/(me|logout|change-password)$/, area: 'self' },
  { re: /^\/assistant\/(me|tasks|activity)$/, area: 'self' },
  { re: /^\/assistant\/tasks\/[^/]+\/done$/, methods: ['PUT'], area: 'self' },
  { re: /^\/notifications(\/|$)/, area: 'self' },
  { re: /^\/sessions(\/|$)/, area: 'self' },

  // Students: read the roster, progress and leaderboard; editing means organising groups. Profile edits stay with the teacher.
  { re: /^\/teacher\/students(\/[^/]+)?$/, methods: READ, area: 'students', level: 'view' },
  { re: /^\/teacher\/dashboard$/, methods: READ, area: 'students', level: 'view' },
  { re: /^\/leaderboard$/, methods: READ, area: 'students', level: 'view' },
  { re: /^\/teacher\/activities(\/|$)/, area: 'students', level: 'view' },
  { re: /^\/teacher\/groups(\/|$)/, area: 'students', level: 'auto' },

  // Work: submissions, homework, quizzes and grading
  { re: /^\/teacher\/submissions(\/|$)/, methods: READ, area: 'work', level: 'view' },
  { re: /^\/teacher\/(assignments|quizzes)(\/|$)/, area: 'work', level: 'auto' },
  { re: /^\/(assignments|quizzes)(\/|$)/, area: 'work', level: 'auto' },

  // Library: videos, notes, materials, flashcards, study guide, past papers
  { re: /^\/teacher\/(materials|videos|notes|pastpapers)(\/|$)/, area: 'library', level: 'auto' },
  { re: /^\/(flashcards|guide)(\/|$)/, area: 'library', level: 'auto' },
  // "Preview as student" in the teacher portal is read-only
  { re: /^\/teacher\/preview(\/|$)/, methods: READ, area: 'library', level: 'view' },

  // Schedule, live classes and attendance
  { re: /^\/teacher\/(schedule|schedules|live)(\/|$)/, area: 'schedule', level: 'auto' },
  { re: /^\/schedule(\/|$)/, area: 'schedule', level: 'auto' },

  // Inbox: messages and announcements. Replies are writes, so they need edit.
  { re: /^\/(chat|announcements)(\/|$)/, area: 'inbox', level: 'auto' }
];

/** Strips the /api prefix and the query string: '/api/teacher/students?x=1' -> '/teacher/students'. */
const apiPath = (url) => {
  const path = String(url || '').split('?')[0].replace(/\/+$/, '') || '/';
  return path.replace(/^\/api(?=\/|$)/, '') || '/';
};

/**
 * What a request needs. Returns { area, level } (area may be 'self'), or null when the request is not allowed
 * for assistants at all.
 */
const requirementFor = (method, url) => {
  const verb = String(method || 'GET').toUpperCase();
  const path = apiPath(url);
  for (const rule of RULES) {
    if (!rule.re.test(path)) continue;
    if (rule.methods && !rule.methods.includes(verb)) continue;
    if (rule.area === null) return null;
    if (rule.area === 'self') return { area: 'self', level: 'none' };
    return { area: rule.area, level: rule.level === 'auto' ? (READ.includes(verb) ? 'view' : 'edit') : rule.level };
  }
  return null;
};

/** Keys (lower-cased) that never leave the server for an assistant, at any depth. */
const HIDDEN_KEYS = new Set([
  'email', 'contactnumber', 'alternativenumber', 'phone', 'phonenumber', 'whatsapp', 'address',
  'parentcontactnumber', 'parentphone', 'parentemail', 'parentinfo', 'emergencycontact',
  'payments', 'payment', 'paymentproof', 'paymentproofs', 'paymentstatus', 'fees', 'fee', 'balance', 'income', 'ledger',
  'password', 'resetpasswordtoken', 'resetpasswordexpire', 'emailverificationtoken', 'emailverificationexpire', 'token'
]);

/** Deep copy of `value` without the hidden keys. Safe on mongoose documents (goes through toJSON). */
const stripHidden = (value) => {
  const plain = typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value;
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out = {};
      Object.keys(node).forEach(key => {
        if (!HIDDEN_KEYS.has(key.toLowerCase())) out[key] = walk(node[key]);
      });
      return out;
    }
    return node;
  };
  return walk(plain);
};

module.exports = { AREAS, LEVELS, DEFAULT_PERMISSIONS, normalizePermissions, can, requirementFor, apiPath, stripHidden, HIDDEN_KEYS };
