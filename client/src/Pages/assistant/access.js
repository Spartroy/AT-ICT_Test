/**
 * Assistant permissions, mirrored from the server (backend/config/assistantAccess.js).
 * The server is the real gate; this only decides what to show.
 */

export const ASSISTANT_BASE = '/assistant-dashboard';

export const LEVELS = ['none', 'view', 'edit'];
const RANK = { none: 0, view: 1, edit: 2 };

/** The areas a teacher can grant, in nav order. `path` is the portal section. */
export const AREAS = [
  { id: 'students', label: 'Students', path: 'students', blurb: 'Student list, progress and groups. No contact details.' },
  { id: 'work', label: 'Work', path: 'work', blurb: 'Submissions, homework and quizzes, including grading.' },
  { id: 'library', label: 'Library', path: 'library', blurb: 'Videos, notes, materials, flashcards and past papers.' },
  { id: 'schedule', label: 'Schedule', path: 'schedule', blurb: 'Class schedule, live classes and attendance.' },
  { id: 'inbox', label: 'Inbox', path: 'inbox', blurb: 'Announcements and student chat. Replies go out under the teacher’s name.' }
];

export const DEFAULT_PERMISSIONS = { students: 'view', work: 'none', library: 'none', schedule: 'none', inbox: 'none' };

/** A complete { area: level } object from whatever the server sent. */
export const normalizePermissions = (input) => {
  const out = {};
  AREAS.forEach(({ id }) => {
    out[id] = input && LEVELS.includes(input[id]) ? input[id] : 'none';
  });
  return out;
};

/** True when the assistant has at least `level` on `area`. */
export const hasLevel = (permissions, area, level = 'view') => {
  const have = RANK[permissions && permissions[area]] || 0;
  return have > 0 && have >= (RANK[level] || 0);
};

/** Areas the assistant can open, in nav order. */
export const visibleAreas = (permissions) => AREAS.filter(a => hasLevel(permissions, a.id, 'view'));

/** Sidebar items: Home always, then one entry per area with view access. */
export const assistantNavItems = (permissions, base = ASSISTANT_BASE) => [
  { to: base, end: true, label: 'Home', area: null },
  ...visibleAreas(permissions).map(a => ({ to: `${base}/${a.path}`, label: a.label, area: a.id }))
];

/** True when no area is granted at all (the assistant can only see their account). */
export const hasNoAccess = (permissions) => visibleAreas(permissions).length === 0;

/** Short label for a level, for chips. */
export const levelLabel = (level) => (level === 'edit' ? 'Can edit' : level === 'view' ? 'View only' : 'No access');
