const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
const { importChapterStacks } = require('../controllers/flashcardController');
const stacks = require('../data/chapterFlashcards.json');
const { cardsForBlock, clean } = require('../scripts/buildChapterFlashcards');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('chapter flashcard data', () => {
  it('has one stack for each of the 13 chapters', () => {
    expect(stacks).toHaveLength(13);
    expect(stacks.map(s => s.title.match(/^Chapter (\d+) – /)?.[1])).toEqual(Array.from({ length: 13 }, (_, i) => String(i + 1)));
    expect(stacks[4].title).toBe('Chapter 5 – Databases');
    expect(stacks[5].title).toBe('Chapter 6 – Networks');
  });

  it('has no "Exam tip" or "Common mistake" cards', () => {
    stacks.forEach(s => s.cards.forEach(c => expect(`${c.front}
${c.back}`).not.toMatch(/exam tip|common mistake/i)));
  });

  it('keeps every card within the model limits and free of HTML', () => {
    stacks.forEach((s) => {
      expect(s.cards.length).toBeGreaterThan(10);
      s.cards.forEach((c) => {
        expect(c.front.length).toBeGreaterThan(0);
        expect(c.back.length).toBeGreaterThan(0);
        expect(c.front.length).toBeLessThanOrEqual(1000);
        expect(c.back.length).toBeLessThanOrEqual(1000);
        expect(`${c.front}${c.back}`).not.toMatch(/<[a-z/]/i);
      });
    });
  });
});

describe('cardsForBlock', () => {
  const sec = { title: 'Storage' };

  it('turns a definition into a "Define" card with the HTML removed', () => {
    expect(cardsForBlock({ t: 'def', l: 'RAM', h: 'Memory that is <b>volatile</b> &amp; fast.' }, sec))
      .toEqual([{ front: 'Define: RAM', back: 'Memory that is volatile & fast.' }]);
  });

  it('makes one card per row for feature tables and one card for two-column comparisons', () => {
    const feature = { t: 'table', title: 'RAM vs ROM', head: ['Feature', 'RAM', 'ROM'], rows: [['Volatility', 'Volatile', 'Non-volatile'], ['Access', 'Read/write', 'Read only']] };
    expect(cardsForBlock(feature, sec)).toHaveLength(2);
    expect(cardsForBlock(feature, sec)[0]).toEqual({ front: 'RAM vs ROM: Volatility', back: 'RAM: Volatile\nROM: Non-volatile' });
    const compare = { t: 'table', title: 'Main vs backing', head: ['Main', 'Backing'], rows: [['Faster', 'Slower'], ['Smaller', 'Larger']] };
    expect(cardsForBlock(compare, sec)).toHaveLength(1);
  });

  it('keeps the advantages and disadvantages of each tab', () => {
    const [card] = cardsForBlock({ t: 'tabs', tabs: [{ n: 'SSD', d: 'Solid state.', p: ['Fast'], c: ['Costly'] }] }, sec);
    expect(card.front).toBe('Storage: SSD');
    expect(card.back).toContain('Advantages:\n• Fast');
    expect(card.back).toContain('Disadvantages:\n• Costly');
  });

  it('ignores block types it does not know', () => {
    expect(cardsForBlock({ t: 'mystery' }, sec)).toEqual([]);
    expect(clean('<i>a</i>')).toBe('a');
  });
});

describe('importChapterStacks', () => {
  const teacher = { _id: 't1', firstName: 'Ahmad', lastName: 'Tamer', role: 'teacher' };
  const doc = (stack, extra = {}) => ({
    title: stack.title,
    description: stack.description,
    cards: stack.cards.map((c, order) => ({ ...c, order })),
    save: jest.fn().mockResolvedValue(undefined),
    ...extra
  });

  it('creates missing stacks and refreshes the ones whose cards changed', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(teacher);
    const same = doc(stacks[0]);
    const old = doc(stacks[1], { cards: [{ front: 'Exam tip: old', back: 'x', order: 0 }] });
    jest.spyOn(Flashcard, 'find').mockResolvedValue([same, old]);
    const create = jest.spyOn(Flashcard, 'create').mockResolvedValue({});
    const res = mockRes();

    await importChapterStacks({ user: { id: 't1' } }, res);

    expect(create).toHaveBeenCalledTimes(11);
    expect(create.mock.calls[0][0]).toMatchObject({ isTeacherStack: true, isPublic: true, creatorRole: 'teacher', createdBy: 't1', category: 'technology' });
    expect(same.save).not.toHaveBeenCalled();
    expect(old.save).toHaveBeenCalledTimes(1);
    expect(old.cards).toHaveLength(stacks[1].cards.length);
    expect(res.json.mock.calls[0][0].data).toEqual({ created: 11, updated: 1, unchanged: 1, total: 13 });
  });

  it('does nothing when everything is already up to date', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(teacher);
    jest.spyOn(Flashcard, 'find').mockResolvedValue(stacks.map(s => doc(s)));
    const create = jest.spyOn(Flashcard, 'create');
    const res = mockRes();

    await importChapterStacks({ user: { id: 't1' } }, res);

    expect(create).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data).toMatchObject({ created: 0, updated: 0, unchanged: 13 });
  });
});
