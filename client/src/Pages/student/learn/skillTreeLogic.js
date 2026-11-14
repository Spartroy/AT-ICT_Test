import { APPS, GUIDES } from './practicalSkills';

// The gamified practical skill tree. A skill sits on a branch (its category) and is fed by practical guides:
//   locked    a guide teaches it and none of them is finished yet
//   open      unlocked (a guide covering it is finished, or no guide covers it: a bonus skill)
//   mastered  the student ticked it off, like a circle in the Practical Skills Checker
// Finishing a guide is worth 50 XP, mastering a skill 10 XP.

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

/** Numbers for one app: mastery, unlocked skills, guides done, XP and rank. */
export function appStats(app, doneGuides, mastered) {
  const skills = app.categories.flatMap(c => c.skills);
  const gs = guidesOfApp(app.id);
  const masteredN = skills.filter(s => mastered.has(s.id)).length;
  const unlocked = skills.filter(s => skillState(s, doneGuides, mastered) !== 'locked').length;
  const guidesDone = gs.filter(g => doneGuides.has(g.id)).length;
  const percent = skills.length ? Math.round((masteredN / skills.length) * 100) : 0;
  return {
    total: skills.length, mastered: masteredN, unlocked, locked: skills.length - unlocked,
    guidesDone, guidesTotal: gs.length, percent,
    xp: guidesDone * XP_GUIDE + masteredN * XP_SKILL, rank: rankFor(percent)
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
