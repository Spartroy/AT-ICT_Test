// Groups flashcard stacks for the student page: chapter stacks by phase, everything else last.

export const PHASE_CHAPTERS = [
  { phase: 1, chapters: [1, 4] },
  { phase: 2, chapters: [5, 7] },
  { phase: 3, chapters: [8, 13] }
];

const CHAPTER_TITLE = /^Chapter\s+(\d+)\s*[–—-]\s*(.+)$/i;

/** { number, name } for "Chapter 4 – Storage Devices", or null for any other title. */
export const parseChapter = (title = '') => {
  const m = title.trim().match(CHAPTER_TITLE);
  return m ? { number: Number(m[1]), name: m[2].trim() } : null;
};

export const phaseOfChapter = (n) => PHASE_CHAPTERS.find(p => n >= p.chapters[0] && n <= p.chapters[1])?.phase || null;

/** [{ key, label, sub, stacks: [{ stack, number?, name }] }] in phase order; empty groups are left out. */
export function groupStacks(stacks = []) {
  const groups = PHASE_CHAPTERS.map(p => ({ key: `phase${p.phase}`, phase: p.phase, label: `Phase ${p.phase}`, sub: `Chapters ${p.chapters[0]}–${p.chapters[1]}`, stacks: [] }));
  const other = { key: 'other', phase: null, label: 'More stacks', sub: '', stacks: [] };

  stacks.forEach((stack) => {
    const ch = parseChapter(stack.title);
    const group = ch && groups.find(g => g.phase === phaseOfChapter(ch.number));
    if (group) group.stacks.push({ stack, number: ch.number, name: ch.name });
    else other.stacks.push({ stack, name: stack.title });
  });

  groups.forEach(g => g.stacks.sort((a, b) => a.number - b.number));
  return [...groups, other].filter(g => g.stacks.length);
}
