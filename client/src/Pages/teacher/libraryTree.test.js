import { buildTree, inPath, highlight } from './libraryTree';

const items = [
  { path: ['Theory', 'Phase 1', 'Chapter 1'] },
  { path: ['Theory', 'Phase 1', 'Chapter 2'] },
  { path: ['Theory', 'Phase 2', 'Chapter 1'] },
  { path: ['Practical', 'Microsoft Excel'] },
  { path: ['Other'] }
];
const labels = (nodes) => nodes.map(n => `${n.level}:${n.label}:${n.count}`);

it('shows two levels until a phase is chosen', () => {
  expect(labels(buildTree(items, []))).toEqual(['1:Theory:3', '2:Phase 1:2', '2:Phase 2:1', '1:Practical:1', '2:Microsoft Excel:1', '1:Other:1']);
});

it('reveals chapters under the selected phase only', () => {
  const nodes = buildTree(items, ['Theory', 'Phase 1']);
  expect(labels(nodes)).toContain('3:Chapter 1:1');
  expect(labels(nodes)).toContain('3:Chapter 2:1');
  expect(nodes.filter(n => n.level === 3)).toHaveLength(2);
  expect(nodes.find(n => n.selected).label).toBe('Phase 1');
});

it('keeps sibling chapters visible when a chapter is selected', () => {
  expect(buildTree(items, ['Theory', 'Phase 1', 'Chapter 2']).filter(n => n.level === 3)).toHaveLength(2);
});

it('matches path prefixes', () => {
  expect(inPath(['Theory', 'Phase 1', 'Chapter 1'], ['Theory'])).toBe(true);
  expect(inPath(['Practical'], ['Theory'])).toBe(false);
  expect(inPath(['Other'], [])).toBe(true);
});

it('escapes HTML and highlights matches', () => {
  expect(highlight('CH 6 <Networks>', 'net')).toBe('CH 6 &lt;<mark>Net</mark>works&gt;');
  expect(highlight('a.b', '.')).toBe('a<mark>.</mark>b');
});

it('sorts sections, phases and chapters naturally', () => {
  const { sortByPath } = require('./libraryTree');
  const sorted = sortByPath([
    { title: 'b', path: ['Other'] },
    { title: 'x', path: ['Theory', 'Phase 2', 'Chapter 10'] },
    { title: 'y', path: ['Theory', 'Phase 2', 'Chapter 2'] },
    { title: 'z', path: ['Practical', 'Microsoft Word'] },
    { title: 'w', path: ['Theory', 'Phase 1', 'Chapter 1'] }
  ]).map(i => i.title);
  expect(sorted).toEqual(['w', 'y', 'x', 'z', 'b']);
});
