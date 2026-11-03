import { hasLevel } from './access';

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** Classes starting today (or live now), soonest first. */
export const todaysSessions = (sessions = [], now = new Date()) => {
  const from = startOfDay(now).getTime();
  const to = from + DAY;
  return sessions
    .filter(s => s.status === 'live' || (s.status !== 'ended' && s.status !== 'cancelled' && new Date(s.startsAt).getTime() >= from && new Date(s.startsAt).getTime() < to))
    .sort((a, b) => new Date(a.startedAt || a.startsAt) - new Date(b.startedAt || b.startsAt));
};

/** Open tasks first (overdue, then by due date, undated last), done tasks after. */
export const sortTasks = (tasks = []) => [...tasks].sort((a, b) => {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return da - db;
});

/** { label, tone } for a task's due date: tone is 'late' | 'soon' | 'none' | 'ok'. */
export const dueInfo = (task, now = new Date()) => {
  if (!task.dueDate) return { label: 'No due date', tone: 'none' };
  const due = startOfDay(task.dueDate).getTime();
  const today = startOfDay(now).getTime();
  const days = Math.round((due - today) / DAY);
  if (task.done) return { label: 'Done', tone: 'ok' };
  if (days < 0) return { label: days === -1 ? 'Due yesterday' : `${-days} days overdue`, tone: 'late' };
  if (days === 0) return { label: 'Due today', tone: 'soon' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  return { label: `Due in ${days} days`, tone: 'ok' };
};

/**
 * The assistant's work queue: only the areas they have, each with a count and where to go.
 * `input` = { permissions, base, needsGrading, lateCount, unreadChats, liveToday, openTasks }.
 */
export const queueCards = ({ permissions, base, needsGrading = 0, lateCount = 0, unreadChats = 0, liveToday = 0, openTasks = 0 }) => {
  const cards = [{ id: 'tasks', n: openTasks, title: 'Tasks from the teacher', sub: openTasks ? 'Tick them off as you go' : 'Nothing assigned', to: `${base}#tasks` }];
  if (hasLevel(permissions, 'work')) cards.push({ id: 'grading', n: needsGrading, title: 'To grade', sub: lateCount ? `${lateCount} late` : 'All on time', to: `${base}/work/submissions?status=needs` });
  if (hasLevel(permissions, 'inbox')) cards.push({ id: 'chat', n: unreadChats, title: 'Unread messages', sub: 'Students waiting for a reply', to: `${base}/inbox/chat` });
  if (hasLevel(permissions, 'schedule')) cards.push({ id: 'classes', n: liveToday, title: 'Classes today', sub: 'Attendance to mark', to: `${base}/schedule/week` });
  return cards;
};

/** Plain-English line for an audit entry: 'POST /chat/send' -> 'Sent a message'. */
export const describeAction = (e) => {
  const path = e.path || '';
  const verb = { POST: 'Added', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Removed' }[e.method] || e.method;
  const what = [
    [/^\/chat\/send/, 'Sent a message'],
    [/^\/teacher\/(assignments|quizzes)\/[^/]+\/students/, 'Graded a submission'],
    [/^\/teacher\/live\/[^/]+\/attendance/, 'Marked attendance'],
    [/^\/announcements/, `${verb} an announcement`],
    [/^\/teacher\/(videos|notes|materials)/, `${verb} library content`],
    [/^\/teacher\/(schedule|schedules)/, `${verb} the schedule`],
    [/^\/teacher\/groups/, `${verb} student groups`]
  ].find(([re]) => re.test(path));
  const text = what ? what[1] : `${verb} ${path}`;
  return e.allowed === false ? `${text} (blocked)` : text;
};
