// Teaching groups ("GRP A", "GRP B", …): the colour each group wears everywhere, so a group is recognisable at a glance.
const PALETTE = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)', 'var(--gold-500)', 'var(--prog-excel)', 'var(--prog-access)', 'var(--crimson-glow)', 'var(--prog-word)'];

export const UNASSIGNED = '__none';

/** Same group, same colour. */
export const groupColor = (code) => PALETTE[(String(code || 'A').toUpperCase().charCodeAt(0) - 65 + PALETTE.length * 4) % PALETTE.length];

/** "GRP A" for a code, using the teacher's own name for the group when there is one. */
export const groupLabel = (code, groups = []) => groups.find(g => g.code === code)?.name || (code ? `GRP ${code}` : 'No group');

/** The next free code: A, B, C … (then A1…). */
export const nextGroupCode = (groups = []) => {
  const taken = new Set(groups.map(g => g.code));
  for (let i = 0; i < 26; i += 1) {
    const code = String.fromCharCode(65 + i);
    if (!taken.has(code)) return code;
  }
  return '';
};
