jest.mock('../utils/pointsHelper', () => ({
  calculateAssignmentPoints: jest.fn(() => ({ base: 10, bonusPoints: 2, total: 12 })),
  awardPoints: jest.fn().mockResolvedValue(undefined)
}));

const Assignment = require('../models/Assignment');
const { awardPoints } = require('../utils/pointsHelper');
const { gradeAssignment } = require('../controllers/assignmentController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeAssignment = (entryOverrides = {}) => {
  const entry = { student: { toString: () => 's1' }, status: 'submitted', submissionDate: new Date(), ...entryOverrides };
  return {
    _id: 'a1',
    title: 'Chapter 6 P1',
    maxScore: 40,
    dueDate: new Date(),
    createdAt: new Date(),
    createdBy: { toString: () => 't1' },
    assignedTo: [entry],
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined),
    entry
  };
};

const grade = async (assignment, body, teacher = 't1') => {
  jest.spyOn(Assignment, 'findById').mockResolvedValue(assignment);
  const res = mockRes();
  await gradeAssignment({ params: { id: 'a1', studentId: 's1' }, body, user: { id: teacher } }, res);
  return res;
};

afterEach(() => jest.restoreAllMocks());

describe('gradeAssignment', () => {
  it('stores score, feedback and graded status, then awards points', async () => {
    const a = makeAssignment();
    const res = await grade(a, { score: 35, feedback: 'Good' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(a.entry).toMatchObject({ score: 35, feedback: 'Good', status: 'graded' });
    expect(a.entry.gradedDate).toBeInstanceOf(Date);
    expect(a.save).toHaveBeenCalled();
    expect(awardPoints).toHaveBeenCalledWith('s1', expect.objectContaining({ source: 'assignment', total: 12 }));
  });

  it.each([[-1], [41]])('rejects a score of %s outside 0..max', async (score) => {
    const a = makeAssignment();
    const res = await grade(a, { score });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(a.save).not.toHaveBeenCalled();
  });

  it('requires a score', async () => {
    const res = await grade(makeAssignment(), { feedback: 'x' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('only lets the teacher who created the assignment grade it', async () => {
    const a = makeAssignment();
    const res = await grade(a, { score: 10 }, 'someone-else');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(a.save).not.toHaveBeenCalled();
  });

  it('allows full and zero marks', async () => {
    expect((await grade(makeAssignment(), { score: 40 })).status).toHaveBeenCalledWith(200);
    expect((await grade(makeAssignment(), { score: 0 })).status).toHaveBeenCalledWith(200);
  });
});
