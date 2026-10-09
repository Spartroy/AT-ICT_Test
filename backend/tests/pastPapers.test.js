const PastPaper = require('../models/PastPaper');
const { normalizePastPapers } = require('../validators/pastPapers');
const { savePastPapers, deletePastPapers } = require('../controllers/pastPaperController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('normalizePastPapers', () => {
  const ok = 'https://drive.google.com/file/d/X/view';

  it('numbers variants V1, V2… per session and keeps the links', () => {
    const { value, errors } = normalizePastPapers({
      paper: 2, year: 2024,
      sessions: { jun: [{ qp: ok, src: ok, ms: ok }, { qp: `${ok}2` }], nov: [{ qp: ok }] }
    });
    expect(errors).toEqual([]);
    expect(value.docs.map(d => `${d.session}${d.variant}`)).toEqual(['jun1', 'jun2', 'nov1']);
    expect(value.docs[0]).toMatchObject({ paper: 2, year: 2024, qp: ok, src: ok, ms: ok });
  });

  it('drops empty variants and renumbers the rest', () => {
    const { value } = normalizePastPapers({ paper: 1, year: 2020, sessions: { jun: [{}, { qp: ok }, { qp: '', ms: '' }, { ms: ok }] } });
    expect(value.docs.map(d => d.variant)).toEqual([1, 2]);
  });

  it('ignores source files on Paper 1 (theory has only QP and MS)', () => {
    const { value } = normalizePastPapers({ paper: 1, year: 2020, sessions: { jun: [{ qp: ok, src: ok, ms: ok }] } });
    expect(value.docs[0].src).toBe('');
  });

  it('rejects an unknown paper, a year outside 2018-2026 and non-http links', () => {
    const paths = normalizePastPapers({ paper: 4, year: 2017, sessions: { jun: [{ qp: 'javascript:alert(1)' }] } }).errors.map(e => e.path);
    expect(paths).toEqual(expect.arrayContaining(['paper', 'year', 'sessions.jun.0.qp']));
    expect(normalizePastPapers({ paper: 2, year: 2027, sessions: {} }).errors[0].path).toBe('year');
  });

  it('accepts a session with no variants', () => {
    expect(normalizePastPapers({ paper: 3, year: 2019, sessions: { jun: [ { qp: ok } ] } }).value.docs).toHaveLength(1);
    expect(normalizePastPapers({ paper: 3, year: 2019 }).value.docs).toEqual([]);
  });
});

describe('savePastPapers / deletePastPapers', () => {
  it('replaces everything stored for that paper and year', async () => {
    const del = jest.spyOn(PastPaper, 'deleteMany').mockResolvedValue({});
    const insert = jest.spyOn(PastPaper, 'insertMany').mockResolvedValue([]);
    const res = mockRes();
    await savePastPapers({ user: { _id: 't1' }, body: { paper: 2, year: 2024, sessions: { jun: [{ qp: 'https://a.example/qp' }] } } }, res);
    expect(del).toHaveBeenCalledWith({ paper: 2, year: 2024 });
    expect(insert.mock.calls[0][0][0]).toMatchObject({ paper: 2, year: 2024, session: 'jun', variant: 1, createdBy: 't1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('does not touch the database when the input is invalid', async () => {
    const del = jest.spyOn(PastPaper, 'deleteMany');
    const res = mockRes();
    await savePastPapers({ user: { _id: 't1' }, body: { paper: 9, year: 2024 } }, res);
    expect(del).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deletes one paper and year', async () => {
    const del = jest.spyOn(PastPaper, 'deleteMany').mockResolvedValue({ deletedCount: 3 });
    const res = mockRes();
    await deletePastPapers({ params: { paper: '2', year: '2024' } }, res);
    expect(del).toHaveBeenCalledWith({ paper: 2, year: 2024 });
  });
});
