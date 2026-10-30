import { applyOverrides, collectTexts } from './activityText';

const tree = () => {
  const root = document.createElement('div');
  root.innerHTML = '<style>.a{color:red}</style><h3>Circuit board</h3><p>Key is pressed</p><button>Replay</button><span>1</span>';
  return root;
};

describe('activity text overrides', () => {
  test('lists the distinct visible strings, not styles or single characters', () => {
    expect(collectTexts(tree())).toEqual(['Circuit board', 'Key is pressed', 'Replay']);
  });

  test('replaces matching text and keeps the surrounding spacing', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p> Key is pressed </p>';
    applyOverrides(root, { 'Key is pressed': 'A key goes down' });
    expect(root.textContent).toBe(' A key goes down ');
  });

  test('still lists the original wording after it has been replaced', () => {
    const root = tree();
    applyOverrides(root, { Replay: 'Play again' });
    expect(root.querySelector('button').textContent).toBe('Play again');
    expect(collectTexts(root)).toContain('Replay');
  });

  test('restores the original when the override is removed', () => {
    const root = tree();
    applyOverrides(root, { Replay: 'Play again' });
    applyOverrides(root, {});
    expect(root.querySelector('button').textContent).toBe('Replay');
  });

  test('leaves text alone that the activity rewrote itself', () => {
    const root = tree();
    applyOverrides(root, { Replay: 'Play again' });
    root.querySelector('button').firstChild.nodeValue = 'Stop';
    applyOverrides(root, { Replay: 'Play again' });
    expect(root.querySelector('button').textContent).toBe('Stop');
  });
});
