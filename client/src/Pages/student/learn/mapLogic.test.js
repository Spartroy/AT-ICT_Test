import { buildVideoGroups, nodeStates, doneCount, defaultOpenGroup, serpentineRows, chapterInfo, twoLines, orbitPositions } from './mapLogic';

const v = (id, title, extra = {}) => ({ _id: id, title, videoUrl: `https://drive/${id}`, ...extra });

describe('buildVideoGroups', () => {
  const groups = buildVideoGroups({
    theory: { phase1: [v('b', 'CH 2', { chapter: 2 }), v('a', 'CH 1', { chapter: 1 })], phase2: [], phase3: [] },
    practical: { excel: { guides: [v('g2', 'Guide 2', { order: 2 }), v('g1', 'Guide 1', { order: 1 })], tasks: [v('t1', 'Task 1', { order: 1 })] } },
    other: [v('o1', 'The Grand Revision')]
  });

  it('orders theory lessons by chapter inside each phase', () => {
    expect(groups.theory.map(g => g.title)).toEqual(['Phase 1', 'Phase 2', 'Phase 3']);
    expect(groups.theory[0].items.map(i => i.id)).toEqual(['a', 'b']);
    expect(groups.theory[0].sub).toBe('2 lessons');
  });

  it('lists every program, guides before tasks', () => {
    expect(groups.practical).toHaveLength(5);
    const excel = groups.practical.find(g => g.key === 'excel');
    expect(excel.items.map(i => i.id)).toEqual(['g1', 'g2', 't1']);
    expect(excel.sub).toBe('2 guides · 1 task');
    expect(groups.practical.find(g => g.key === 'word').sub).toBe('No videos yet');
  });

  it('puts "other" videos in the Valuable revisions group', () => {
    expect(groups.other[0]).toMatchObject({ title: 'Valuable revisions', items: [{ id: 'o1' }] });
  });
});

describe('map progress', () => {
  const items = ['a', 'b', 'c', 'd'].map(id => ({ id }));

  it('marks the first unfinished item as current', () => {
    expect(nodeStates(items, ['a', 'b']).map(i => i.state)).toEqual(['done', 'done', 'cur', 'open']);
  });

  it('keeps later items done even when an earlier one is not', () => {
    expect(nodeStates(items, new Set(['a', 'c'])).map(i => i.state)).toEqual(['done', 'cur', 'done', 'open']);
  });

  it('has no current node once everything is done', () => {
    expect(nodeStates(items, ['a', 'b', 'c', 'd']).every(i => i.state === 'done')).toBe(true);
    expect(doneCount(items, ['a', 'x'])).toBe(1);
  });

  it('opens the first group with unfinished lessons by default', () => {
    const groups = [{ items: [{ id: 'a' }] }, { items: [] }, { items: [{ id: 'b' }, { id: 'c' }] }];
    expect(defaultOpenGroup(groups, ['a'])).toBe(2);
    expect(defaultOpenGroup(groups, ['a', 'b', 'c'])).toBe(0);
  });
});

describe('serpentineRows', () => {
  it('snakes rows and flags rows that continue', () => {
    const rows = serpentineRows([1, 2, 3, 4, 5, 6, 7], 3);
    expect(rows.map(r => r.items)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(rows.map(r => r.reverse)).toEqual([false, true, false]);
    expect(rows.map(r => r.more)).toEqual([true, true, false]);
    expect(rows.map(r => r.start)).toEqual([0, 3, 6]);
  });
});

describe('notes orbit helpers', () => {
  it('reads the chapter from the field or the title', () => {
    expect(chapterInfo({ title: 'CH 6 Networks' })).toEqual({ num: '6', title: 'Networks' });
    expect(chapterInfo({ title: 'Malware Attacks', chapter: 7 })).toEqual({ num: '7', title: 'Malware Attacks' });
  });

  it('balances titles over two lines', () => {
    expect(twoLines('Banking applications')).toEqual(['Banking', 'applications']);
    expect(twoLines('Computer Structure Basics')).toEqual(['Computer', 'Structure Basics']);
    expect(twoLines('SDLC')).toEqual(['SDLC']);
  });

  it('places the first chapter at 12 o\'clock', () => {
    expect(orbitPositions(4, 100)).toEqual([{ x: 0, y: -100 }, { x: 100, y: 0 }, { x: 0, y: 100 }, { x: -100, y: 0 }]);
  });
});
