// Database side of teaching groups: reading the config, who is in which group, resolving "who is this for?"
// for homework / quizzes / announcements / schedules / live classes, and keeping students' work in step when
// they move between groups. The pure rules live in validators/groups.js.
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const rules = require('../validators/groups');

const ACTIVE_STUDENT = Object.freeze({ role: 'student', registrationStatus: 'approved', isActive: true });

async function getConfig() {
  const settings = await AppSettings.getGlobal();
  return rules.withDefaults(settings.groupsConfig);
}

async function saveConfig(config, userId) {
  const settings = await AppSettings.getGlobal();
  settings.groupsConfig = config;
  settings.markModified('groupsConfig');
  if (userId) settings.updatedBy = userId;
  await settings.save();
  return config;
}

/** { A: 12, B: 11 } for approved, active students. */
async function memberCounts() {
  const rows = await User.aggregate([
    { $match: { ...ACTIVE_STUDENT, 'studentInfo.group': { $nin: [null, ''] } } },
    { $group: { _id: '$studentInfo.group', n: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.map(r => [r._id, r.n]));
}

const asList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(',').map(v => v.trim()).filter(Boolean); // "A,B" from a plain form field
    }
  }
  return [value];
};

/** Normalises a list of group codes: upper-cased, unique, and only groups that exist. Returns { codes } or { error }. */
async function cleanCodes(value) {
  const wanted = [...new Set(asList(value).map(c => String(c).trim().toUpperCase()).filter(Boolean))];
  if (!wanted.length) return { codes: [] };
  const config = await getConfig();
  const known = new Set(config.groups.map(g => g.code));
  const unknown = wanted.filter(c => !known.has(c));
  if (unknown.length) return { error: `Unknown group: ${unknown.join(', ')}` };
  return { codes: wanted };
}

/** Ids of approved, active students in any of these groups. */
async function membersOf(codes) {
  if (!codes?.length) return [];
  const rows = await User.find({ ...ACTIVE_STUDENT, 'studentInfo.group': { $in: codes } }).select('_id');
  return rows.map(r => r._id);
}

/**
 * Who is a piece of homework / a quiz / a schedule for?
 *   assignToAll        every approved student
 *   groups             everyone in those groups
 *   selectedStudents   these students (can be combined with groups)
 * Returns { studentIds, groups } or { error }.
 */
async function resolveAudience({ assignToAll, selectedStudents, groups }) {
  if (assignToAll === true || assignToAll === 'true') {
    const all = await User.find(ACTIVE_STUDENT).select('_id');
    return { studentIds: all.map(s => s._id), groups: [] };
  }

  const g = await cleanCodes(groups);
  if (g.error) return { error: g.error };

  const rawSelected = typeof selectedStudents === 'string'
    ? (() => { try { return JSON.parse(selectedStudents); } catch { return undefined; } })()
    : selectedStudents;
  if (typeof selectedStudents === 'string' && rawSelected === undefined) return { error: 'Invalid student selection format' };
  const picked = rawSelected === undefined || rawSelected === null ? [] : rawSelected;
  if (!Array.isArray(picked)) return { error: 'At least one student must be selected' };

  if (!g.codes.length && !picked.length) return { error: 'Please choose a group or at least one student' };

  if (picked.length) {
    const valid = await User.find({ ...ACTIVE_STUDENT, _id: { $in: picked } }).select('_id');
    if (valid.length !== new Set(picked.map(String)).size) return { error: 'Some selected students are not valid or active' };
  }

  const fromGroups = await membersOf(g.codes);
  const ids = new Map();
  [...fromGroups, ...picked].forEach(id => ids.set(String(id), id));
  if (!ids.size) return { error: g.codes.length ? 'Those groups have no students yet' : 'At least one student must be selected' };
  return { studentIds: [...ids.values()], groups: g.codes };
}

/** The `assignedTo` entries for a list of student ids. */
const toAssignedTo = (ids) => ids.map(student => ({ student, assignedDate: new Date(), status: 'assigned' }));

/**
 * Students joined (or moved to) group `code`: give them the homework and quizzes made for that group that are
 * still open. Work they already have, and work from their old group, is left alone.
 */
async function addManyToGroupContent(studentIds, code) {
  if (!code || !studentIds?.length) return { assignments: 0, quizzes: 0 };
  const now = new Date();
  const [assignments, quizzes] = await Promise.all([
    Assignment.find({ isActive: true, groups: code, dueDate: { $gt: now } }),
    Quiz.find({ isActive: true, groups: code, startDate: { $gt: now } })
  ]);
  let added = { assignments: 0, quizzes: 0 };
  for (const [kind, docs] of [['assignments', assignments], ['quizzes', quizzes]]) {
    for (const doc of docs) {
      const have = new Set(doc.assignedTo.map(a => String(a.student)));
      const missing = studentIds.filter(id => !have.has(String(id)));
      if (!missing.length) continue;
      missing.forEach(id => doc.assignedTo.push({ student: id, assignedDate: now, status: 'assigned' }));
      await doc.save();
      added[kind] += 1;
    }
  }
  return added;
}

const addToGroupContent = (studentId, code) => addManyToGroupContent([studentId], code);

/** Puts a newly approved student into the smallest group (when groups exist and auto-assign is on). */
async function autoAssignNewStudent(userId) {
  const config = await getConfig();
  if (!config.autoAssign || !config.groups.length) return null;
  const user = await User.findById(userId).select('studentInfo.group role');
  if (!user || user.role !== 'student' || user.studentInfo?.group) return user?.studentInfo?.group || null;
  const code = rules.smallestGroup(config.groups, await memberCounts());
  if (!code) return null;
  await User.updateOne({ _id: userId }, { $set: { 'studentInfo.group': code } });
  return code;
}

/** { id, code, name } of a student's group, or null. */
async function groupOf(user) {
  const code = user?.studentInfo?.group;
  if (!code) return null;
  const config = await getConfig();
  const g = config.groups.find(x => x.code === code);
  return { code, name: g?.name || `GRP ${code}` };
}

module.exports = {
  ACTIVE_STUDENT, getConfig, saveConfig, memberCounts, cleanCodes, membersOf, resolveAudience, toAssignedTo,
  addToGroupContent, addManyToGroupContent, autoAssignNewStudent, groupOf
};
