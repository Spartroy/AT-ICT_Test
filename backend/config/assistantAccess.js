/**
 * @fileoverview Assistant access rules
 * @description What an assistant (a staff user who helps the teacher) may reach. Pure functions, no database:
 * - GROUPS / FEATURES / LEVELS: the permissions the teacher grants per assistant. Each feature (a tab or tool in
 *   the portal) is none | view | edit; a group is a portal section and is open when any of its features is.
 * - requirementFor(method, path): which feature and level a request needs. Default deny: a request that matches
 *   no rule is refused, so a new endpoint is invisible to assistants until it is listed here.
 * - stripHidden(): removes contact details, payments and credentials from any response before it is sent.
 */

/** Portal sections and the features inside them, in nav order. */
const GROUPS = [
  { id: 'students', label: 'Students', features: ['studentList', 'groups', 'parentNumbers'] },
  { id: 'work', label: 'Work', features: ['submissions', 'homework', 'quizzes'] },
  { id: 'library', label: 'Library', features: ['videos', 'notes', 'materials', 'pastPapers', 'flashcards', 'guide'] },
  { id: 'schedule', label: 'Schedule', features: ['classSchedule', 'live'] },
  { id: 'inbox', label: 'Inbox', features: ['announcements', 'chat'] }
];
const FEATURES = GROUPS.flatMap(g => g.features);
const LEVELS = ['none', 'view', 'edit'];
const RANK = { none: 0, view: 1, edit: 2 };

/** New assistants start able to look at the student list and nothing else. */
const DEFAULT_PERMISSIONS = Object.freeze(Object.fromEntries(FEATURES.map(f => [f, f === 'studentList' ? 'view' : 'none'])));

const groupOf = (id) => GROUPS.find(g => g.id === id);

/**
 * Coerces untrusted input into a complete { feature: level } object. Unknown keys/levels are dropped.
 * A section key from the older, coarser format ("work": "edit") applies to every feature in that section
 * that is not set on its own.
 */
const normalizePermissions = (input, base = DEFAULT_PERMISSIONS) => {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  GROUPS.forEach(g => g.features.forEach(f => {
    const level = [src[f], src[g.id]].find(l => LEVELS.includes(l));
    out[f] = level || (LEVELS.includes(base[f]) ? base[f] : 'none');
  }));
  return out;
};

/** True when `permissions[feature]` is at least `level`. A section id means "any feature in it". */
const can = (permissions, feature, level = 'view') => {
  const keys = groupOf(feature) ? groupOf(feature).features : [feature];
  const need = RANK[level] || 0;
  return keys.some(k => {
    const have = RANK[permissions && permissions[k]] || 0;
    return have > 0 && have >= need;
  });
};

const READ = ['GET', 'HEAD'];
const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * First match wins. `area: null` is an explicit deny (it shadows a broader allow below it).
 * `area: 'self'` is the assistant's own account (no permission needed, no impersonation of the teacher).
 * Otherwise `area` is a feature id. `level: 'auto'` means view for reads and edit for anything that writes.
 */
const RULES = [
  // Read-only app options (exam sessions, classes, groups) that the student filters need. Changing them stays with the teacher.
  { re: /^\/teacher\/settings$/, methods: READ, area: 'studentList', level: 'view' },

  // Never reachable, whatever the permissions: money, contact/account management, registrations, site settings.
  { re: /^\/teacher\/(income|payments|settings|samples|assistants|sessions|hall-of-fame|stories|legacy-students|reset-session-points|deleted-students)(\/|$)/, area: null },
  { re: /^\/teacher\/students\/[^/]+\/(payments|reset-password|create-parent|parent|recreate-parent|link-parent)(\/|$)/, area: null },
  { re: /^\/teacher\/parents(\/|$)/, area: null },
  { re: /^\/(registration|parent|student)(\/|$)/, area: null },

  // The assistant's own account
  { re: /^\/auth\/(me|logout|change-password)$/, area: 'self' },
  { re: /^\/assistant\/(me|tasks|activity)$/, area: 'self' },
  { re: /^\/assistant\/tasks\/[^/]+\/done$/, methods: ['PUT'], area: 'self' },
  { re: /^\/notifications(\/|$)/, area: 'self' },
  { re: /^\/sessions(\/|$)/, area: 'self' },

  // Students: read the roster, progress and leaderboard; groups can be organised. Profile edits stay with the teacher.
  { re: /^\/teacher\/students(\/[^/]+)?$/, methods: READ, area: 'studentList', level: 'view' },
  { re: /^\/teacher\/dashboard$/, methods: READ, area: 'studentList', level: 'view' },
  { re: /^\/leaderboard$/, methods: READ, area: 'studentList', level: 'view' },
  { re: /^\/teacher\/activities(\/|$)/, area: 'studentList', level: 'view' },
  { re: /^\/teacher\/groups(\/|$)/, area: 'groups', level: 'auto' },
  // Message templates for contacting parents: readable by assistants who may see parent numbers; only the teacher edits them
  { re: /^\/teacher\/message-templates$/, methods: READ, area: 'parentNumbers', level: 'view' },

  // Work: grading a student's homework or quiz is submissions; setting homework and quizzes are their own features
  { re: /^\/teacher\/submissions(\/|$)/, methods: READ, area: 'submissions', level: 'view' },
  // Weekly performance reports are filled in by whoever may grade submissions
  { re: /^\/teacher\/reports(\/|$)/, area: 'submissions', level: 'auto' },
  { re: /^\/teacher\/(assignments|quizzes)\/[^/]+\/students\/[^/]+$/, methods: WRITE, area: 'submissions', level: 'edit' },
  { re: /^\/(teacher\/)?assignments(\/|$)/, area: 'homework', level: 'auto' },
  { re: /^\/(teacher\/)?quizzes(\/|$)/, area: 'quizzes', level: 'auto' },

  // Library
  { re: /^\/teacher\/videos(\/|$)/, area: 'videos', level: 'auto' },
  { re: /^\/teacher\/notes(\/|$)/, area: 'notes', level: 'auto' },
  { re: /^\/teacher\/materials(\/|$)/, area: 'materials', level: 'auto' },
  { re: /^\/teacher\/pastpapers(\/|$)/, area: 'pastPapers', level: 'auto' },
  { re: /^\/flashcards(\/|$)/, area: 'flashcards', level: 'auto' },
  { re: /^\/guide(\/|$)/, area: 'guide', level: 'auto' },
  // "Preview as student" in the teacher portal is read-only, and follows the feature it previews
  { re: /^\/teacher\/preview\/videos$/, methods: READ, area: 'videos', level: 'view' },
  { re: /^\/teacher\/preview\/notes$/, methods: READ, area: 'notes', level: 'view' },
  { re: /^\/teacher\/preview\/materials(\/|$)/, methods: READ, area: 'materials', level: 'view' },

  // Schedule, live classes and attendance
  { re: /^\/teacher\/live(\/|$)/, area: 'live', level: 'auto' },
  { re: /^\/teacher\/(schedule|schedules)(\/|$)/, area: 'classSchedule', level: 'auto' },
  { re: /^\/schedule(\/|$)/, area: 'classSchedule', level: 'auto' },

  // Inbox: replies are writes, so they need edit
  { re: /^\/chat(\/|$)/, area: 'chat', level: 'auto' },
  { re: /^\/announcements(\/|$)/, area: 'announcements', level: 'auto' }
];

/** Strips the /api prefix and the query string: '/api/teacher/students?x=1' -> '/teacher/students'. */
const apiPath = (url) => {
  const path = String(url || '').split('?')[0].replace(/\/+$/, '') || '/';
  return path.replace(/^\/api(?=\/|$)/, '') || '/';
};

/**
 * What a request needs. Returns { area, level } (area is a feature id, or 'self'), or null when the request is
 * not allowed for assistants at all.
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
  'parentcontactnumber', 'parentnumber', 'parentnumberintl', 'parentphone', 'parentemail', 'parentinfo', 'emergencycontact',
  'payments', 'payment', 'paymentproof', 'paymentproofs', 'paymentstatus', 'fees', 'fee', 'balance', 'income', 'ledger',
  'password', 'resetpasswordtoken', 'resetpasswordexpire', 'emailverificationtoken', 'emailverificationexpire', 'token'
]);

/** Keys an assistant may see once the teacher grants the 'parentNumbers' feature. Nothing else is unlocked. */
const PARENT_NUMBER_KEYS = ['parentcontactnumber', 'parentnumber', 'parentnumberintl'];

/**
 * Deep copy of `value` without the hidden keys. Safe on mongoose documents (goes through toJSON).
 * `allow` lists lower-cased hidden keys to keep (used for the parent numbers an assistant was granted).
 */
const stripHidden = (value, allow = []) => {
  const plain = typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value;
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out = {};
      Object.keys(node).forEach(key => {
        const k = key.toLowerCase();
        if (!HIDDEN_KEYS.has(k) || allow.includes(k)) out[key] = walk(node[key]);
      });
      return out;
    }
    return node;
  };
  return walk(plain);
};

module.exports = { GROUPS, FEATURES, LEVELS, DEFAULT_PERMISSIONS, normalizePermissions, can, requirementFor, apiPath, stripHidden, HIDDEN_KEYS, PARENT_NUMBER_KEYS };
