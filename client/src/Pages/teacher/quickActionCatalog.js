import { ClipboardCheck, GraduationCap, Megaphone, Play, Library, Users, CalendarDays, BookOpen, Layers, CheckCheck, Inbox } from 'lucide-react';

// Everything the teacher can pin to the quick-actions (+) menu. `modal` opens a global dialog, `to` navigates.
// The ids must match backend/validators/quickActions.js.
export const QUICK_ACTION_CATALOG = [
  { id: 'hw', label: 'Create H.W', icon: ClipboardCheck, modal: 'hw' },
  { id: 'quiz', label: 'Create quiz', icon: GraduationCap, modal: 'quiz' },
  { id: 'announcement', label: 'Send announcement', icon: Megaphone, modal: 'announcement' },
  { id: 'video', label: 'Add video', icon: Play, modal: 'video' },
  { id: 'note', label: 'Add interactive note', icon: Library, modal: 'note' },
  { id: 'material', label: 'Add material', icon: BookOpen, modal: 'material' },
  { id: 'flashcard', label: 'Add flashcards', icon: Layers, modal: 'flashcard' },
  { id: 'schedule', label: 'Create schedule', icon: CalendarDays, modal: 'schedule' },
  { id: 'regs', label: 'Approve registrations', icon: Users, to: '/students/registrations' },
  { id: 'grade', label: 'Grade submissions', icon: CheckCheck, to: '/work/submissions' },
  { id: 'inbox', label: 'Open inbox', icon: Inbox, to: '/inbox/announcements' }
];

/** Settings fires this after saving the list so the menu picks it up without a reload. */
export const QUICK_ACTIONS_CHANGED = 'at:quick-actions-changed';

export const DEFAULT_QUICK_ACTIONS = ['hw', 'quiz', 'announcement', 'video', 'note', 'regs', 'schedule'];
export const MAX_QUICK_ACTIONS = 8;

/** Saved ids → catalog entries in that order; unknown ids are dropped, and nothing saved means the default list. */
export function resolveQuickActions(ids) {
  const byId = Object.fromEntries(QUICK_ACTION_CATALOG.map(a => [a.id, a]));
  const picked = (ids?.length ? ids : DEFAULT_QUICK_ACTIONS).map(id => byId[id]).filter(Boolean);
  return picked.length ? picked : DEFAULT_QUICK_ACTIONS.map(id => byId[id]);
}

/** Moves the item at `from` by `step` (-1 up, +1 down) without mutating the list. */
export function moveItem(list, from, step) {
  const to = from + step;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
