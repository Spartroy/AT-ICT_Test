jest.mock('../models/PracticalProgress', () => {
  const M = jest.fn(function Doc(init) { Object.assign(this, { submissions: [], guides: [], skills: [] }, init); this.save = jest.fn(async () => this); this.toObject = () => ({ ...this }); });
  M.findOne = jest.fn();
  M.findOneAndUpdate = jest.fn();
  M.find = jest.fn();
  return M;
});
const PracticalProgress = require('../models/PracticalProgress');
const { getPracticalProgress, setPracticalProgress, submitGuide, listPracticalSubmissions, shape } = require('../controllers/practicalProgressController');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const lean = (v) => ({ select: () => ({ lean: async () => v }), lean: async () => v });
const file = { filename: 'e_1.docx', originalname: 'Evidence.docx', path: 'uploads/homework/e_1.docx', size: 2048, mimetype: 'application/msword' };

describe('practical skill tree progress', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns empty lists for a student with no progress yet', async () => {
    PracticalProgress.findOne.mockReturnValue(lean(null));
    const r = res();
    await getPracticalProgress({ user: { id: 's1' } }, r);
    expect(r.json).toHaveBeenCalledWith({ status: 'success', data: { guides: [], skills: [], submissions: [] } });
  });

  test('a guide counts as done once evidence is handed in, and older self-marked guides are kept', () => {
    const out = shape({ guides: ['word-ht1'], skills: ['word.font.bold'], submissions: [{ guide: 'word-cg1', note: 'hard', files: [{ ...file, originalName: 'Evidence.docx' }], submittedAt: new Date(), updatedAt: new Date() }] });
    expect(out.guides.sort()).toEqual(['word-cg1', 'word-ht1']);
    expect(out.submissions[0].files[0]).toEqual({ name: 'Evidence.docx', size: 2048, url: '/uploads/homework/e_1.docx' });
  });

  test('ticking a skill adds it once, unticking removes it', async () => {
    PracticalProgress.findOne.mockReturnValue(lean(null));
    PracticalProgress.findOneAndUpdate.mockReturnValue(lean({ guides: [], skills: ['word.font.bold'], submissions: [] }));
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'skill', id: 'word.font.bold' }, body: { done: true } }, res());
    expect(PracticalProgress.findOneAndUpdate.mock.calls[0][1]).toEqual({ $addToSet: { skills: 'word.font.bold' } });
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'skill', id: 'word.font.bold' }, body: { done: false } }, res());
    expect(PracticalProgress.findOneAndUpdate.mock.calls[1][1]).toEqual({ $pull: { skills: 'word.font.bold' } });
  });

  test('refuses unknown kinds and odd ids', async () => {
    const r = res();
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'other', id: 'x1' }, body: {} }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    const r2 = res();
    await setPracticalProgress({ user: { id: 's1' }, params: { kind: 'skill', id: '$where' }, body: {} }, r2);
    expect(r2.status).toHaveBeenCalledWith(400);
    expect(PracticalProgress.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('handing in a guide needs a file the first time and saves the evidence', async () => {
    PracticalProgress.findOne.mockResolvedValue(null);
    const none = res();
    await submitGuide({ user: { id: 's1' }, params: { guide: 'word-cg1' }, files: [], body: {} }, none);
    expect(none.status).toHaveBeenCalledWith(400);
    const ok = res();
    await submitGuide({ user: { id: 's1' }, params: { guide: 'word-cg1' }, files: [file], body: { note: 'done' } }, ok);
    expect(ok.status).toHaveBeenCalledWith(201);
    const doc = PracticalProgress.mock.instances[PracticalProgress.mock.instances.length - 1];
    expect(doc.submissions[0]).toMatchObject({ guide: 'word-cg1', note: 'done' });
    expect(doc.save).toHaveBeenCalled();
  });

  test('a resubmission replaces the files and keeps the first hand-in date', async () => {
    const first = new Date('2026-11-01');
    const existing = { submissions: [{ guide: 'word-cg1', note: 'a', files: [file], submittedAt: first, updatedAt: first }], save: jest.fn(async () => undefined), toObject() { return { submissions: this.submissions }; } };
    PracticalProgress.findOne.mockResolvedValue(existing);
    const r = res();
    await submitGuide({ user: { id: 's1' }, params: { guide: 'word-cg1' }, files: [{ ...file, filename: 'new.docx', originalname: 'New.docx' }], body: { note: 'b' } }, r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(existing.submissions[0].files[0].originalName).toBe('New.docx');
    expect(existing.submissions[0].submittedAt).toBe(first);
  });

  test('rejects a guide id that is not in the catalogue pattern', async () => {
    const r = res();
    await submitGuide({ user: { id: 's1' }, params: { guide: '../etc' }, files: [file], body: {} }, r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  test('the teacher sees submissions newest first and can filter by application', async () => {
    const student = { _id: 'u1', firstName: 'Sam', lastName: 'Ali', studentInfo: { group: 'G1' } };
    PracticalProgress.find.mockReturnValue({ populate: () => ({ lean: async () => [{ _id: 'p1', student, skills: ['a', 'b'], submissions: [
      { _id: 's1', guide: 'word-cg1', files: [file], submittedAt: new Date('2026-11-01'), updatedAt: new Date('2026-11-01') },
      { _id: 's2', guide: 'excel-cg2', files: [file], submittedAt: new Date('2026-11-05'), updatedAt: new Date('2026-11-05') }] }] }) });
    const r = res();
    await listPracticalSubmissions({ query: {} }, r);
    const data = r.json.mock.calls[0][0].data;
    expect(data.submissions.map(s => s.guide)).toEqual(['excel-cg2', 'word-cg1']);
    expect(data.submissions[0]).toMatchObject({ student: { name: 'Sam Ali', group: 'G1' }, skillsTicked: 2 });
    const r2 = res();
    await listPracticalSubmissions({ query: { app: 'word' } }, r2);
    expect(r2.json.mock.calls[0][0].data.submissions).toHaveLength(1);
  });
});
