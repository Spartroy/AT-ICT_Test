import { APPS, GUIDES } from './practicalSkills';
import { GUIDE_BY_ID, SKILL_BY_ID, XP_GUIDE, XP_SKILL, appStats, levelOf, newlyUnlocked, overall, rankFor, skillState, skillsOfGuide } from './skillTreeLogic';

describe('the practical skill catalogue', () => {
  test('has the five applications, 33 guides and every skill of the checker', () => {
    expect(APPS.map(a => a.id)).toEqual(['word', 'powerpoint', 'access', 'excel', 'sharepoint']);
    expect(GUIDES).toHaveLength(33);
    expect(SKILL_BY_ID.size).toBe(274);
  });

  test('every guide a skill points at exists, and skill ids are unique', () => {
    SKILL_BY_ID.forEach(s => s.guides.forEach(g => expect(GUIDE_BY_ID.has(g)).toBe(true)));
    const ids = APPS.flatMap(a => a.categories.flatMap(c => c.skills.map(s => s.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('a skill only lists guides of its own application', () => {
    SKILL_BY_ID.forEach(s => s.guides.forEach(g => expect(GUIDE_BY_ID.get(g).app).toBe(s.app)));
  });
});

describe('growing the tree', () => {
  const bold = SKILL_BY_ID.get('word.font.bold');
  const bonus = SKILL_BY_ID.get('word.font.underline');

  test('a skill is locked until a guide that teaches it is finished, then open, then mastered', () => {
    expect(bold.guides.length).toBeGreaterThan(0);
    expect(skillState(bold, new Set(), new Set())).toBe('locked');
    expect(skillState(bold, new Set([bold.guides[0]]), new Set())).toBe('open');
    expect(skillState(bold, new Set(), new Set([bold.id]))).toBe('mastered');
  });

  test('skills no guide covers are open from the start', () => {
    expect(bonus.guides).toHaveLength(0);
    expect(skillState(bonus, new Set(), new Set())).toBe('open');
  });

  test('XP, percent and rank follow what is done', () => {
    const word = APPS[0];
    const none = appStats(word, new Set(), new Set());
    expect(none).toMatchObject({ mastered: 0, xp: 0, percent: 0 });
    expect(none.locked).toBeGreaterThan(0);
    const some = appStats(word, new Set(['word-cg1']), new Set([bold.id]));
    expect(some.xp).toBe(XP_GUIDE + XP_SKILL);
    expect(some.guidesDone).toBe(1);
    expect(rankFor(0).name).toBe('Rookie');
    expect(rankFor(80).name).toBe('Expert');
    expect(rankFor(100).name).toBe('Grandmaster');
  });

  test('levels need more XP each time', () => {
    expect(levelOf(0)).toMatchObject({ level: 1, need: 100 });
    expect(levelOf(100)).toMatchObject({ level: 2, need: 200, into: 0 });
    expect(levelOf(250)).toMatchObject({ level: 2, into: 150 });
    expect(levelOf(350)).toMatchObject({ level: 3, into: 50 });
    expect(overall(new Set(['word-cg1', 'excel-cg1']), new Set()).xp).toBe(2 * XP_GUIDE);
  });

  test('finishing a guide unlocks only the skills no other finished guide already opened', () => {
    const cg1 = skillsOfGuide('word-cg1');
    expect(cg1.length).toBeGreaterThan(0);
    expect(newlyUnlocked('word-cg1', new Set())).toBe(cg1.length);
    expect(newlyUnlocked('word-cg1', new Set(['word-cg2']))).toBeLessThan(cg1.length);
  });
});

describe('drawing a branch as a tree', () => {
  const { layoutTree, labelLines } = require('./skillTreeLogic');
  test('puts 1, 2, 3, 3 ... skills on each tier and gives every skill but the root a parent', () => {
    const t = layoutTree(11);
    expect(t.nodes).toHaveLength(11);
    expect([0, 1, 2, 3, 4].map(k => t.nodes.filter(n => n.tier === k).length)).toEqual([1, 2, 3, 3, 2]);
    const children = new Set(t.edges.map(e => e[1]));
    t.nodes.slice(1).forEach(n => expect(children.has(n.i)).toBe(true));
    t.edges.forEach(([p, c]) => expect(t.nodes[p].tier).toBe(t.nodes[c].tier - 1));
  });

  test('copes with tiny and empty branches', () => {
    expect(layoutTree(1).nodes).toHaveLength(1);
    expect(layoutTree(2).edges).toHaveLength(1);
    expect(layoutTree(0)).toMatchObject({ nodes: [], edges: [], height: 0 });
  });

  test('every real branch lays out inside the frame', () => {
    APPS.forEach(a => a.categories.forEach(c => layoutTree(c.skills.length).nodes.forEach(n => { expect(n.x).toBeGreaterThan(0); expect(n.x).toBeLessThan(360); })));
  });

  test('names wrap to short lines', () => {
    expect(labelLines('Header & Footer — Include Path')).toEqual(['Header & Footer', '— Include Path']);
    expect(labelLines('Bold')).toEqual(['Bold']);
    expect(labelLines('A very long skill name that keeps going on and on and on forever', 12)).toHaveLength(3);
  });
});
