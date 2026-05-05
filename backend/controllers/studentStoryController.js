const StudentStory = require('../models/StudentStory');

const getStudentStories = async (req, res) => {
  try {
    const stories = await StudentStory.find({})
      .select('name country text createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        stories,
        count: stories.length
      }
    });
  } catch (error) {
    console.error('Get student stories error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error retrieving student stories'
    });
  }
};

const createStudentStory = async (req, res) => {
  try {
    const { name, country, text } = req.body;

    if (!name?.trim() || !country?.trim() || !text?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, country, and text are required'
      });
    }

    const story = await StudentStory.create({
      name: name.trim(),
      country: country.trim(),
      text: text.trim(),
      createdBy: req.user._id
    });

    return res.status(201).json({
      status: 'success',
      message: 'Student story created successfully',
      data: { story }
    });
  } catch (error) {
    console.error('Create student story error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error creating student story'
    });
  }
};

const updateStudentStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, text } = req.body;

    if (!name?.trim() || !country?.trim() || !text?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, country, and text are required'
      });
    }

    const story = await StudentStory.findByIdAndUpdate(
      id,
      {
        $set: {
          name: name.trim(),
          country: country.trim(),
          text: text.trim()
        }
      },
      { new: true, runValidators: true }
    );

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Student story updated successfully',
      data: { story }
    });
  } catch (error) {
    console.error('Update student story error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error updating student story'
    });
  }
};

const deleteStudentStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await StudentStory.findByIdAndDelete(id);

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Student story deleted successfully'
    });
  } catch (error) {
    console.error('Delete student story error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error deleting student story'
    });
  }
};

module.exports = {
  getStudentStories,
  createStudentStory,
  updateStudentStory,
  deleteStudentStory
};
