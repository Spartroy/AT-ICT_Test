// Teacher "Submissions inbox": flatten assignments → one row per student submission, then filter.
// Pure functions (no DB) so they can be unit-tested.

const SUBMITTED = ['submitted', 'graded'];

/** Row id used by the client and the zip endpoint: "<assignmentId>:<studentId>". */
const rowId = (assignmentId, studentId) => `${assignmentId}:${studentId}`;

/**
 * assignments: lean Assignment docs (with assignedTo). students: Map(id → { name, email }).
 * Only entries that were actually handed in (submitted / graded) become rows.
 */
function flattenSubmissions(assignments, students = new Map()) {
  const rows = [];
  for (const a of assignments) {
    for (const entry of a.assignedTo || []) {
      if (!SUBMITTED.includes(entry.status)) continue;
      const studentId = String(entry.student?._id || entry.student);
      const s = students.get(studentId) || {};
      rows.push({
        id: rowId(a._id, studentId),
        assignmentId: String(a._id),
        studentId,
        student: { name: s.name || 'Unknown student', email: s.email || '' },
        assignment: {
          title: a.title,
          type: a.type,
          section: a.section,
          maxScore: a.maxScore,
          dueDate: a.dueDate,
          lesson: a.lesson || null
        },
        submittedAt: entry.submissionDate || null,
        late: !!entry.isLate || (!!entry.submissionDate && !!a.dueDate && new Date(entry.submissionDate) > new Date(a.dueDate)),
        files: (entry.submission?.attachments || []).map(f => ({
          filename: f.filename,
          originalName: f.originalName || f.filename,
          size: f.size || 0,
          mimetype: f.mimetype || ''
        })),
        text: entry.submission?.text || '',
        status: entry.status === 'graded' ? 'graded' : 'needs',
        score: entry.score ?? null,
        feedback: entry.feedback || ''
      });
    }
  }
  // Oldest ungraded first is what a teacher works through; graded rows after, newest first.
  return rows.sort((x, y) => {
    if (x.status !== y.status) return x.status === 'needs' ? -1 : 1;
    const dx = new Date(x.submittedAt || 0);
    const dy = new Date(y.submittedAt || 0);
    return x.status === 'needs' ? dx - dy : dy - dx;
  });
}

/** Does the row's assignment belong to the chosen lesson? Missing levels mean "all". */
function matchesLesson(row, { section, phase, chapter, program } = {}) {
  if (!section) return true;
  const lesson = row.assignment.lesson || {};
  const rowSection = lesson.section || row.assignment.section;
  if (rowSection !== section) return false;
  if (section === 'theory') {
    if (phase && Number(lesson.phase) !== Number(phase)) return false;
    if (chapter && lesson.chapter !== chapter) return false;
    return true;
  }
  return !program || lesson.program === program;
}

function matchesStatus(row, status) {
  if (!status || status === 'all') return true;
  if (status === 'late') return row.late;
  return row.status === status;
}

/**
 * filters: { status: 'needs'|'late'|'graded'|'all', section, phase, chapter, program, student, assignment, q }
 * `except` skips one filter (used to compute counts for the chips / student picker).
 */
function filterSubmissions(rows, filters = {}, except) {
  const q = (filters.q || '').trim().toLowerCase();
  return rows.filter(r =>
    (except === 'status' || matchesStatus(r, filters.status)) &&
    matchesLesson(r, filters) &&
    (except === 'student' || !filters.student || r.studentId === String(filters.student)) &&
    (!filters.assignment || r.assignmentId === String(filters.assignment)) &&
    (!q || `${r.student.name} ${r.student.email} ${r.assignment.title}`.toLowerCase().includes(q))
  );
}

/** Chip counts for the current lesson / student filters. */
function statusCounts(rows, filters = {}) {
  const base = filterSubmissions(rows, filters, 'status');
  return {
    needs: base.filter(r => r.status === 'needs').length,
    late: base.filter(r => r.late).length,
    graded: base.filter(r => r.status === 'graded').length,
    all: base.length
  };
}

/** Submission count per student for the student picker (ignores the student filter). */
function studentCounts(rows, filters = {}) {
  const counts = new Map();
  for (const r of filterSubmissions(rows, filters, 'student')) {
    const c = counts.get(r.studentId) || { id: r.studentId, name: r.student.name, count: 0 };
    c.count += 1;
    counts.set(r.studentId, c);
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { flattenSubmissions, filterSubmissions, statusCounts, studentCounts, matchesLesson, rowId };
