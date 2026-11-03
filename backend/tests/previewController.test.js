const { PassThrough } = require('stream');
const Material = require('../models/Material');
const Video = require('../models/Video');
const Note = require('../models/Note');
const { previewMaterials, previewMaterialFile, previewVideos, previewNotes } = require('../controllers/previewController');
const previewRoutes = require('../routes/previewRoutes');
const { teacherOnly } = require('../middleware/auth');
const { requirementFor } = require('../config/assistantAccess');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

// find().populate().sort() resolving to `docs`
const chain = (docs) => ({ populate: () => ({ sort: () => Promise.resolve(docs) }), sort: () => Promise.resolve(docs) });

afterEach(() => jest.restoreAllMocks());

describe('teacher preview routes', () => {
  const layers = previewRoutes.stack.filter(l => l.route).map(l => ({ path: l.route.path, methods: Object.keys(l.route.methods) }));

  it('only exposes GET endpoints, so a preview can never write', () => {
    expect(layers.map(l => l.path).sort()).toEqual(['/materials', '/materials/:id/download', '/notes', '/videos']);
    layers.forEach(l => expect(l.methods).toEqual(['get']));
  });

  it('rejects students, parents and anyone who is not a teacher', () => {
    ['student', 'parent'].forEach((role) => {
      const res = mockRes();
      const next = jest.fn();
      teacherOnly({ user: { role } }, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  it('lets assistants with library view reach it, GET only', () => {
    expect(requirementFor('GET', '/api/teacher/preview/videos')).toEqual({ area: 'videos', level: 'view' });
    expect(requirementFor('GET', '/api/teacher/preview/materials/abc/download')).toEqual({ area: 'materials', level: 'view' });
    expect(requirementFor('GET', '/api/teacher/preview/notes')).toEqual({ area: 'notes', level: 'view' });
    expect(requirementFor('POST', '/api/teacher/preview/videos')).toBeNull();
  });
});

describe('previewMaterials', () => {
  it('returns every active material, grouped, without looking up a student', async () => {
    const docs = [{ _id: 'a', type: 'theory' }, { _id: 'b', type: 'other' }, { _id: 'c', type: 'theory' }];
    const find = jest.spyOn(Material, 'find').mockReturnValue(chain(docs));
    const res = mockRes();
    await previewMaterials({ query: {}, user: { role: 'teacher' } }, res);
    expect(find).toHaveBeenCalledWith({ isActive: true });
    const { data } = res.json.mock.calls[0][0];
    expect(data.allMaterials).toHaveLength(3);
    expect(data.materials.theory.map(m => m._id)).toEqual(['a', 'c']);
    expect(data.materials.practical).toEqual([]);
  });

  it('filters by type when asked', async () => {
    const find = jest.spyOn(Material, 'find').mockReturnValue(chain([]));
    await previewMaterials({ query: { type: 'practical' } }, mockRes());
    expect(find).toHaveBeenCalledWith({ isActive: true, type: 'practical' });
  });
});

describe('previewMaterialFile', () => {
  const upstream = () => ({ ok: true, body: require('stream').Readable.toWeb(require('stream').Readable.from(['pdf-bytes'])) });

  it('streams the file and does not count a download', async () => {
    const material = { isActive: true, cloudinaryUrl: 'https://cdn.example.com/a.pdf', mimeType: 'application/pdf', fileName: 'a.pdf', incrementDownload: jest.fn() };
    jest.spyOn(Material, 'findById').mockResolvedValue(material);
    global.fetch = jest.fn().mockResolvedValue(upstream());
    const res = new PassThrough();
    res.setHeader = jest.fn();
    const chunks = [];
    res.on('data', c => chunks.push(c));
    await previewMaterialFile({ params: { id: 'm1' } }, res);
    await new Promise(r => setTimeout(r, 20));
    expect(Buffer.concat(chunks).toString()).toBe('pdf-bytes');
    expect(material.incrementDownload).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  });

  it('404s for a missing or inactive material', async () => {
    jest.spyOn(Material, 'findById').mockResolvedValue({ isActive: false });
    const res = mockRes();
    await previewMaterialFile({ params: { id: 'm1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('404s when the material has no file', async () => {
    jest.spyOn(Material, 'findById').mockResolvedValue({ isActive: true });
    const res = mockRes();
    await previewMaterialFile({ params: { id: 'm1' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('previewVideos', () => {
  it('lists all active videos whatever their access level, in the student grouping', async () => {
    const docs = [
      { type: 'theory', phase: 2, accessLevel: 'specific' },
      { type: 'practical', program: 'word', contentType: 'guide', accessLevel: 'year10' },
      { type: 'other', accessLevel: 'all' }
    ];
    const find = jest.spyOn(Video, 'find').mockReturnValue(chain(docs));
    const res = mockRes();
    await previewVideos({ user: { role: 'teacher' } }, res);
    expect(find).toHaveBeenCalledWith({ isActive: true });
    const { videos } = res.json.mock.calls[0][0].data;
    expect(videos.theory.phase2).toHaveLength(1);
    expect(videos.practical.word.guides).toHaveLength(1);
    expect(videos.other).toHaveLength(1);
  });
});

describe('previewNotes', () => {
  it('groups active notes by phase', async () => {
    jest.spyOn(Note, 'find').mockReturnValue({ sort: () => Promise.resolve([{ phase: 1 }, { phase: 3 }, { phase: 1 }]) });
    const res = mockRes();
    await previewNotes({ user: { role: 'teacher' } }, res);
    const { notes } = res.json.mock.calls[0][0].data;
    expect(notes.phase1).toHaveLength(2);
    expect(notes.phase3).toHaveLength(1);
  });
});
