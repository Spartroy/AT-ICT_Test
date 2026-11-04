/**
 * Assistant permissions, mirrored from the server (backend/config/assistantAccess.js).
 * The server is the real gate; this only decides what to show.
 *
 * A "group" is a portal section (Students, Work…). A "feature" is a tab or tool inside it, and carries the level
 * the teacher grants: none | view | edit. A group is open when any of its features is.
 */

export const ASSISTANT_BASE = '/assistant-dashboard';

export const LEVELS = ['none', 'view', 'edit'];
const RANK = { none: 0, view: 1, edit: 2 };

export const GROUPS = [
  {
    id: 'students', label: 'Students', path: 'students', blurb: 'Student emails and phone numbers stay hidden. Parent numbers are a separate permission.',
    features: [
      { id: 'studentList', label: 'All students', blurb: 'Student list, progress and leaderboard.' },
      { id: 'groups', label: 'Groups', blurb: 'See and organise teaching groups.' },
      { id: 'parentNumbers', label: 'Parent numbers', blurb: 'See each student’s parent phone number and message parents. Needs All students.' }
    ]
  },
  {
    id: 'work', label: 'Work', path: 'work', blurb: 'Homework and quizzes.',
    features: [
      { id: 'submissions', label: 'Submissions & grading', blurb: 'Open what students handed in and grade it.' },
      { id: 'homework', label: 'Homework', blurb: 'The homework list; edit to create or change it.' },
      { id: 'quizzes', label: 'Quizzes', blurb: 'The quiz list; edit to create or change them.' }
    ]
  },
  {
    id: 'library', label: 'Library', path: 'library', blurb: 'Learning content.',
    features: [
      { id: 'videos', label: 'Videos', blurb: 'Lesson and practical videos.' },
      { id: 'notes', label: 'Interactive notes', blurb: 'Notes students read online.' },
      { id: 'materials', label: 'Materials', blurb: 'Files and documents.' },
      { id: 'pastPapers', label: 'Past papers', blurb: 'Past paper sets.' },
      { id: 'flashcards', label: 'Flashcards', blurb: 'Revision flashcard stacks.' },
      { id: 'guide', label: 'Study guide', blurb: 'Edit and publish the study guide.' }
    ]
  },
  {
    id: 'schedule', label: 'Schedule', path: 'schedule', blurb: 'Classes and attendance.', navNeeds: 'classSchedule', // live classes are reached from the dashboard, so the Schedule page itself needs the schedule feature
    
    features: [
      { id: 'classSchedule', label: 'Class schedule', blurb: 'Weekly schedules and who is assigned.' },
      { id: 'live', label: 'Live classes & attendance', blurb: 'Start or end live classes and mark attendance.' }
    ]
  },
  {
    id: 'inbox', label: 'Inbox', path: 'inbox', blurb: 'Messages and announcements.',
    features: [
      { id: 'announcements', label: 'Announcements', blurb: 'Read and post announcements.' },
      { id: 'chat', label: 'Student chat', blurb: 'Read and reply to students. Replies go out under the teacher’s name.' }
    ]
  }
];

export const FEATURES = GROUPS.flatMap(g => g.features.map(f => ({ ...f, group: g.id })));

export const DEFAULT_PERMISSIONS = Object.fromEntries(FEATURES.map(f => [f.id, f.id === 'studentList' ? 'view' : 'none']));

const groupOf = (id) => GROUPS.find(g => g.id === id);

/** A complete { feature: level } object from whatever the server sent (a section key from older data applies to its features). */
export const normalizePermissions = (input) => {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  GROUPS.forEach(g => g.features.forEach(f => {
    out[f.id] = [src[f.id], src[g.id]].find(l => LEVELS.includes(l)) || 'none';
  }));
  return out;
};

/** True when the assistant has at least `level` on `key` (a feature id, or a group id meaning "any feature in it"). */
export const hasLevel = (permissions, key, level = 'view') => {
  const ids = groupOf(key) ? groupOf(key).features.map(f => f.id) : [key];
  const need = RANK[level] || 0;
  return ids.some(id => {
    const have = RANK[permissions && permissions[id]] || 0;
    return have > 0 && have >= need;
  });
};

/** Sections the assistant can open, in nav order. */
export const visibleAreas = (permissions) => GROUPS.filter(g => hasLevel(permissions, g.navNeeds || g.id, 'view'));

/** Sidebar items: Home always, then one entry per section with something viewable in it. */
export const assistantNavItems = (permissions, base = ASSISTANT_BASE) => [
  { to: base, end: true, label: 'Home', area: null },
  ...visibleAreas(permissions).map(g => ({ to: `${base}/${g.path}`, label: g.label, area: g.id }))
];

/** First tab (from `tabs`, a list of [tabId, featureId]) the assistant may open, or null. */
export const firstTab = (permissions, tabs) => (tabs.find(([, feature]) => hasLevel(permissions, feature))?.[0]) || null;

/** True when nothing is granted at all (the assistant can only see their account). */
export const hasNoAccess = (permissions) => visibleAreas(permissions).length === 0;

/** Short label for a level, for chips. */
export const levelLabel = (level) => (level === 'edit' ? 'Can edit' : level === 'view' ? 'View only' : 'No access');
