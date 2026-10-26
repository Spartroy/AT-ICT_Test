const PastPaperProgress = require('../models/PastPaperProgress');
const { getPastPaperProgress, setPastPaperProgress, PAPER_KEY } = require('../controllers/progressController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('past paper progress', () => {
  it('accepts paper-year-session-variant keys only', () => {
    ['1-2024-jun-1', '3-2018-nov-9'].forEach(k => expect(PAPER_KEY.test(k)).toBe(true));
    ['4-2024-jun-1', '1-2024-dec-1', '1-2024-jun-0', '1-2024-jun-10', '../x'].forEach(k => expect(PAPER_KEY.test(k)).toBe(false));
  });

  it('upserts when marked done and deletes when undone', async () => {
    const update = jest.spyOn(PastPaperProgress, 'updateOne').mockResolvedValue({});
    const del = jest.spyOn(PastPaperProgress, 'deleteOne').mockResolvedValue({});
    const req = { user: { id: 's1' }, params: { key: '2-2024-jun-1' }, body: { done: true } };
    let res = mockRes();
    await setPastPaperProgress(req, res);
    expect(update).toHaveBeenCalledWith({ student: 's1', key: '2-2024-jun-1' }, expect.anything(), { upsert: true });
    expect(res.status).toHaveBeenCalledWith(200);
    res = mockRes();
    await setPastPaperProgress({ ...req, body: { done: false } }, res);
    expect(del).toHaveBeenCalledWith({ student: 's1', key: '2-2024-jun-1' });
  });

  it('rejects a malformed key without touching the database', async () => {
    const update = jest.spyOn(PastPaperProgress, 'updateOne');
    const res = mockRes();
    await setPastPaperProgress({ user: { id: 's1' }, params: { key: 'nope' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("lists the student's keys", async () => {
    jest.spyOn(PastPaperProgress, 'find').mockReturnValue({ select: () => ({ lean: async () => [{ key: '1-2020-nov-2' }] }) });
    const res = mockRes();
    await getPastPaperProgress({ user: { id: 's1' } }, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { keys: ['1-2020-nov-2'] } });
  });
});
