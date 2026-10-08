import { nextToGrade, lessonPickerLabel } from './submissionLogic';

const rows = [
  { id: 'a', status: 'needs' },
  { id: 'b', status: 'graded' },
  { id: 'c', status: 'needs' },
  { id: 'd', status: 'needs' }
];

describe('nextToGrade (Save & next / Skip)', () => {
  it('opens the next ungraded submission after the current one', () => {
    expect(nextToGrade(rows, 'a').id).toBe('c');
    expect(nextToGrade(rows, 'c').id).toBe('d');
  });

  it('skips graded rows', () => {
    expect(nextToGrade(rows, 'b').id).toBe('c');
  });

  it('wraps around to earlier ungraded rows', () => {
    expect(nextToGrade(rows, 'd').id).toBe('a');
  });

  it('returns nothing when everything else is graded', () => {
    expect(nextToGrade([{ id: 'a', status: 'needs' }, { id: 'b', status: 'graded' }], 'a')).toBeUndefined();
  });
});

it('labels the lesson picker as a breadcrumb', () => {
  expect(lessonPickerLabel({})).toBe('All lessons');
  expect(lessonPickerLabel({ section: 'theory', phase: '2', chapter: 'CH 6 P1 Networks' })).toBe('Theory › Phase 2 › CH 6 P1 Networks');
  expect(lessonPickerLabel({ section: 'practical', program: 'excel' })).toBe('Practical › Excel');
  expect(lessonPickerLabel({ section: 'practical' })).toBe('Practical');
});
