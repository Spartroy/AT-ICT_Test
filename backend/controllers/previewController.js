/**
 * @fileoverview Teacher preview of the student library
 * @description Read-only copies of the student endpoints (materials, files, videos, notes) for the teacher portal's
 * "Preview as student". They show everything that is active, ignore student access levels, and never write:
 * no download counts, no watch history, no progress, no points.
 */
const Material = require('../models/Material');
const Video = require('../models/Video');
const { sendMaterialFile } = require('./materialController');
const { organizeVideos } = require('./studentController');
const { getNotesForStudent } = require('./noteController');

const fail = (res, error, doing) => {
  console.error(`Preview error (${doing}):`, error);
  res.status(500).json({ status: 'error', message: `Server error ${doing}` });
};

// @desc    Every active material, in the student shape
// @route   GET /api/teacher/preview/materials
const previewMaterials = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.type) query.type = req.query.type;

    const materials = await Material.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ type: 1, createdAt: -1 });

    const grouped = { theory: [], practical: [], other: [] };
    materials.forEach(m => { if (grouped[m.type]) grouped[m.type].push(m); });

    res.status(200).json({ status: 'success', data: { materials: grouped, allMaterials: materials } });
  } catch (error) {
    fail(res, error, 'retrieving materials');
  }
};

// @desc    Stream a material file (does not count as a download)
// @route   GET /api/teacher/preview/materials/:id/download
const previewMaterialFile = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material || !material.isActive) {
      return res.status(404).json({ status: 'error', message: 'Material not found' });
    }
    const fileUrl = material.cloudinaryUrl || material.fileUrl;
    if (!fileUrl) {
      return res.status(404).json({ status: 'error', message: 'File not found for this material' });
    }
    return await sendMaterialFile(material, fileUrl, res);
  } catch (error) {
    if (!res.headersSent) fail(res, error, 'downloading material');
    return undefined;
  }
};

// @desc    Every active video, grouped like the student list (all access levels)
// @route   GET /api/teacher/preview/videos
const previewVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ type: 1, phase: 1, chapter: 1, program: 1, contentType: -1, order: 1 });
    res.status(200).json({ status: 'success', data: { videos: organizeVideos(videos) } });
  } catch (error) {
    fail(res, error, 'retrieving videos');
  }
};

// @desc    Every active interactive note, grouped by phase (same as the student list; it never needed a student)
// @route   GET /api/teacher/preview/notes
const previewNotes = getNotesForStudent;

module.exports = { previewMaterials, previewMaterialFile, previewVideos, previewNotes };
