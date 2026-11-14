jest.mock('../models/PracticalProgress', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
const PracticalProgress = require('../models/PracticalProgress');
const { getPracticalProgress, setPracticalProgress } = require('../controllers/practicalProgressController');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const lean = (v) => ({ select: () => ({ lean: async () => v }), lean: async () => v });

describe('practical skill tree progress', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns empty lists for a student with no progress yet', async () => {
    PracticalProgress.findOne.mockReturnValue(lean(null));
    const r = res();
    await getPracticalProgress({ user: { id: 's1' } }, r);
    expect(r.json).toHaveBeenCalledWith({ status: 'success', data: { guides: [], skills: [] } });
  });

  test('ticking a guide adds it once, unticking removes it', async () => {
    PracticalProgress.findOne.mockReturnValue(lean(null));
    PracticalProgress.findOneAndUpdate.mockReturnValue(lean({ guides: ['word-cg1'], skills: [] }));
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'guide', id: 'word-cg1' }, body: { done: true } }, res());
    expect(PracticalProgress.findOneAndUpdate.mock.calls[0][1]).toEqual({ $addToSet: { guides: 'word-cg1' } });
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'skill', id: 'word.font.bold' }, body: { done: false } }, res());
    expect(PracticalProgress.findOneAndUpdate.mock.calls[1][1]).toEqual({ $pull: { skills: 'word.font.bold' } });
  });

  test('refuses unknown kinds and odd ids', async () => {
    const r = res();
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'other', id: 'x1' }, body: {} }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    const r2 = res();
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'guide', id: '$where' }, body: {} }, r2);
    expect(r2.status).toHaveBeenCalledWith(400);
    expect(PracticalProgress.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
