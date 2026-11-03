import { describeAction, dueInfo, queueCards, sortTasks, todaysSessions } from './dashboardLogic';

const NOW = new Date('2026-11-03T10:00:00');

describe('todaysSessions', () => {
  it('keeps live classes and classes starting today, soonest first, and drops ended ones', () => {
    const list = [
      { id: 'late', status: 'scheduled', startsAt: '2026-11-03T18:00:00' },
      { id: 'tomorrow', status: 'scheduled', startsAt: '2026-11-04T09:00:00' },
      { id: 'early', status: 'scheduled', startsAt: '2026-11-03T08:00:00' },
      { id: 'ended', status: 'ended', startsAt: '2026-11-03T07:00:00' },
      { id: 'live', status: 'live', startsAt: '2026-11-02T23:00:00', startedAt: '2026-11-03T09:30:00' }
    ];
    expect(todaysSessions(list, NOW).map(s => s.id)).toEqual(['early', 'live', 'late']);
  });
});

describe('sortTasks and dueInfo', () => {
  const t = (id, dueDate, done = false) => ({ id, dueDate, done });
  it('puts overdue before later, undated after dated, and done last', () => {
    const out = sortTasks([t('none', null), t('done', '2026-11-01', true), t('later', '2026-11-09'), t('over', '2026-11-01')]);
    expect(out.map(x => x.id)).toEqual(['over', 'later', 'none', 'done']);
  });

  it('describes the due date', () => {
    expect(dueInfo(t('a', '2026-11-03'), NOW)).toEqual({ label: 'Due today', tone: 'soon' });
    expect(dueInfo(t('a', '2026-11-04'), NOW).label).toBe('Due tomorrow');
    expect(dueInfo(t('a', '2026-11-01'), NOW)).toEqual({ label: '2 days overdue', tone: 'late' });
    expect(dueInfo(t('a', '2026-11-10'), NOW).label).toBe('Due in 7 days');
    expect(dueInfo(t('a', null), NOW).tone).toBe('none');
    expect(dueInfo(t('a', '2026-11-01', true), NOW).tone).toBe('ok');
  });
});

describe('queueCards', () => {
  const base = '/assistant-dashboard';
  it('always has tasks, and adds a card only for areas the assistant has', () => {
    const ids = (permissions) => queueCards({ permissions, base }).map(c => c.id);
    expect(ids({})).toEqual(['tasks']);
    expect(ids({ submissions: 'view', chat: 'edit' })).toEqual(['tasks', 'grading', 'chat']);
    expect(ids({ live: 'view', groups: 'edit' })).toEqual(['tasks', 'classes']);
    expect(ids({ homework: 'edit', classSchedule: 'edit' })).toEqual(['tasks']); // no queue for tabs without a to-do count
  });

  it('carries the counts and links into the right page', () => {
    const cards = queueCards({ permissions: { submissions: 'view' }, base, needsGrading: 4, lateCount: 1 });
    expect(cards[1]).toMatchObject({ n: 4, sub: '1 late', to: `${base}/work/submissions?status=needs` });
  });
});

describe('describeAction', () => {
  it('turns audit entries into plain sentences', () => {
    expect(describeAction({ method: 'POST', path: '/chat/send', allowed: true })).toBe('Sent a message');
    expect(describeAction({ method: 'PUT', path: '/teacher/assignments/a/students/s', allowed: true })).toBe('Graded a submission');
    expect(describeAction({ method: 'DELETE', path: '/teacher/videos/v1', allowed: false })).toBe('Removed library content (blocked)');
    expect(describeAction({ method: 'POST', path: '/other', allowed: true })).toBe('Added /other');
  });
});
