const mongoose = require('mongoose');
const MessageTemplate = require('../models/MessageTemplate');

const clean = (body) => ({
  title: String(body?.title || '').trim().slice(0, 80),
  body: String(body?.body || '').trim().slice(0, 1000)
});
const invalid = (t) => (!t.title || !t.body ? 'A template needs a title and a message' : '');

// @route GET /api/teacher/message-templates
const listTemplates = async (req, res) => {
  try {
    const templates = await MessageTemplate.find({ teacher: req.user._id }).sort({ title: 1 });
    res.status(200).json({ status: 'success', data: { templates } });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ status: 'error', message: 'Server error retrieving templates' });
  }
};

// @route POST /api/teacher/message-templates
const createTemplate = async (req, res) => {
  try {
    const t = clean(req.body);
    const problem = invalid(t);
    if (problem) return res.status(400).json({ status: 'error', message: problem });
    if ((await MessageTemplate.countDocuments({ teacher: req.user._id })) >= 50) {
      return res.status(400).json({ status: 'error', message: 'You can keep up to 50 templates' });
    }
    const template = await MessageTemplate.create({ ...t, teacher: req.user._id });
    res.status(201).json({ status: 'success', data: { template } });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving template' });
  }
};

// @route PUT /api/teacher/message-templates/:id
const updateTemplate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: 'error', message: 'Template not found' });
    const t = clean(req.body);
    const problem = invalid(t);
    if (problem) return res.status(400).json({ status: 'error', message: problem });
    const template = await MessageTemplate.findOneAndUpdate({ _id: req.params.id, teacher: req.user._id }, t, { new: true });
    if (!template) return res.status(404).json({ status: 'error', message: 'Template not found' });
    res.status(200).json({ status: 'success', data: { template } });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ status: 'error', message: 'Server error saving template' });
  }
};

// @route DELETE /api/teacher/message-templates/:id
const deleteTemplate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: 'error', message: 'Template not found' });
    const gone = await MessageTemplate.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!gone) return res.status(404).json({ status: 'error', message: 'Template not found' });
    res.status(200).json({ status: 'success', message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ status: 'error', message: 'Server error deleting template' });
  }
};

module.exports = { listTemplates, createTemplate, updateTemplate, deleteTemplate };
