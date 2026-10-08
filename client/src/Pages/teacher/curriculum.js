// IGCSE ICT (0417) structure used by the teacher's lesson pickers, Create H.W and the Library tree.

export const PHASES = [
  { phase: 1, label: 'Phase 1', chapters: ['CH 1 Computer Structure', 'CH 2 Input Devices', 'CH 3 Output Devices', 'CH 4 Storage Devices'] },
  { phase: 2, label: 'Phase 2', chapters: ['CH 5 Database', 'CH 6 P1 Networks', 'CH 6 P2 Networks', 'CH 7 Malware Attacks'] },
  { phase: 3, label: 'Phase 3', chapters: ['CH 8 SDLC', 'CH 9 ICT Systems', 'CH 10 Banking Applications', 'CH 11 ICT Applications', 'CH 12 ICT Programs', 'CH 13 ICT Effects'] }
];

// Guides and tasks per program (Create H.W shows numbers 1..n for each).
export const PROGRAMS = [
  { key: 'word', label: 'Microsoft Word', short: 'Word', count: 2 },
  { key: 'powerpoint', label: 'Microsoft PowerPoint', short: 'PowerPoint', count: 2 },
  { key: 'access', label: 'Microsoft Access', short: 'Access', count: 4 },
  { key: 'excel', label: 'Microsoft Excel', short: 'Excel', count: 4 },
  { key: 'sharepoint', label: 'Microsoft SharePoint', short: 'SharePoint', count: 4 }
];

export const programLabel = (key) => PROGRAMS.find(p => p.key === key)?.label || key;

/** "CH 6 P1 Networks" → "CH 6 P1 Networks" in phase 2. */
export const phaseOfChapter = (chapter) => PHASES.find(p => p.chapters.includes(chapter))?.phase;

/** Human label for an assignment lesson, e.g. "Theory › Phase 2 › CH 6 P1 Networks" or "Practical › Excel › Task 2". */
export function lessonLabel(lesson) {
  if (!lesson?.section) return '';
  if (lesson.section === 'theory') return ['Theory', lesson.phase && `Phase ${lesson.phase}`, lesson.chapter].filter(Boolean).join(' › ');
  const p = PROGRAMS.find(x => x.key === lesson.program);
  return ['Practical', p?.short, lesson.kind && `${lesson.kind === 'guide' ? 'Guide' : 'Task'} ${lesson.number}`].filter(Boolean).join(' › ');
}

/** Auto title for Create H.W, e.g. "CH 6 P1 Networks" or "Excel Task 2". */
export function autoTitle(lesson) {
  if (lesson.section === 'theory') return lesson.chapter || '';
  const p = PROGRAMS.find(x => x.key === lesson.program);
  return p && lesson.kind && lesson.number ? `${p.short} ${lesson.kind === 'guide' ? 'Guide' : 'Task'} ${lesson.number}` : '';
}
