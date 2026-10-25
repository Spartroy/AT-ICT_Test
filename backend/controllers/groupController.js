const User = require('../models/User');
const svc = require('../services/groups');
const rules = require('../validators/groups');

const fail = (res, status, message, extra = {}) => res.status(status).json({ status: 'error', message, ...extra });
const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

/** Groups with live member counts, plus every approved student with their group (for the drag-and-drop board). */
async function snapshot() {
  const [config, counts, students] = await Promise.all([
    svc.getConfig(),
    svc.memberCounts(),
    User.find(svc.ACTIVE_STUDENT).select('firstName lastName email studentInfo.studentId studentInfo.group studentInfo.year').lean()
  ]);
  students.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, { sensitivity: 'base' }));
  const known = new Set(config.groups.map(g => g.code));
  return {
    groups: config.groups.map(g => ({ ...g, count: counts[g.code] || 0 })),
    live: config.live,
    autoAssign: config.autoAssign,
    students: students.map(s => ({
      id: s._id,
      name: `${s.firstName} ${s.lastName}`,
      studentId: s.studentInfo?.studentId || '',
      // A student pointing at a deleted group counts as unassigned.
      group: known.has(s.studentInfo?.group) ? s.studentInfo.group : null
    }))
  };
}

/** GET /api/teacher/groups */
exports.list = async (req, res) => {
  try {
    return ok(res, await snapshot());
  } catch (err) {
    console.error('Groups list error:', err);
    return fail(res, 500, 'Could not load groups');
  }
};

/** PUT /api/teacher/groups — save group names / meeting links / live-link rules / auto-assign. */
exports.save = async (req, res) => {
  try {
    const current = await svc.getConfig();
    const { value, errors } = rules.normalize(req.body, current, await svc.memberCounts());
    if (errors.length) return fail(res, errors[0].code === 'GROUP_NOT_EMPTY' ? 409 : 400, errors[0].msg, { errors });
    await svc.saveConfig(value, req.user._id);
    return ok(res, await snapshot());
  } catch (err) {
    console.error('Groups save error:', err);
    return fail(res, 500, 'Could not save groups');
  }
};

/**
 * POST /api/teacher/groups/divide { count, scope: 'all' | 'unassigned' }
 * Creates GRP A…, then fills them alphabetically (by name) with near-equal numbers of students.
 */
exports.divide = async (req, res) => {
  try {
    const count = Math.floor(Number(req.body.count));
    if (!(count >= 1 && count <= rules.MAX_GROUPS)) return fail(res, 400, `Choose between 1 and ${rules.MAX_GROUPS} groups`);
    const onlyUnassigned = req.body.scope === 'unassigned';

    const config = await svc.getConfig();
    for (let i = 0; i < count; i++) {
      const code = rules.codeAt(i);
      if (!config.groups.some(g => g.code === code)) config.groups.push({ code, name: `GRP ${code}`, meetingUrl: '' });
    }
    config.groups.sort((a, b) => a.code.localeCompare(b.code));

    const query = onlyUnassigned ? { ...svc.ACTIVE_STUDENT, 'studentInfo.group': { $in: [null, ''] } } : svc.ACTIVE_STUDENT;
    const students = await User.find(query).select('firstName lastName');
    const chunks = rules.splitAlphabetical(students, count);

    // "Unassigned only" balances against who is already there by filling the groups in order of size.
    let order = chunks.map((_, i) => rules.codeAt(i));
    if (onlyUnassigned) {
      const counts = await svc.memberCounts();
      order = [...order].sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || a.localeCompare(b));
    }

    const ops = [];
    chunks.forEach((chunk, i) => chunk.forEach(s => ops.push({ updateOne: { filter: { _id: s._id }, update: { $set: { 'studentInfo.group': order[i] } } } })));
    if (ops.length) await User.bulkWrite(ops);
    await svc.saveConfig(config, req.user._id);

    for (let i = 0; i < chunks.length; i++) await svc.addManyToGroupContent(chunks[i].map(s => s._id), order[i]);
    return ok(res, { ...(await snapshot()), moved: students.length });
  } catch (err) {
    console.error('Groups divide error:', err);
    return fail(res, 500, 'Could not divide the students');
  }
};

/** PUT /api/teacher/groups/assign { moves: [{ student, group }] } — group null/'' takes the student out of their group. */
exports.assign = async (req, res) => {
  try {
    const moves = Array.isArray(req.body.moves) ? req.body.moves : [];
    if (!moves.length || moves.length > 500) return fail(res, 400, 'Nothing to move');
    const config = await svc.getConfig();
    const known = new Set(config.groups.map(g => g.code));

    const byGroup = new Map();
    for (const m of moves) {
      const code = m.group ? String(m.group).trim().toUpperCase() : null;
      if (code && !known.has(code)) return fail(res, 400, `Unknown group: ${code}`);
      if (!byGroup.has(code)) byGroup.set(code, []);
      byGroup.get(code).push(m.student);
    }

    let changed = 0;
    for (const [code, ids] of byGroup) {
      const result = await User.updateMany({ ...svc.ACTIVE_STUDENT, _id: { $in: ids } }, { $set: { 'studentInfo.group': code } });
      changed += result.modifiedCount ?? result.nModified ?? 0;
      await svc.addManyToGroupContent(ids, code);
    }
    return ok(res, { ...(await snapshot()), moved: changed });
  } catch (err) {
    console.error('Groups assign error:', err);
    return fail(res, 500, 'Could not move the students');
  }
};
