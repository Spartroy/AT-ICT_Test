import { APPS, GUIDES } from './practicalSkills';

// The gamified practical skill tree. A skill sits on a branch (its category) and is fed by practical guides:
//   locked    a guide teaches it and none of them is finished yet
//   open      unlocked (a guide covering it is finished, or no guide covers it: a bonus skill)
//   mastered  the student ticked it off, like a circle in the Practical Skills Checker
// A guide counts as done once the student has submitted their evidence for it. Ticking a skill is worth 10 XP, and a
// guide whose skills are all ticked pays a 50 XP bonus.

export const XP_GUIDE = 50;
export const XP_SKILL = 10;
export const RANKS = [
  { min: 0, name: 'Rookie' },
  { min: 25, name: 'Apprentice' },
  { min: 50, name: 'Practitioner' },
  { min: 75, name: 'Expert' },
  { min: 100, name: 'Grandmaster' }
];

export const rankFor = (percent) => [...RANKS].reverse().find(r => percent >= r.min) || RANKS[0];

const SKILLS = APPS.flatMap(a => a.categories.flatMap(c => c.skills.map(s => ({ ...s, app: a.id, category: c.id }))));
export const SKILL_BY_ID = new Map(SKILLS.map(s => [s.id, s]));
export const GUIDE_BY_ID = new Map(GUIDES.map(g => [g.id, g]));
export const guidesOfApp = (appId) => GUIDES.filter(g => g.app === appId);

/** Skill ids a guide practises. */
export const skillsOfGuide = (guideId) => SKILLS.filter(s => s.guides.includes(guideId)).map(s => s.id);

export const isBonus = (skill) => skill.guides.length === 0;

export function skillState(skill, doneGuides, mastered) {
  if (mastered.has(skill.id)) return 'mastered';
  if (isBonus(skill) || skill.guides.some(g => doneGuides.has(g))) return 'open';
  return 'locked';
}

/** todo (nothing handed in), submitted (evidence in), complete (submitted and every skill of it ticked). */
export function guideState(guideId, submitted, mastered) {
  if (!submitted.has(guideId)) return 'todo';
  const skills = skillsOfGuide(guideId);
  return skills.length && skills.every(id => mastered.has(id)) ? 'complete' : 'submitted';
}

/** Numbers for one app: mastery, unlocked skills, guides done, XP and rank. */
export function appStats(app, doneGuides, mastered) {
  const skills = app.categories.flatMap(c => c.skills);
  const gs = guidesOfApp(app.id);
  const masteredN = skills.filter(s => mastered.has(s.id)).length;
  const unlocked = skills.filter(s => skillState(s, doneGuides, mastered) !== 'locked').length;
  const guidesDone = gs.filter(g => doneGuides.has(g.id)).length;
  const guidesComplete = gs.filter(g => guideState(g.id, doneGuides, mastered) === 'complete').length;
  const percent = skills.length ? Math.round((masteredN / skills.length) * 100) : 0;
  return {
    total: skills.length, mastered: masteredN, unlocked, locked: skills.length - unlocked,
    guidesDone, guidesComplete, guidesTotal: gs.length, percent,
    xp: guidesComplete * XP_GUIDE + masteredN * XP_SKILL, rank: rankFor(percent)
  };
}

/** Level from total XP: each level needs a little more than the one before (100, 200, 300 ...). */
export function levelOf(xp) {
  let level = 1;
  let need = 100;
  let left = xp;
  while (left >= need) { left -= need; level += 1; need += 100; }
  return { level, into: left, need, percent: Math.round((left / need) * 100) };
}

export function overall(doneGuides, mastered) {
  const stats = APPS.map(a => appStats(a, doneGuides, mastered));
  const xp = stats.reduce((n, s) => n + s.xp, 0);
  const total = stats.reduce((n, s) => n + s.total, 0);
  const got = stats.reduce((n, s) => n + s.mastered, 0);
  return { xp, ...levelOf(xp), mastered: got, total, percent: total ? Math.round((got / total) * 100) : 0 };
}

/** Skills that finishing this guide would newly unlock (for the "+N unlocked" message). */
export function newlyUnlocked(guideId, doneGuides) {
  return SKILLS.filter(s => s.guides.includes(guideId) && !s.guides.some(g => g !== guideId && doneGuides.has(g))).length;
}

// ---- the tree drawing ---------------------------------------------------------------------------------------------
export const TREE = { width: 360, tier: 112, top: 46, radius: 25 };

/**
 * Lays one branch's skills out as a mesh, root at the top, on a staggered hexagon lattice like the ability trees in
 * Assassin's Creed: rows of 1, 2, 3, 4, 3, 4, 3 ... skills, each joined to the neighbours diagonally above it.
 * Returns { nodes: [{ i, x, y, tier }], edges: [[parent, child]], height }.
 */
export function layoutTree(count) {
  // One spacing for every row, so neighbouring rows sit half a step apart: a true hexagon lattice
  const STEP = 72;
  const slots = (n) => Array.from({ length: n }, (_, j) => Math.round(TREE.width / 2 + (j - (n - 1) / 2) * STEP));
  const pattern = [1, 2, 3, 4];
  const rowWidth = (t) => (t < pattern.length ? pattern[t] : (t % 2 ? 3 : 4));
  const tiers = [];
  const nodes = [];
  const next = (() => { let n = 0; return () => n++; })();
  for (let left = count, t = 0; left > 0; t++) {
    const full = rowWidth(t);
    const take = Math.min(left, full);
    const xs = slots(full);
    // A short last row sits in the middle of the lattice row
    const from = Math.floor((full - take) / 2);
    const row = xs.slice(from, from + take).map(x => {
      const node = { i: next(), x, y: TREE.top + t * TREE.tier, tier: t };
      nodes.push(node);
      return node;
    });
    tiers.push(row);
    left -= take;
  }
  const edges = [];
  tiers.forEach((row, t) => {
    if (!t) return;
    const above = tiers[t - 1];
    const near = STEP / 2 + 4;
    row.forEach(n => {
      const links = above.filter(p => Math.abs(p.x - n.x) <= near);
      const chosen = links.length ? links : [[...above].sort((a, b) => Math.abs(a.x - n.x) - Math.abs(b.x - n.x))[0]];
      chosen.forEach(p => edges.push([p.i, n.i]));
    });
  });
  return { nodes, edges, height: count ? TREE.top + (tiers.length - 1) * TREE.tier + 84 : 0 };
}

/** A skill name split over up to three short lines to sit under its node. */
export function labelLines(name, perLine = 12) {
  const words = String(name).split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    if (cur && `${cur} ${w}`.length > perLine) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  });
  if (cur) lines.push(cur);
  if (lines.length > 3) { lines.length = 3; lines[2] = `${lines[2].slice(0, perLine - 1)}…`; }
  return lines;
}
