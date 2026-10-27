const mongoose = require('mongoose');
const LedgerEntry = require('../models/LedgerEntry');
const User = require('../models/User');
const { cleanEntry } = require('../validators/ledger');
const { createEntry, updateEntry } = require('../controllers/incomeController');

const mockRes = () => { const res = {}; res.status = jest.fn(() => res); res.json = jest.fn(() => res); return res; };
const now = new Date('2026-10-27T12:00:00Z');
afterEach(() => jest.restoreAllMocks());

describe('cleanEntry', () => {
  it('accepts an expense and trims the category', () => {
    const { value } = cleanEntry({ kind: 'expense', label: '  Hall   rent ', amount: '1500.456', date: '2026-10-01' }, now);
    expect(value).toMatchObject({ kind: 'expense', label: 'Hall rent', amount: 1500.46 });
    expect(value.date).toBeInstanceOf(Date);
  });
  it('defaults the date to today and ignores a student on an expense', () => {
    const { value } = cleanEntry({ kind: 'expense', label: 'Zoom', amount: 20, student: 'abc' }, now);
    expect(value.date).toEqual(now);
    expect(value.student).toBeUndefined();
  });
  it('keeps the student on income', () => {
    expect(cleanEntry({ kind: 'income', label: 'Cash', amount: 100, student: 'abc' }, now).value.student).toBe('abc');
  });
  it.each([
    [{ kind: 'gift', label: 'x', amount: 5 }, 'kind'],
    [{ kind: 'income', label: '  ', amount: 5 }, 'label'],
    [{ kind: 'income', label: 'x'.repeat(61), amount: 5 }, 'label'],
    [{ kind: 'income', label: 'x', amount: 0 }, 'amount'],
    [{ kind: 'income', label: 'x', amount: -3 }, 'amount'],
    [{ kind: 'income', label: 'x', amount: 'abc' }, 'amount'],
    [{ kind: 'income', label: 'x', amount: 5, date: 'nope' }, 'date'],
    [{ kind: 'income', label: 'x', amount: 5, date: '2030-01-01' }, 'date']
  ])('rejects %j (%s)', (input, path) => {
    expect(cleanEntry(input, now).errors.map(e => e.path)).toContain(path);
  });
});

describe('entry endpoints', () => {
  it('saves a valid entry and rejects an unknown student', async () => {
    const create = jest.spyOn(LedgerEntry, 'create').mockResolvedValue({ populate: async () => {}, _id: 'e1', kind: 'income', label: 'Cash', amount: 100, date: now });
    jest.spyOn(User, 'exists').mockResolvedValue(null);
    let res = mockRes();
    await createEntry({ user: { id: 't1' }, body: { kind: 'income', label: 'Cash', amount: 100 } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 't1', label: 'Cash' }));

    res = mockRes();
    await createEntry({ user: { id: 't1' }, body: { kind: 'income', label: 'Cash', amount: 100, student: new mongoose.Types.ObjectId().toString() } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 with the first problem for a bad entry', async () => {
    const res = mockRes();
    await createEntry({ user: { id: 't1' }, body: { kind: 'expense', label: '', amount: 5 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/category/i);
  });

  it('keeps the kind of an existing entry when editing', async () => {
    const entry = { kind: 'expense', set: jest.fn(), save: jest.fn(async () => {}), populate: async () => {}, _id: 'e1', label: 'Rent', amount: 200, date: now };
    jest.spyOn(LedgerEntry, 'findById').mockResolvedValue(entry);
    const res = mockRes();
    await updateEntry({ params: { id: 'e1' }, body: { kind: 'income', label: 'Rent', amount: 250 } }, res);
    expect(entry.set).toHaveBeenCalledWith(expect.objectContaining({ kind: 'expense', amount: 250 }));
  });
});
