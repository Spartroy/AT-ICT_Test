/**
 * @fileoverview Assistant gate
 * @description Runs inside `protect` for users with role 'assistant'. It decides, per request, whether the
 * assistant may reach the route (area + view/edit level from config/assistantAccess.js), then lets the request
 * run as the teacher the assistant works for, so existing teacher controllers need no changes. On the way out
 * it strips contact details and payments from every JSON response and logs writes to the audit log.
 */

const User = require('../models/User');
const AssistantAudit = require('../models/AssistantAudit');
const { can, requirementFor, apiPath, stripHidden } = require('../config/assistantAccess');

const WRITES = (method) => !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase());

const deny = (res, message) => {
  res.status(403).json({ status: 'error', message });
  return false;
};

const record = (req, entry) => {
  const { assistant, teacher } = entry;
  AssistantAudit.create({
    assistant: assistant._id,
    teacher: teacher._id,
    method: req.method,
    path: apiPath(req.originalUrl),
    area: entry.area || '',
    level: entry.level || '',
    status: entry.status,
    allowed: entry.allowed
  }).catch(err => console.error('Assistant audit error:', err.message));
};

/**
 * Applies assistant access to `req`. Returns true when the request may continue (req.user is then the teacher
 * the assistant works for, or the assistant themself for "self" routes); returns false after sending a 403.
 */
const applyAssistantAccess = async (req, res, assistant) => {
  // A second router in the same request (protect runs once per mounted router): reuse the first decision.
  if (req.actingTeacher) {
    req.user = req.actingTeacher;
    return true;
  }

  const teacherId = assistant.assistantInfo && assistant.assistantInfo.teacher;
  const teacher = teacherId ? await User.findById(teacherId) : null;
  if (!teacher || teacher.role !== 'teacher' || !teacher.isActive) {
    return deny(res, 'This assistant account is not linked to an active teacher');
  }

  const need = requirementFor(req.method, req.originalUrl);
  const permissions = assistant.assistantInfo.permissions;

  if (!need) {
    if (WRITES(req.method)) record(req, { assistant, teacher, status: 403, allowed: false });
    return deny(res, 'Assistants cannot access this resource');
  }

  if (need.area === 'self') {
    req.user = assistant;
    req.assistant = assistant;
    return true;
  }

  if (!can(permissions, need.area, need.level)) {
    if (WRITES(req.method)) record(req, { assistant, teacher, area: need.area, level: need.level, status: 403, allowed: false });
    return deny(res, `You need ${need.level} access to ${need.area} for this`);
  }

  req.assistant = assistant;
  req.actingTeacher = teacher;
  req.user = teacher;

  // Hidden fields never leave the server
  const send = res.json.bind(res);
  res.json = (body) => send(stripHidden(body));

  if (WRITES(req.method)) {
    res.on('finish', () => record(req, { assistant, teacher, area: need.area, level: need.level, status: res.statusCode, allowed: res.statusCode < 400 }));
  }
  return true;
};

module.exports = { applyAssistantAccess };
