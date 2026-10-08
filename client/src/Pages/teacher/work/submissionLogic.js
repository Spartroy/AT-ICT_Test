import { PROGRAMS } from '../curriculum';

/**
 * The submission to open after grading / skipping `currentId`: the next ungraded row after it,
 * wrapping around to earlier ones. Returns undefined when nothing is left to grade.
 */
export function nextToGrade(rows, currentId) {
  const i = rows.findIndex(r => r.id === currentId);
  const after = rows.slice(i + 1).find(r => r.status === 'needs');
  return after || rows.slice(0, Math.max(i, 0)).find(r => r.status === 'needs' && r.id !== currentId);
}

/** Lesson picker button text: "All lessons", "Theory › Phase 2 › CH 6 P1 Networks", "Practical › Excel". */
export function lessonPickerLabel({ section, phase, chapter, program } = {}) {
  if (!section) return 'All lessons';
  if (section === 'theory') return ['Theory', phase && `Phase ${phase}`, chapter].filter(Boolean).join(' › ');
  return ['Practical', PROGRAMS.find(p => p.key === program)?.short].filter(Boolean).join(' › ');
}
