const Material = require('../models/Material');
const { updateMaterial } = require('../controllers/materialController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const stubMaterial = (extra = {}) => {
  const doc = {
    title: 'Classified',
    type: 'theory',
    description: '',
    externalUrl: 'https://old.example.com/a',
    fileName: null,
    uploadedBy: { toString: () => 'teacher1' },
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined),
    ...extra
  };
  jest.spyOn(Material, 'findById').mockResolvedValue(doc);
  return doc;
};

const call = async (body) => {
  const res = mockRes();
  await updateMaterial({ params: { id: 'm1' }, body, user: { id: 'teacher1' } }, res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('updateMaterial', () => {
  it('saves the description and a new link on a link-only material', async () => {
    const doc = stubMaterial();
    const res = await call({ title: 'Classified', description: ' Past papers ', externalUrl: ' https://drive.google.com/file/d/X/view ' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(doc.description).toBe('Past papers');
    expect(doc.externalUrl).toBe('https://drive.google.com/file/d/X/view');
    expect(doc.save).toHaveBeenCalled();
  });

  it('rejects a link that is not http(s)', async () => {
    const doc = stubMaterial();
    const res = await call({ externalUrl: 'javascript:alert(1)' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('never changes the link of a material that has an uploaded file', async () => {
    const doc = stubMaterial({ fileName: 'notes.pdf', externalUrl: null });
    await call({ externalUrl: 'https://evil.example.com' });
    expect(doc.externalUrl).toBeNull();
  });
});
