const LiveSession = require('../models/LiveSession');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { notify, studentIds } = require('../services/notifications');

const EARLY_MS = 15 * 60 * 1000; // students see a class this long before it starts
const STALE_LIVE_MS = 10 * 60 * 60 * 1000; // a class left "live" this long is closed automatically
const TYPES = ['theory', 'practical', 'revision', 'quiz'];

const fail = (res, status, message) => res.status(status).json({ status: 'error', message });
const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

const cleanUrl = (value) => {
  try {
    const u = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
};

/** Closes classes someone forgot to end. */
const closeStale = () => LiveSession.updateMany(
  { status: 'live', startedAt: { $lt: new Date(Date.now() - STALE_LIVE_MS) } },
  { status: 'ended', endedAt: new Date() }
);

/** The students a class is meant for (the whole roster when none are picked). */
async function audienceOf(session) {
  const ids = session.students?.length ? session.students : await studentIds();
  return User.find({ _id: { $in: ids }, role: 'student' }).select('firstName lastName studentInfo.studentId').sort({ firstName: 1, lastName: 1 });
}

/** Validates the teacher's form into a plain object; returns { value } or { error }. */
async function readForm(body, existing) {
  const title = String(body.title ?? existing?.title ?? '').trim();
  if (!title) return { error: 'Give the session a title' };
  const meetingUrl = cleanUrl(body.meetingUrl ?? existing?.meetingUrl);
  if (!meetingUrl) return { error: 'Paste the meeting link (Zoom, Google Meet…) starting with https://' };
  const type = TYPES.includes(body.type) ? body.type : existing?.type || 'theory';
  const startsAt = body.startsAt ? new Date(body.startsAt) : existing?.startsAt || new Date();
  if (Number.isNaN(startsAt.getTime())) return { error: 'The start time is not valid' };
  const durationMin = Math.min(480, Math.max(10, Number(body.durationMin ?? existing?.durationMin ?? 90) || 90));

  const value = {
    title,
    topic: String(body.topic ?? existing?.topic ?? '').trim().slice(0, 200),
    type,
    notes: String(body.notes ?? existing?.notes ?? '').trim().slice(0, 2000),
    meetingUrl,
    startsAt,
    durationMin
  };

  if (body.scheduleId) {
    const sch = await Schedule.findById(body.scheduleId).select('title assignedStudents');
    if (!sch) return { error: 'That schedule no longer exists' };
    value.slot = { schedule: sch._id, scheduleTitle: sch.title, day: String(body.day || ''), startTime: String(body.startTime || ''), topic: String(body.slotTopic || '') };
    value.students = body.onlyAssigned === false ? [] : (sch.assignedStudents || []).map(a => a.student).filter(Boolean);
  } else if (body.scheduleId === '' || body.scheduleId === null) {
    value.slot = undefined;
    value.students = [];
  }
  return { value };
}

function shape(session, extra = {}) {
  const o = session.toObject ? session.toObject() : session;
  return {
    id: o._id,
    title: o.title,
    topic: o.topic,
    type: o.type,
    notes: o.notes,
    meetingUrl: o.meetingUrl,
    startsAt: o.startsAt,
    durationMin: o.durationMin,
    status: o.status,
    startedAt: o.startedAt,
    endedAt: o.endedAt,
    slot: o.slot?.scheduleTitle || o.slot?.day ? { schedule: o.slot.schedule, scheduleTitle: o.slot.scheduleTitle, day: o.slot.day, startTime: o.slot.startTime, topic: o.slot.topic } : null,
    audienceSize: o.students?.length || null, // null = everyone
    joined: (o.attendance || []).length,
    ...extra
  };
}

function notifyLive(session) {
  const recipients = session.students?.length ? session.students : null;
  const send = (ids) => notify(ids, {
    type: 'class_soon',
    title: `Class is live: ${session.title}`,
    body: session.topic || 'Tap to join the session.',
    url: '/student-dashboard',
    dedupeKey: `live:${session._id}`,
    urgent: true
  });
  if (recipients) return send(recipients);
  return studentIds().then(send);
}

// ---------------------------------------------------------------- teacher

/** GET /api/teacher/live — what is live or coming up, and the latest finished classes. */
exports.teacherList = async (req, res) => {
  try {
    await closeStale();
    const [active, recent] = await Promise.all([
      LiveSession.find({ status: { $in: ['scheduled', 'live'] } }).sort({ startsAt: 1 }).limit(60),
      LiveSession.find({ status: 'ended' }).sort({ startsAt: -1 }).limit(20)
    ]);
    return ok(res, { sessions: [...active, ...recent].map(s => shape(s)) });
  } catch (err) {
    console.error('Live list error:', err);
    return fail(res, 500, 'Could not load live sessions');
  }
};

/** POST /api/teacher/live — schedule a class, or start one now with `startNow`. */
exports.create = async (req, res) => {
  try {
    const { value, error } = await readForm(req.body);
    if (error) return fail(res, 400, error);
    const startNow = req.body.startNow === true;
    const session = await LiveSession.create({
      ...value,
      createdBy: req.user.id,
      ...(startNow ? { startsAt: new Date(), status: 'live', startedAt: new Date() } : {})
    });
    if (startNow) await notifyLive(session);
    return ok(res, { session: shape(session) }, 201);
  } catch (err) {
    console.error('Live create error:', err);
    return fail(res, 500, 'Could not save the session');
  }
};

/** PUT /api/teacher/live/:id — edit a class that has not ended. */
exports.update = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return fail(res, 404, 'Session not found');
    if (session.status === 'ended') return fail(res, 400, 'This session has already ended');
    const { value, error } = await readForm(req.body, session);
    if (error) return fail(res, 400, error);
    session.set(value);
    await session.save();
    return ok(res, { session: shape(session) });
  } catch (err) {
    console.error('Live update error:', err);
    return fail(res, 500, 'Could not save the session');
  }
};

/** POST /api/teacher/live/:id/start */
exports.start = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return fail(res, 404, 'Session not found');
    if (session.status === 'ended') return fail(res, 400, 'This session has already ended');
    if (session.status === 'scheduled') {
      session.status = 'live';
      session.startedAt = new Date();
      await session.save();
      await notifyLive(session);
    }
    return ok(res, { session: shape(session) });
  } catch (err) {
    console.error('Live start error:', err);
    return fail(res, 500, 'Could not start the session');
  }
};

/** POST /api/teacher/live/:id/end */
exports.end = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return fail(res, 404, 'Session not found');
    if (session.status !== 'ended') {
      session.status = 'ended';
      session.endedAt = new Date();
      await session.save();
    }
    return ok(res, { session: shape(session) });
  } catch (err) {
    console.error('Live end error:', err);
    return fail(res, 500, 'Could not end the session');
  }
};

/** DELETE /api/teacher/live/:id */
exports.remove = async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndDelete(req.params.id);
    if (!session) return fail(res, 404, 'Session not found');
    return ok(res, {});
  } catch (err) {
    console.error('Live delete error:', err);
    return fail(res, 500, 'Could not delete the session');
  }
};

/** GET /api/teacher/live/:id/attendance — everyone invited, with when they first and last joined. */
exports.attendance = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return fail(res, 404, 'Session not found');
    const roster = await audienceOf(session);
    const byStudent = new Map(session.attendance.map(a => [String(a.student), a]));
    const rows = roster.map(st => {
      const a = byStudent.get(String(st._id));
      return {
        id: st._id,
        name: `${st.firstName} ${st.lastName}`,
        studentId: st.studentInfo?.studentId || '',
        joined: !!a,
        firstJoinedAt: a?.firstJoinedAt || null,
        lastJoinedAt: a?.lastJoinedAt || null,
        joins: a?.joins || 0
      };
    });
    // Someone who joined but is no longer in the audience (e.g. removed later) still counts.
    const known = new Set(rows.map(r => String(r.id)));
    const extra = session.attendance.filter(a => !known.has(String(a.student)));
    if (extra.length) {
      const users = await User.find({ _id: { $in: extra.map(a => a.student) } }).select('firstName lastName studentInfo.studentId');
      users.forEach(u => {
        const a = byStudent.get(String(u._id));
        rows.push({ id: u._id, name: `${u.firstName} ${u.lastName}`, studentId: u.studentInfo?.studentId || '', joined: true, firstJoinedAt: a.firstJoinedAt, lastJoinedAt: a.lastJoinedAt, joins: a.joins });
      });
    }
    rows.sort((a, b) => Number(b.joined) - Number(a.joined) || a.name.localeCompare(b.name));
    return ok(res, { session: shape(session), students: rows, joined: rows.filter(r => r.joined).length, total: rows.length });
  } catch (err) {
    console.error('Live attendance error:', err);
    return fail(res, 500, 'Could not load attendance');
  }
};

// ---------------------------------------------------------------- student

const forMe = (userId) => ({ $or: [{ students: { $size: 0 } }, { students: userId }] });

/** GET /api/live/current — my classes that are live or about to start (the meeting link is only given on join). */
exports.current = async (req, res) => {
  try {
    await closeStale();
    const soon = new Date(Date.now() + EARLY_MS);
    const sessions = await LiveSession.find({
      $and: [
        forMe(req.user._id),
        { $or: [{ status: 'live' }, { status: 'scheduled', startsAt: { $lte: soon, $gte: new Date(Date.now() - 3 * 3600 * 1000) } }] }
      ]
    }).sort({ status: -1, startsAt: 1 }).limit(5);
    const mine = String(req.user._id);
    return ok(res, {
      sessions: sessions.map(s => {
        const { meetingUrl, ...rest } = shape(s);
        return { ...rest, joinedByMe: s.attendance.some(a => String(a.student) === mine) };
      })
    });
  } catch (err) {
    console.error('Live current error:', err);
    return fail(res, 500, 'Could not load live sessions');
  }
};

/** POST /api/live/:id/join — records my entry and returns the meeting link. */
exports.join = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ _id: req.params.id, ...forMe(req.user._id) });
    if (!session) return fail(res, 404, 'Session not found');
    if (session.status !== 'live') return fail(res, 409, session.status === 'ended' ? 'This session has ended' : 'The teacher has not started this session yet');
    const mine = session.attendance.find(a => String(a.student) === String(req.user._id));
    if (mine) {
      mine.lastJoinedAt = new Date();
      mine.joins += 1;
    } else {
      session.attendance.push({ student: req.user._id });
    }
    await session.save();
    return ok(res, { meetingUrl: session.meetingUrl });
  } catch (err) {
    console.error('Live join error:', err);
    return fail(res, 500, 'Could not join the session');
  }
};
