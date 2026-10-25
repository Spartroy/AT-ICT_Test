import { groupColor, groupLabel, nextGroupCode } from './groups';

describe('groups helpers', () => {
  it('gives each group a stable colour', () => {
    expect(groupColor('A')).toBe(groupColor('a'));
    expect(groupColor('A')).not.toBe(groupColor('B'));
    expect(groupColor(undefined)).toBe(groupColor('A'));
  });

  it("labels a group with the teacher's name, or GRP + code", () => {
    expect(groupLabel('A', [{ code: 'A', name: 'Evening class' }])).toBe('Evening class');
    expect(groupLabel('C', [])).toBe('GRP C');
    expect(groupLabel(null)).toBe('No group');
  });

  it('suggests the next free letter', () => {
    expect(nextGroupCode([])).toBe('A');
    expect(nextGroupCode([{ code: 'A' }, { code: 'C' }])).toBe('B');
    expect(nextGroupCode(Array.from({ length: 26 }, (_, i) => ({ code: String.fromCharCode(65 + i) })))).toBe('');
  });
});
