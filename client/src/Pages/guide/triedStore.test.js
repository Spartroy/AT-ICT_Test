import { chapterActivities, sectionActivities } from './guideLogic';
import { markTried } from './triedStore';

describe('activities', () => {
  const ch = { secs: [{ blocks: [{ id: 'a', t: 'def' }, { id: 'b', t: 'router' }] }, { blocks: [{ id: 'c', t: 'wifi' }] }] };
  test('finds the practical activities of a section and a chapter', () => {
    expect(sectionActivities(ch.secs[0]).map(b => b.id)).toEqual(['b']);
    expect(chapterActivities(ch).map(b => b.id)).toEqual(['b', 'c']);
  });
  test('remembers tried activities on this device', () => {
    markTried('b');
    markTried('b');
    expect(JSON.parse(localStorage.getItem('atict.guide.tried'))).toEqual(['b']);
  });
});
