import { ASSISTANT_BASE, DEFAULT_PERMISSIONS, FEATURES, assistantNavItems, firstTab, hasLevel, hasNoAccess, levelLabel, normalizePermissions, visibleAreas } from './access';

describe('hasLevel', () => {
  it('orders none < view < edit for a feature', () => {
    expect(hasLevel({ homework: 'edit' }, 'homework', 'view')).toBe(true);
    expect(hasLevel({ homework: 'edit' }, 'homework', 'edit')).toBe(true);
    expect(hasLevel({ homework: 'view' }, 'homework', 'edit')).toBe(false);
    expect(hasLevel({ homework: 'none' }, 'homework', 'view')).toBe(false);
  });

  it('treats a section as open when any feature in it is', () => {
    expect(hasLevel({ quizzes: 'view' }, 'work')).toBe(true);
    expect(hasLevel({ quizzes: 'view' }, 'work', 'edit')).toBe(false);
    expect(hasLevel({ quizzes: 'view' }, 'library')).toBe(false);
  });

  it('treats missing permissions as no access', () => {
    expect(hasLevel(undefined, 'homework')).toBe(false);
    expect(hasLevel({}, 'work')).toBe(false);
  });
});

describe('normalizePermissions', () => {
  it('returns every feature and ignores bad values', () => {
    const p = normalizePermissions({ homework: 'edit', videos: 'root', studentList: 'view', payments: 'edit' });
    expect(Object.keys(p).sort()).toEqual(FEATURES.map(f => f.id).sort());
    expect(p).toMatchObject({ homework: 'edit', videos: 'none', studentList: 'view', quizzes: 'none' });
    expect(p.payments).toBeUndefined();
  });

  it('lets an older section-wide level fill in features not set on their own', () => {
    expect(normalizePermissions({ work: 'view', quizzes: 'edit' })).toMatchObject({ submissions: 'view', homework: 'view', quizzes: 'edit' });
  });
});

describe('assistantNavItems', () => {
  it('always starts with Home and only lists sections with something viewable', () => {
    const items = assistantNavItems({ studentList: 'view', quizzes: 'edit', chat: 'view', videos: 'none' });
    expect(items.map(i => i.label)).toEqual(['Home', 'Students', 'Work', 'Inbox']);
    expect(items[0]).toMatchObject({ to: ASSISTANT_BASE, end: true });
    expect(items[2].to).toBe(`${ASSISTANT_BASE}/work`);
  });

  it('never offers Income or Settings, whatever the permissions', () => {
    const all = Object.fromEntries(FEATURES.map(f => [f.id, 'edit']));
    const labels = assistantNavItems({ ...all, income: 'edit', settings: 'edit' }).map(i => i.label);
    expect(labels).toEqual(['Home', 'Students', 'Work', 'Library', 'Schedule', 'Inbox']);
  });

  it('shows just Home when nothing is granted', () => {
    expect(assistantNavItems({}).map(i => i.label)).toEqual(['Home']);
    expect(hasNoAccess({})).toBe(true);
    expect(hasNoAccess(DEFAULT_PERMISSIONS)).toBe(false);
  });
});

describe('firstTab', () => {
  const tabs = [['submissions', 'submissions'], ['assignments', 'homework'], ['quizzes', 'quizzes']];
  it('picks the first tab the assistant may open', () => {
    expect(firstTab({ homework: 'view', quizzes: 'view' }, tabs)).toBe('assignments');
    expect(firstTab({ quizzes: 'edit' }, tabs)).toBe('quizzes');
    expect(firstTab({}, tabs)).toBeNull();
  });
});

describe('visibleAreas and levelLabel', () => {
  it('lists granted sections in nav order', () => {
    expect(visibleAreas({ chat: 'view', groups: 'edit' }).map(a => a.id)).toEqual(['students', 'inbox']);
  });

  it('labels levels for chips', () => {
    expect(levelLabel('edit')).toBe('Can edit');
    expect(levelLabel('view')).toBe('View only');
    expect(levelLabel('none')).toBe('No access');
  });
});
