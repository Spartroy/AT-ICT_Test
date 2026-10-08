const HallOfFameEntry = require('../models/HallOfFameEntry');
const AppSettings = require('../models/AppSettings');
const { getHallOfFame, addHallOfFameStudent } = require('../controllers/leaderboardController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const listQuery = (rows) => {
  const q = { select: jest.fn(() => q), sort: jest.fn(() => q), limit: jest.fn(() => q), lean: jest.fn().mockResolvedValue(rows) };
  return q;
};

afterEach(() => jest.restoreAllMocks());

describe('public Hall of Fame list', () => {
  const stubSettings = (claimed) => {
    jest.spyOn(AppSettings, 'getGlobal').mockResolvedValue({});
    return jest.spyOn(AppSettings, 'findOneAndUpdate').mockResolvedValue(claimed);
  };

  it('inserts the preset and the 2023/2024 names once, on the first read of an empty list', async () => {
    stubSettings({});
    jest.spyOn(HallOfFameEntry, 'countDocuments').mockResolvedValue(0);
    const insertMany = jest.spyOn(HallOfFameEntry, 'insertMany').mockResolvedValue([]);
    jest.spyOn(HallOfFameEntry, 'find').mockReturnValue(listQuery([]));

    await getHallOfFame({ query: {} }, mockRes());

    expect(insertMany).toHaveBeenCalledTimes(2);
    expect(insertMany.mock.calls[0][0].map(e => e.name)).toEqual(expect.arrayContaining(['Omar Abdeen', 'Yara Khalafalla']));
    const legacy = insertMany.mock.calls[1][0];
    expect(legacy).toHaveLength(36);
    expect(legacy.map(e => e.name)).toEqual(expect.arrayContaining(['Nuria Amr', 'Omar Amer']));
    expect(new Set(legacy.map(e => e.year))).toEqual(new Set(['2023', '2024']));
  });

  it('does not insert again once the preset has been claimed (deleting names sticks)', async () => {
    stubSettings(null);
    const insertMany = jest.spyOn(HallOfFameEntry, 'insertMany');
    jest.spyOn(HallOfFameEntry, 'find').mockReturnValue(listQuery([]));

    await getHallOfFame({ query: {} }, mockRes());

    expect(insertMany).not.toHaveBeenCalled();
  });

  it("keeps an existing deployment's own entries and only adds the missing 2023/2024 names", async () => {
    stubSettings({});
    jest.spyOn(HallOfFameEntry, 'countDocuments').mockResolvedValue(12);
    const insertMany = jest.spyOn(HallOfFameEntry, 'insertMany').mockResolvedValue([]);
    jest.spyOn(HallOfFameEntry, 'find').mockReturnValue(listQuery([{ name: 'nuria amr ' }, { name: 'Someone Else' }]));

    await getHallOfFame({ query: {} }, mockRes());

    expect(insertMany).toHaveBeenCalledTimes(1); // no preset: the list wasn't empty
    const names = insertMany.mock.calls[0][0].map(e => e.name);
    expect(names).toHaveLength(35);
    expect(names).not.toContain('Nuria Amr');
  });

  it('returns the entries with their year, newest class first', async () => {
    stubSettings(null);
    const q = listQuery([{ _id: 'a', name: 'Zeina Ahmad', year: '2025', createdAt: 'x' }]);
    jest.spyOn(HallOfFameEntry, 'find').mockReturnValue(q);
    const res = mockRes();

    await getHallOfFame({ query: {} }, res);

    expect(q.sort).toHaveBeenCalledWith({ year: -1, createdAt: -1 });
    expect(res.json.mock.calls[0][0].data.hallOfFame[0]).toMatchObject({ name: 'Zeina Ahmad', year: '2025' });
  });
});

describe('teacher adds a Hall of Fame student', () => {
  it('defaults the class year to the current year when none is given', async () => {
    const create = jest.spyOn(HallOfFameEntry, 'create').mockResolvedValue({});
    const res = mockRes();

    await addHallOfFameStudent({ body: { name: ' Salma Adel ' }, user: { _id: 'teacher1' } }, res);

    expect(create).toHaveBeenCalledWith({ name: 'Salma Adel', year: String(new Date().getFullYear()), createdBy: 'teacher1' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('still requires a name', async () => {
    const create = jest.spyOn(HallOfFameEntry, 'create');
    const res = mockRes();

    await addHallOfFameStudent({ body: { name: '  ' }, user: { _id: 'teacher1' } }, res);

    expect(create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
