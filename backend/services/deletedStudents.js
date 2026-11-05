// Archive a student before deleting them, and bring them back later.
// Works on the raw collections so the stored password hash, _id and dates come back exactly as they were.
const DeletedStudent = require('../models/DeletedStudent');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Message = require('../models/Message');

const same = (a, b) => String(a) === String(b);

/** Saves everything that deleteStudent is about to remove. Call it before the delete. */
async function archiveStudent(student, teacherId) {
  const id = student._id;
  const rawUser = await User.collection.findOne({ _id: id });
  if (!rawUser) throw new Error('Student record not found');

  const entriesOf = async (Model) => {
    const docs = await Model.collection.find({ 'assignedTo.student': id }, { projection: { assignedTo: 1 } }).toArray();
    return docs.map(d => ({ id: d._id, entry: (d.assignedTo || []).find(e => same(e.student, id)) })).filter(x => x.entry);
  };
  const [assignments, quizzes, messages, parents] = await Promise.all([
    entriesOf(Assignment),
    entriesOf(Quiz),
    Message.collection.find({ $or: [{ sender: id }, { recipient: id }] }).toArray(),
    User.collection.find({ 'parentInfo.children.studentId': id }, { projection: { 'parentInfo.children': 1 } }).toArray()
  ]);
  const parentLinks = parents.map(p => ({ parentId: p._id, link: (p.parentInfo?.children || []).find(c => same(c.studentId, id)) })).filter(x => x.link);

  return DeletedStudent.create({
    teacher: teacherId,
    originalId: id,
    fullName: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim(),
    email: rawUser.email || '',
    studentId: rawUser.studentInfo?.studentId || '',
    year: rawUser.studentInfo?.year,
    session: rawUser.studentInfo?.session || '',
    snapshot: { user: rawUser, assignments, quizzes, messages, parentLinks }
  });
}

/**
 * Puts a deleted student back. Returns { restored, skipped } where skipped counts links to things that no longer exist.
 * Throws an Error with .status 409 when the email is already used by someone else.
 */
async function restoreStudent(archive) {
  const { user, assignments = [], quizzes = [], messages = [], parentLinks = [] } = archive.snapshot;
  const id = archive.originalId;

  if (await User.collection.findOne({ _id: id })) {
    // Already back (e.g. a double click): just drop the archive entry
    await archive.deleteOne();
    return { restored: true, skipped: 0 };
  }
  if (user.email && await User.collection.findOne({ email: user.email })) {
    const err = new Error('Another account already uses this student\'s email, so they cannot be restored.');
    err.status = 409;
    throw err;
  }

  await User.collection.insertOne(user);
  let skipped = 0;

  const putBack = async (Model, items) => {
    for (const { id: parentDocId, entry } of items) {
      const res = await Model.collection.updateOne(
        { _id: parentDocId, 'assignedTo.student': { $ne: id } },
        { $push: { assignedTo: entry } }
      );
      if (!res.matchedCount && !(await Model.collection.findOne({ _id: parentDocId }, { projection: { _id: 1 } }))) skipped += 1;
    }
  };
  await putBack(Assignment, assignments);
  await putBack(Quiz, quizzes);

  if (messages.length) {
    // Skip any that exist already so a retry never duplicates chat history
    const have = new Set((await Message.collection.find({ _id: { $in: messages.map(m => m._id) } }, { projection: { _id: 1 } }).toArray()).map(m => String(m._id)));
    const fresh = messages.filter(m => !have.has(String(m._id)));
    if (fresh.length) await Message.collection.insertMany(fresh);
  }

  for (const { parentId, link } of parentLinks) {
    const res = await User.collection.updateOne(
      { _id: parentId, 'parentInfo.children.studentId': { $ne: id } },
      { $push: { 'parentInfo.children': link } }
    );
    if (!res.matchedCount && !(await User.collection.findOne({ _id: parentId }, { projection: { _id: 1 } }))) skipped += 1;
  }

  await archive.deleteOne();
  return { restored: true, skipped };
}

module.exports = { archiveStudent, restoreStudent };
