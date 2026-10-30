import { cleanHtml, getIn, setIn, removeAt, insertAt, moveItem, groupChapters, scoreQuiz, verdict, newBlock, newSection, BLOCK_KINDS, ACTIVITY_TAGS } from './guideLogic';

describe('cleanHtml', () => {
  test('keeps bold, italic and breaks', () => {
    expect(cleanHtml('<b>a</b> <i>b</i><br>c')).toBe('<b>a</b> <i>b</i><br>c');
  });
  test('maps strong and em, drops everything else', () => {
    expect(cleanHtml('<strong>a</strong><em>b</em><span style="x">c</span><script>d</script>')).toBe('<b>a</b><i>b</i>cd');
  });
  test('drops attributes from kept tags and trailing breaks', () => {
    expect(cleanHtml('<b onclick="x">a</b><br><br>')).toBe('<b>a</b>');
  });
  test('turns non-breaking spaces into spaces and leaves comparisons alone', () => {
    expect(cleanHtml('a b 1 < 2')).toBe('a b 1 < 2');
    expect(cleanHtml(null)).toBe('');
  });
});

describe('path updates', () => {
  const doc = { a: [{ x: 1 }, { x: 2 }, { x: 3 }] };
  test('setIn copies along the path and leaves the original alone', () => {
    const next = setIn(doc, ['a', 1, 'x'], 9);
    expect(next.a[1].x).toBe(9);
    expect(doc.a[1].x).toBe(2);
    expect(next.a[0]).toBe(doc.a[0]);
  });
  test('removeAt, insertAt and moveItem change one list', () => {
    expect(getIn(removeAt(doc, ['a'], 0), ['a']).map(o => o.x)).toEqual([2, 3]);
    expect(getIn(insertAt(doc, ['a'], 1, { x: 7 }), ['a']).map(o => o.x)).toEqual([1, 7, 2, 3]);
    expect(getIn(moveItem(doc, ['a'], 0, 2), ['a']).map(o => o.x)).toEqual([2, 3, 1]);
  });
  test('moving past either end does nothing', () => {
    expect(moveItem(doc, ['a'], 0, -1)).toBe(doc);
    expect(moveItem(doc, ['a'], 2, 3)).toBe(doc);
  });
});

describe('groupChapters', () => {
  test('groups by phase and puts unknown chapters in the last group', () => {
    const groups = groupChapters([{ key: '1' }, { key: '5' }, { key: '9' }, { key: 'extra' }]);
    expect(groups.map(g => g.items.map(i => i.ch.key))).toEqual([['1'], ['5'], ['9', 'extra']]);
    expect(groups[2].items[1].index).toBe(3);
  });
});

describe('quiz', () => {
  const quiz = [{ sec: '1.1', c: 1 }, { sec: '1.2', c: 0 }, { sec: '1.2', c: 2 }];
  test('scores and lists sections to revisit once', () => {
    const r = scoreQuiz(quiz, { 0: 1, 1: 3, 2: 0 });
    expect(r).toEqual({ answered: 3, score: 1, missed: ['1.2'], done: true });
  });
  test('is not done until every question is answered', () => {
    expect(scoreQuiz(quiz, { 0: 1 }).done).toBe(false);
  });
  test('verdict follows the score', () => {
    expect(verdict(9, 10)).toMatch(/A\*/);
    expect(verdict(7, 10)).toMatch(/Solid/);
    expect(verdict(2, 10)).toMatch(/Good start/);
  });
});

describe('new content', () => {
  test('every block kind makes a block with an id and its own type', () => {
    BLOCK_KINDS.forEach(k => {
      const b = newBlock(k.t);
      expect(b.t).toBe(k.t);
      expect(b.id).toBeTruthy();
    });
  });
  test('every practical activity has an element tag', () => {
    BLOCK_KINDS.filter(k => k.group === 'Practical activities').forEach(k => expect(ACTIVITY_TAGS[k.t]).toBeTruthy());
  });
  test('a new section is numbered after the last one', () => {
    const s = newSection({ n: '4', secs: [{}, {}] });
    expect(s.num).toBe('4.3');
    expect(s.blocks).toHaveLength(1);
  });
});
