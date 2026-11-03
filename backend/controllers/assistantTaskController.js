/**
 * @fileoverview Assistant task controller
 * @description Teacher side: create, edit and delete to-dos for assistants. Assistant side (own account routes):
 * list my to-dos, tick one off, and see my own recent activity.
 */

const User = require('../models/User');
const AssistantTask = require('../models/AssistantTask');
const AssistantAudit = require('../models/AssistantAudit');

const fail = (res, code, message) => res.status(code).json({ status: 'error', message });
const isId = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

const present = (t) => ({
  _id: t._id,
  title: t.title,
  note: t.note,
  dueDate: t.dueDate,
  assignee: t.assignee ? String(t.assignee._id || t.assignee) : null,
  assigneeName: t.assignee && t.assignee.firstName ? `${t.assignee.firstName} ${t.assignee.lastName}`.trim() : '',
  done: t.done,
  doneByName: t.doneBy && t.doneBy.firstName ? `${t.doneBy.firstName} ${t.doneBy.lastName}`.trim() : '',
  doneAt: t.doneAt,
  createdAt: t.createdAt
});

/** Validates title/note/dueDate/assignee; returns { value } or { error }. Fields left out stay out of `value`. */
const parse = async (teacherId, body, { partial }) => {
  const value = {};
  const { title, note, dueDate, assignee } = body || {};
  if (title !== undefined || !partial) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 140) return { error: 'Give the task a title (up to 140 characters)' };
    value.title = title.trim();
  }
  if (note !== undefined) {
    if (typeof note !== 'string' || note.length > 1000) return { error: 'The note is too long' };
    value.note = note.trim();
  }
  if (dueDate !== undefined) {
    const d = dueDate ? new Date(dueDate) : null;
    if (d && Number.isNaN(d.getTime())) return { error: 'That due date is not valid' };
    value.dueDate = d;
  }
  if (assignee !== undefined) {
    if (assignee) {
      if (!isId(assignee) || !(await User.findOne({ _id: assignee, role: 'assistant', 'assistantInfo.teacher': teacherId }))) return { error: 'That assistant was not found' };
      value.assignee = assignee;
    } else {
      value.assignee = null;
    }
  }
  return { value };
};

// GET /api/teacher/assistants/tasks
const listTasks = async (req, res) => {
  try {
    const rows = await AssistantTask.find({ teacher: req.user._id }).sort({ done: 1, dueDate: 1, createdAt: -1 }).limit(200)
      .populate('assignee', 'firstName lastName').populate('doneBy', 'firstName lastName');
    res.json({ status: 'success', data: { tasks: rows.map(present) } });
  } catch (error) {
    console.error('List assistant tasks error:', error);
    fail(res, 500, 'Could not load tasks');
  }
};

// POST /api/teacher/assistants/tasks
const createTask = async (req, res) => {
  try {
    const { value, error } = await parse(req.user._id, req.body, { partial: false });
    if (error) return fail(res, 400, error);
    const task = await AssistantTask.create({ ...value, teacher: req.user._id });
    res.status(201).json({ status: 'success', data: { task: present(task) } });
  } catch (error) {
    console.error('Create assistant task error:', error);
    fail(res, 500, 'Could not create the task');
  }
};

// PUT /api/teacher/assistants/tasks/:taskId  { title?, note?, dueDate?, assignee?, done? }
const updateTask = async (req, res) => {
  try {
    const task = await AssistantTask.findOne({ _id: req.params.taskId, teacher: req.user._id });
    if (!task) return fail(res, 404, 'Task not found');
    const { value, error } = await parse(req.user._id, req.body, { partial: true });
    if (error) return fail(res, 400, error);
    Object.assign(task, value);
    if (req.body && req.body.done !== undefined) {
      task.done = !!req.body.done;
      task.doneBy = null;
      task.doneAt = task.done ? new Date() : null;
    }
    await task.save();
    res.json({ status: 'success', data: { task: present(task) } });
  } catch (error) {
    console.error('Update assistant task error:', error);
    fail(res, 500, 'Could not update the task');
  }
};

// DELETE /api/teacher/assistants/tasks/:taskId
const deleteTask = async (req, res) => {
  try {
    const task = await AssistantTask.findOne({ _id: req.params.taskId, teacher: req.user._id });
    if (!task) return fail(res, 404, 'Task not found');
    await task.deleteOne();
    res.json({ status: 'success', message: 'Task deleted' });
  } catch (error) {
    console.error('Delete assistant task error:', error);
    fail(res, 500, 'Could not delete the task');
  }
};

/** Tasks an assistant may see: addressed to them, or to everyone, from their own teacher. */
const mineFilter = (assistant) => ({
  teacher: assistant.assistantInfo.teacher,
  $or: [{ assignee: null }, { assignee: assistant._id }]
});

// GET /api/assistant/tasks
const myTasks = async (req, res) => {
  try {
    const rows = await AssistantTask.find(mineFilter(req.user)).sort({ done: 1, dueDate: 1, createdAt: -1 }).limit(50)
      .populate('doneBy', 'firstName lastName');
    res.json({ status: 'success', data: { tasks: rows.map(present) } });
  } catch (error) {
    console.error('My assistant tasks error:', error);
    fail(res, 500, 'Could not load your tasks');
  }
};

// PUT /api/assistant/tasks/:taskId/done  { done: boolean }
const markDone = async (req, res) => {
  try {
    const task = await AssistantTask.findOne({ _id: req.params.taskId, ...mineFilter(req.user) });
    if (!task) return fail(res, 404, 'Task not found');
    const done = !(req.body && req.body.done === false);
    task.done = done;
    task.doneBy = done ? req.user._id : null;
    task.doneAt = done ? new Date() : null;
    await task.save();
    res.json({ status: 'success', data: { task: present(task) } });
  } catch (error) {
    console.error('Mark assistant task error:', error);
    fail(res, 500, 'Could not update the task');
  }
};

// GET /api/assistant/activity : the assistant's own last actions
const myActivity = async (req, res) => {
  try {
    const rows = await AssistantAudit.find({ assistant: req.user._id }).sort({ createdAt: -1 }).limit(15);
    res.json({
      status: 'success',
      data: { entries: rows.map(r => ({ _id: r._id, method: r.method, path: r.path, area: r.area, allowed: r.allowed, createdAt: r.createdAt })) }
    });
  } catch (error) {
    console.error('Assistant activity error:', error);
    fail(res, 500, 'Could not load your activity');
  }
};

module.exports = { listTasks, createTask, updateTask, deleteTask, myTasks, markDone, myActivity, mineFilter };
