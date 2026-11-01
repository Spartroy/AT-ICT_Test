/**
 * @fileoverview Assistant controller
 * @description Teacher-side management of assistant accounts (create, permissions, suspend, password, audit log)
 * and the assistant's own "who am I / what may I do" endpoint.
 */

const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const AssistantAudit = require('../models/AssistantAudit');
const { normalizePermissions, DEFAULT_PERMISSIONS } = require('../config/assistantAccess');

const NAME = /^[a-zA-Z\s]+$/;
const EMAIL = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const fail = (res, code, message) => res.status(code).json({ status: 'error', message });

/** What the teacher UI needs about an assistant; never the password hash or tokens. */
const present = (u) => ({
  _id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  isActive: u.isActive,
  lastLogin: u.lastLogin,
  createdAt: u.createdAt,
  permissions: normalizePermissions(u.assistantInfo && u.assistantInfo.permissions, DEFAULT_PERMISSIONS)
});

/** The assistant that belongs to the calling teacher, or null. */
const findMine = (teacherId, id) => User.findOne({ _id: id, role: 'assistant', 'assistantInfo.teacher': teacherId });

const validName = (v) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 50 && NAME.test(v);

// GET /api/teacher/assistants
const list = async (req, res) => {
  try {
    const rows = await User.find({ role: 'assistant', 'assistantInfo.teacher': req.user._id }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: { assistants: rows.map(present) } });
  } catch (error) {
    console.error('List assistants error:', error);
    fail(res, 500, 'Could not load assistants');
  }
};

// POST /api/teacher/assistants
const create = async (req, res) => {
  try {
    const { firstName, lastName, email, password, permissions } = req.body || {};
    if (!validName(firstName) || !validName(lastName)) return fail(res, 400, 'First and last name should only contain letters and spaces');
    if (typeof email !== 'string' || !EMAIL.test(email.trim())) return fail(res, 400, 'Please provide a valid email address');
    if (typeof password !== 'string' || password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');
    if (await User.findOne({ email: email.trim().toLowerCase() })) return fail(res, 400, 'email already exists');

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      role: 'assistant',
      registrationStatus: 'approved',
      isEmailVerified: true,
      assistantInfo: { teacher: req.user._id, permissions: normalizePermissions(permissions) }
    });
    res.status(201).json({ status: 'success', message: 'Assistant created', data: { assistant: present(user) } });
  } catch (error) {
    console.error('Create assistant error:', error);
    if (error.code === 11000) return fail(res, 400, 'email already exists');
    fail(res, 500, 'Could not create the assistant');
  }
};

// PUT /api/teacher/assistants/:id   { firstName?, lastName?, permissions?, isActive? }
const update = async (req, res) => {
  try {
    const user = await findMine(req.user._id, req.params.id);
    if (!user) return fail(res, 404, 'Assistant not found');
    const { firstName, lastName, permissions, isActive } = req.body || {};

    if (firstName !== undefined) {
      if (!validName(firstName)) return fail(res, 400, 'First name should only contain letters and spaces');
      user.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (!validName(lastName)) return fail(res, 400, 'Last name should only contain letters and spaces');
      user.lastName = lastName.trim();
    }
    if (permissions !== undefined) {
      user.assistantInfo.permissions = normalizePermissions(permissions, present(user).permissions);
    }
    if (isActive !== undefined) {
      user.isActive = !!isActive;
      if (!user.isActive) await DeviceSession.deactivateAllSessions(user._id);
    }
    await user.save();
    res.json({ status: 'success', message: 'Assistant updated', data: { assistant: present(user) } });
  } catch (error) {
    console.error('Update assistant error:', error);
    fail(res, 500, 'Could not update the assistant');
  }
};

// POST /api/teacher/assistants/:id/reset-password   { password }
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== 'string' || password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');
    const user = await findMine(req.user._id, req.params.id).select('+password');
    if (!user) return fail(res, 404, 'Assistant not found');
    user.password = password;
    await user.save();
    await DeviceSession.deactivateAllSessions(user._id);
    res.json({ status: 'success', message: 'Password reset. Share the new password with the assistant.' });
  } catch (error) {
    console.error('Reset assistant password error:', error);
    fail(res, 500, 'Could not reset the password');
  }
};

// DELETE /api/teacher/assistants/:id
const remove = async (req, res) => {
  try {
    const user = await findMine(req.user._id, req.params.id);
    if (!user) return fail(res, 404, 'Assistant not found');
    await DeviceSession.deactivateAllSessions(user._id);
    await user.deleteOne();
    res.json({ status: 'success', message: 'Assistant deleted' });
  } catch (error) {
    console.error('Delete assistant error:', error);
    fail(res, 500, 'Could not delete the assistant');
  }
};

// GET /api/teacher/assistants/audit?assistant=<id>&limit=100
const audit = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 300);
    const filter = { teacher: req.user._id };
    if (req.query.assistant) filter.assistant = req.query.assistant;
    const rows = await AssistantAudit.find(filter).sort({ createdAt: -1 }).limit(limit).populate('assistant', 'firstName lastName');
    res.json({
      status: 'success',
      data: {
        entries: rows.map(r => ({
          _id: r._id,
          assistant: r.assistant ? `${r.assistant.firstName} ${r.assistant.lastName}`.trim() : 'Deleted assistant',
          method: r.method,
          path: r.path,
          area: r.area,
          level: r.level,
          status: r.status,
          allowed: r.allowed,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Assistant audit error:', error);
    fail(res, 500, 'Could not load the activity log');
  }
};

// GET /api/assistant/me : the assistant's current permissions (the teacher may change them at any time)
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return fail(res, 404, 'User not found');
    res.json({ status: 'success', data: { assistant: present(user) } });
  } catch (error) {
    console.error('Assistant me error:', error);
    fail(res, 500, 'Could not load your account');
  }
};

module.exports = { list, create, update, resetPassword, remove, audit, me, present };
