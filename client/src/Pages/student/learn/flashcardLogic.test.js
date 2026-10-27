import { groupStacks, parseChapter, phaseOfChapter } from './flashcardLogic';

const stack = (title, extra = {}) => ({ _id: title, title, ...extra });

describe('flashcard grouping', () => {
  it('reads the chapter number and name from the title', () => {
    expect(parseChapter('Chapter 4 – Storage Devices')).toEqual({ number: 4, name: 'Storage Devices' });
    expect(parseChapter('Chapter 12 - ICT Programs')).toEqual({ number: 12, name: 'ICT Programs' });
    expect(parseChapter('My own stack')).toBeNull();
  });

  it('maps chapters to phases 1-4, 5-7 and 8-13', () => {
    expect([1, 4, 5, 7, 8, 13].map(phaseOfChapter)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(phaseOfChapter(14)).toBeNull();
  });

  it('groups by phase in chapter order and puts other stacks last', () => {
    const groups = groupStacks([
      stack('Chapter 10 – Banking Applications'),
      stack('Chapter 2 – Input Devices'),
      stack('Chapter 6 – Networks'),
      stack('Chapter 1 – Computer Structure'),
      stack('Student made this')
    ]);
    expect(groups.map(g => g.label)).toEqual(['Phase 1', 'Phase 2', 'Phase 3', 'More stacks']);
    expect(groups[0].stacks.map(s => s.number)).toEqual([1, 2]);
    expect(groups[3].stacks[0].name).toBe('Student made this');
  });

  it('leaves out phases that have no stacks', () => {
    expect(groupStacks([stack('Chapter 9 – ICT Systems')]).map(g => g.label)).toEqual(['Phase 3']);
    expect(groupStacks([])).toEqual([]);
  });
});

describe('phase decks', () => {
  const { countCards, combinedStack } = require('./flashcardLogic');
  const cards = (n) => Array.from({ length: n }, (_, i) => ({ front: `q${i}`, back: `a${i}` }));
  const groups = groupStacks([
    stack('Chapter 2 – Input Devices', { cards: cards(3) }),
    stack('Chapter 1 – Computer Structure', { cards: cards(2) }),
    stack('Chapter 6 – Networks', { cards: cards(4) })
  ]);

  it('counts the cards in a phase', () => {
    expect(countCards(groups[0].stacks)).toBe(5);
    expect(countCards(groups[1].stacks)).toBe(4);
    expect(countCards([])).toBe(0);
  });

  it('merges a phase into one study stack in chapter order, remembering each card\'s chapter', () => {
    const s = combinedStack(groups[0]);
    expect(s).toMatchObject({ synthetic: true, title: 'Phase 1' });
    expect(s.cards).toHaveLength(5);
    expect(s.cards[0].from).toBe('Chapter 1 · Computer Structure');
    expect(s.cards[4].from).toBe('Chapter 2 · Input Devices');
  });
});
