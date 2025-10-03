const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Get all notes for teacher management
// @route   GET /api/teacher/notes
// @access  Private (Teacher)
const getAllNotes = async (req, res) => {
  try {
    const { phase, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (phase) query.phase = parseInt(phase);
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const notes = await Note.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ phase: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        notes,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: skip + notes.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all notes error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving notes' });
  }
};

// @desc    Create new note
// @route   POST /api/teacher/notes
// @access  Private (Teacher)
const createNote = async (req, res) => {
  try {
    const { title, phase, linkUrl, order } = req.body;

    if (!title || !phase || !linkUrl) {
      return res.status(400).json({ status: 'error', message: 'Title, phase and link are required' });
    }

    const note = await Note.create({
      title,
      phase: parseInt(phase),
      linkUrl,
      order: order ? parseInt(order) : 0,
      uploadedBy: req.user.id
    });

    const populated = await Note.findById(note._id).populate('uploadedBy', 'firstName lastName');

    res.status(201).json({ status: 'success', message: 'Note created successfully', data: { note: populated } });
  } catch (error) {
    console.error('Create note error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    res.status(500).json({ status: 'error', message: 'Server error creating note' });
  }
};

// @desc    Update note
// @route   PUT /api/teacher/notes/:id
// @access  Private (Teacher)
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ status: 'error', message: 'Note not found' });
    }

    if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this note' });
    }

    const { title, phase, linkUrl, order, isActive } = req.body;
    const updateData = {
      title,
      linkUrl,
      isActive
    };
    if (phase !== undefined) updateData.phase = parseInt(phase);
    if (order !== undefined) updateData.order = parseInt(order);

    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    const updated = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('uploadedBy', 'firstName lastName');

    res.status(200).json({ status: 'success', message: 'Note updated successfully', data: { note: updated } });
  } catch (error) {
    console.error('Update note error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    res.status(500).json({ status: 'error', message: 'Server error updating note' });
  }
};

// @desc    Delete note
// @route   DELETE /api/teacher/notes/:id
// @access  Private (Teacher)
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ status: 'error', message: 'Note not found' });
    }
    if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this note' });
    }
    await Note.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ status: 'error', message: 'Server error deleting note' });
  }
};

// @desc    Get notes for students grouped by phase
// @route   GET /api/student/notes
// @access  Private (Student)
const getNotesForStudent = async (req, res) => {
  try {
    const notes = await Note.find({ isActive: true }).sort({ phase: 1, order: 1, createdAt: -1 });

    const grouped = { phase1: [], phase2: [], phase3: [] };
    notes.forEach((n) => {
      const key = `phase${n.phase}`;
      if (grouped[key]) grouped[key].push(n);
    });

    res.status(200).json({ status: 'success', data: { notes: grouped } });
  } catch (error) {
    console.error('Get student notes error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving notes' });
  }
};

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  getNotesForStudent
};


