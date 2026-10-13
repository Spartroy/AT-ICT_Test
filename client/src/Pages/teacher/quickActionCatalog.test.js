import { DEFAULT_QUICK_ACTIONS, QUICK_ACTION_CATALOG, moveItem, resolveQuickActions } from './quickActionCatalog';

describe('resolveQuickActions', () => {
  it('uses the default list when nothing is saved', () => {
    expect(resolveQuickActions(null).map(a => a.id)).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(resolveQuickActions([]).map(a => a.id)).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('keeps the saved order and skips unknown ids', () => {
    expect(resolveQuickActions(['quiz', 'gone', 'hw']).map(a => a.id)).toEqual(['quiz', 'hw']);
  });

  it('falls back to the default when every saved id is unknown', () => {
    expect(resolveQuickActions(['x', 'y']).map(a => a.id)).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('only offers actions that open a dialog or go somewhere', () => {
    QUICK_ACTION_CATALOG.forEach(a => expect(Boolean(a.modal) !== Boolean(a.to)).toBe(true));
  });
});

describe('moveItem', () => {
  it('swaps with the neighbour and stops at the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});
