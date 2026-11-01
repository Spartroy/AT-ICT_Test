import { ASSISTANT_BASE, DEFAULT_PERMISSIONS, assistantNavItems, hasLevel, hasNoAccess, levelLabel, normalizePermissions, visibleAreas } from './access';

describe('hasLevel', () => {
  it('orders none < view < edit', () => {
    expect(hasLevel({ work: 'edit' }, 'work', 'view')).toBe(true);
    expect(hasLevel({ work: 'edit' }, 'work', 'edit')).toBe(true);
    expect(hasLevel({ work: 'view' }, 'work', 'edit')).toBe(false);
    expect(hasLevel({ work: 'none' }, 'work', 'view')).toBe(false);
  });

  it('treats missing permissions as no access', () => {
    expect(hasLevel(undefined, 'work')).toBe(false);
    expect(hasLevel({}, 'work')).toBe(false);
  });
});

describe('normalizePermissions', () => {
  it('returns every area and ignores bad values', () => {
    expect(normalizePermissions({ work: 'edit', library: 'root', students: 'view' })).toEqual({
      students: 'view', work: 'edit', library: 'none', schedule: 'none', inbox: 'none'
    });
    expect(normalizePermissions(null)).toEqual({ students: 'none', work: 'none', library: 'none', schedule: 'none', inbox: 'none' });
  });
});

describe('assistantNavItems', () => {
  it('always starts with Home and only lists areas with view access', () => {
    const items = assistantNavItems({ students: 'view', work: 'edit', library: 'none', schedule: 'none', inbox: 'view' });
    expect(items.map(i => i.label)).toEqual(['Home', 'Students', 'Work', 'Inbox']);
    expect(items[0]).toMatchObject({ to: ASSISTANT_BASE, end: true });
    expect(items[2].to).toBe(`${ASSISTANT_BASE}/work`);
  });

  it('never offers Income or Settings, whatever the permissions', () => {
    const all = { students: 'edit', work: 'edit', library: 'edit', schedule: 'edit', inbox: 'edit', income: 'edit', settings: 'edit' };
    const labels = assistantNavItems(all).map(i => i.label);
    expect(labels).not.toContain('Income');
    expect(labels).not.toContain('Settings');
  });

  it('shows just Home when nothing is granted', () => {
    expect(assistantNavItems({}).map(i => i.label)).toEqual(['Home']);
    expect(hasNoAccess({})).toBe(true);
    expect(hasNoAccess(DEFAULT_PERMISSIONS)).toBe(false);
  });
});

describe('visibleAreas and levelLabel', () => {
  it('lists granted areas in nav order', () => {
    expect(visibleAreas({ inbox: 'view', students: 'edit' }).map(a => a.id)).toEqual(['students', 'inbox']);
  });

  it('labels levels for chips', () => {
    expect(levelLabel('edit')).toBe('Can edit');
    expect(levelLabel('view')).toBe('View only');
    expect(levelLabel('none')).toBe('No access');
  });
});
