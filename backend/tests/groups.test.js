const { normalize, withDefaults, splitAlphabetical, smallestGroup, resolveLiveLink, autoRoomUrl, codeAt } = require('../validators/groups');

const people = (...names) => names.map(n => { const [firstName, lastName = ''] = n.split(' '); return { firstName, lastName, id: n }; });

describe('splitAlphabetical', () => {
  it('sorts by name and fills the groups in order with near-equal sizes', () => {
    const groups = splitAlphabetical(people('Zeina A', 'Omar B', 'Ahmad C', 'Mona D', 'Bola E', 'Yara F', 'Hana G'), 3);
    expect(groups.map(g => g.length)).toEqual([3, 2, 2]);
    expect(groups[0].map(s => s.firstName)).toEqual(['Ahmad', 'Bola', 'Hana']);
    expect(groups[2].map(s => s.firstName)).toEqual(['Yara', 'Zeina']);
  });

  it('is not case sensitive and copes with more groups than students', () => {
    const groups = splitAlphabetical(people('bola X', 'Ahmad Y'), 4);
    expect(groups.map(g => g.length)).toEqual([1, 1, 0, 0]);
    expect(groups[0][0].firstName).toBe('Ahmad');
  });

  it('never mutates its input', () => {
    const list = people('B X', 'A Y');
    splitAlphabetical(list, 2);
    expect(list[0].firstName).toBe('B');
  });
});

describe('group definitions', () => {
  it('labels groups GRP A, GRP B…', () => {
    expect(codeAt(0)).toBe('A');
    const { value } = normalize({ groups: [{ code: 'a' }, { code: 'b', name: ' Evening ' }] }, undefined);
    expect(value.groups).toEqual([{ code: 'A', name: 'GRP A', meetingUrl: '' }, { code: 'B', name: 'Evening', meetingUrl: '' }]);
  });

  it('rejects duplicate codes, bad codes and bad meeting links', () => {
    const paths = normalize({ groups: [{ code: 'A' }, { code: 'a' }, { code: '??' }, { code: 'C', meetingUrl: 'javascript:alert(1)' }] }, undefined).errors.map(e => e.path);
    expect(paths).toEqual(expect.arrayContaining(['groups.1.code', 'groups.2.code', 'groups.3.meetingUrl']));
  });

  it('will not remove a group that still has students', () => {
    const current = { groups: [{ code: 'A' }, { code: 'B' }] };
    const blocked = normalize({ groups: [{ code: 'A' }] }, current, { B: 4 });
    expect(blocked.errors[0].code).toBe('GROUP_NOT_EMPTY');
    expect(normalize({ groups: [{ code: 'A' }] }, current, { B: 0 }).errors).toEqual([]);
  });

  it('keeps unrelated settings when only some are sent', () => {
    const current = { groups: [{ code: 'A', name: 'GRP A', meetingUrl: 'https://meet.google.com/abc' }], live: { mode: 'preset', url: 'https://meet.google.com/xyz' } };
    const { value } = normalize({ autoAssign: false }, current);
    expect(value.groups[0].meetingUrl).toBe('https://meet.google.com/abc');
    expect(value.live).toEqual({ mode: 'preset', url: 'https://meet.google.com/xyz' });
    expect(value.autoAssign).toBe(false);
  });

  it('needs a saved link for preset mode', () => {
    expect(normalize({ live: { mode: 'preset', url: '' } }, undefined).errors[0].path).toBe('live.url');
    expect(normalize({ live: { mode: 'preset', url: 'https://meet.google.com/abc-defg-hij' } }, undefined).errors).toEqual([]);
    expect(normalize({ live: { mode: 'nope' } }, undefined).errors[0].path).toBe('live.mode');
  });

  it('has sensible defaults', () => {
    expect(withDefaults(undefined)).toEqual({ groups: [], live: { mode: 'manual', url: '' }, autoAssign: true });
  });
});

describe('smallestGroup', () => {
  it('picks the group with the fewest students, first on a tie', () => {
    const groups = [{ code: 'A' }, { code: 'B' }, { code: 'C' }];
    expect(smallestGroup(groups, { A: 5, B: 3, C: 3 })).toBe('B');
    expect(smallestGroup(groups, {})).toBe('A');
    expect(smallestGroup([], {})).toBeNull();
  });
});

describe('live class links', () => {
  const config = {
    groups: [{ code: 'A', name: 'GRP A', meetingUrl: 'https://meet.google.com/aaa' }, { code: 'B', name: 'GRP B', meetingUrl: '' }],
    live: { mode: 'preset', url: 'https://meet.google.com/default' }
  };

  it('uses what was typed in manual mode', () => {
    expect(resolveLiveLink({ mode: 'manual', manualUrl: 'https://zoom.us/j/1', config }).url).toBe('https://zoom.us/j/1');
    expect(resolveLiveLink({ mode: 'manual', manualUrl: 'zoom', config }).error).toMatch(/https/);
  });

  it("uses the group's own link, then the saved default", () => {
    expect(resolveLiveLink({ mode: 'preset', groupCodes: ['A'], config }).url).toBe('https://meet.google.com/aaa');
    expect(resolveLiveLink({ mode: 'preset', groupCodes: ['B'], config }).url).toBe('https://meet.google.com/default');
    expect(resolveLiveLink({ mode: 'preset', groupCodes: [], config }).url).toBe('https://meet.google.com/default');
  });

  it('reports a missing preset instead of saving an empty link', () => {
    expect(resolveLiveLink({ mode: 'preset', groupCodes: ['B'], config: { groups: [], live: { mode: 'preset', url: '' } } }).error).toMatch(/No saved meeting link/);
  });

  it('makes a fresh, different room each time in auto mode', () => {
    const a = resolveLiveLink({ mode: 'auto', groupCodes: ['A'], config });
    const b = resolveLiveLink({ mode: 'auto', groupCodes: ['A'], config });
    expect(a.url).toMatch(/^https:\/\/meet\.jit\.si\/ATICT-A-[0-9a-f]{10}$/);
    expect(a.url).not.toBe(b.url);
    expect(autoRoomUrl([], 'abc')).toBe('https://meet.jit.si/ATICT-ALL-abc');
  });
});
