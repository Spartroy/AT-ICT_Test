const { flattenSubmissions, filterSubmissions, statusCounts, studentCounts } = require('../utils/submissions');

const day = (d) => new Date(Date.UTC(2026, 9, 10 + d));
const students = new Map([
  ['s1', { name: 'Joud El Daher', email: 'joud@example.com' }],
  ['s2', { name: 'Malak Salaheldien', email: 'malak@example.com' }],
  ['s3', { name: 'Besan Shahada', email: 'besan@example.com' }]
]);
const file = (n) => ({ filename: n, originalName: n, size: 10, mimetype: 'application/pdf', path: `uploads/${n}` });

const assignments = [
  {
    _id: 'a1', title: 'Chapter 6 P1', type: 'classified', section: 'theory', maxScore: 40, dueDate: day(0),
    lesson: { section: 'theory', phase: 2, chapter: 'CH 6 P1 Networks' },
    assignedTo: [
      { student: 's1', status: 'submitted', submissionDate: day(1), isLate: true, submission: { attachments: [file('j.pdf')] } },
      { student: 's2', status: 'graded', submissionDate: day(-1), score: 35, feedback: 'Nice', submission: { attachments: [file('m.pdf')] } },
      { student: 's3', status: 'assigned' }
    ]
  },
  {
    _id: 'a2', title: 'Excel Task 2', type: 'task', section: 'practical', maxScore: 50, dueDate: day(5),
    lesson: { section: 'practical', program: 'excel', kind: 'task', number: 2 },
    assignedTo: [
      { student: 's2', status: 'submitted', submissionDate: day(2), submission: { attachments: [file('x.xlsx')] } },
      { student: 's3', status: 'submitted', submissionDate: day(1), submission: { attachments: [] } }
    ]
  },
  {
    // Legacy assignment created before lessons existed
    _id: 'a3', title: 'aaa', type: 'task', section: 'practical', maxScore: 20, dueDate: day(0),
    assignedTo: [{ student: 's1', status: 'submitted', submissionDate: day(-2), submission: { attachments: [file('aaa.docx')] } }]
  }
];

const rows = flattenSubmissions(assignments, students);
const ids = (list) => list.map(r => r.id);

describe('flattenSubmissions', () => {
  it('creates one row per handed-in submission only', () => {
    expect(rows).toHaveLength(5);
    expect(rows.some(r => r.studentId === 's3' && r.assignmentId === 'a1')).toBe(false);
  });

  it('lists ungraded work oldest first, then graded', () => {
    expect(ids(rows)).toEqual(['a3:s1', 'a1:s1', 'a2:s3', 'a2:s2', 'a1:s2']);
  });

  it('carries student, files, lesson and late flags', () => {
    const r = rows.find(x => x.id === 'a1:s1');
    expect(r).toMatchObject({ status: 'needs', late: true, student: { name: 'Joud El Daher' }, files: [{ originalName: 'j.pdf' }] });
    expect(r.assignment.lesson.chapter).toBe('CH 6 P1 Networks');
    expect(rows.find(x => x.id === 'a1:s2')).toMatchObject({ status: 'graded', score: 35, feedback: 'Nice', late: false });
  });

  it('marks work submitted after the due date as late even without the flag', () => {
    const [row] = flattenSubmissions([{ ...assignments[0], assignedTo: [{ student: 's2', status: 'submitted', submissionDate: day(3) }] }], students);
    expect(row.late).toBe(true);
  });
});

describe('filterSubmissions', () => {
  it('filters by status chip', () => {
    expect(ids(filterSubmissions(rows, { status: 'needs' }))).toEqual(['a3:s1', 'a1:s1', 'a2:s3', 'a2:s2']);
    expect(ids(filterSubmissions(rows, { status: 'graded' }))).toEqual(['a1:s2']);
    expect(ids(filterSubmissions(rows, { status: 'late' }))).toEqual(['a1:s1']);
    expect(filterSubmissions(rows, { status: 'all' })).toHaveLength(5);
  });

  it('filters by lesson: section, phase, chapter, program', () => {
    expect(ids(filterSubmissions(rows, { section: 'theory' }))).toEqual(['a1:s1', 'a1:s2']);
    expect(filterSubmissions(rows, { section: 'theory', phase: '1' })).toHaveLength(0);
    expect(filterSubmissions(rows, { section: 'theory', phase: '2', chapter: 'CH 6 P1 Networks' })).toHaveLength(2);
    expect(ids(filterSubmissions(rows, { section: 'practical', program: 'excel' }))).toEqual(['a2:s3', 'a2:s2']);
  });

  it('keeps legacy assignments under their section but out of program filters', () => {
    expect(ids(filterSubmissions(rows, { section: 'practical' }))).toContain('a3:s1');
    expect(ids(filterSubmissions(rows, { section: 'practical', program: 'word' }))).toEqual([]);
  });

  it('filters by student, assignment and search text', () => {
    expect(ids(filterSubmissions(rows, { student: 's2' }))).toEqual(['a2:s2', 'a1:s2']);
    expect(ids(filterSubmissions(rows, { assignment: 'a2' }))).toEqual(['a2:s3', 'a2:s2']);
    expect(ids(filterSubmissions(rows, { q: 'malak' }))).toEqual(['a2:s2', 'a1:s2']);
  });
});

describe('counts', () => {
  it('counts chips within the current lesson filter', () => {
    expect(statusCounts(rows, {})).toEqual({ needs: 4, late: 1, graded: 1, all: 5 });
    expect(statusCounts(rows, { status: 'graded', section: 'theory' })).toEqual({ needs: 1, late: 1, graded: 1, all: 2 });
  });

  it('counts per student for the picker, ignoring the chosen student', () => {
    expect(studentCounts(rows, { student: 's1', status: 'needs' })).toEqual([
      { id: 's3', name: 'Besan Shahada', count: 1 },
      { id: 's1', name: 'Joud El Daher', count: 2 },
      { id: 's2', name: 'Malak Salaheldien', count: 1 }
    ]);
  });
});
