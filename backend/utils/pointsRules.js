// The points rules in one place. The backend awards by these numbers and the student portal shows them
// (GET /api/student/points), so what students read is what they earn.
//
//   Homework (max 100)  = grade up to 70  + on time 20  + handed in 24h+ early 10.  Late work: grade part halved, no bonus.
//   Quiz (max 100)      = grade up to 100.
//   Effort              = video done +2, notes chapter read +3, past paper practised +5 (together at most 20 a day),
//                         plus +5 for joining a live class. Each item pays once.
//   Streak              = +10 every time 3 homeworks in a row were handed in on time.

const RULES = Object.freeze({
  assignment: Object.freeze({ gradeMax: 70, onTime: 20, early: 10, earlyHours: 24, lateGradeFactor: 0.5 }),
  quiz: Object.freeze({ gradeMax: 100 }),
  effort: Object.freeze({ video: 2, note: 3, pastpaper: 5, live: 5, dailyCap: 20, capped: Object.freeze(['video', 'note', 'pastpaper']) }),
  streak: Object.freeze({ length: 3, bonus: 10 })
});

const HOUR = 3600 * 1000;
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const pctOf = (score, max) => (max > 0 ? clamp01(Number(score) / max) : 0);

/** Points for a graded homework. */
function assignmentPoints({ score, maxScore, submissionDate, dueDate }, rules = RULES.assignment) {
  const sub = new Date(submissionDate).getTime();
  const due = new Date(dueDate).getTime();
  const late = sub > due;
  const base = Math.round(pctOf(score, maxScore) * rules.gradeMax * (late ? rules.lateGradeFactor : 1));
  const onTimeBonus = late ? 0 : rules.onTime;
  const earlyBonus = !late && due - sub >= rules.earlyHours * HOUR ? rules.early : 0;
  const bonusPoints = onTimeBonus + earlyBonus;
  return { base, onTimeBonus, earlyBonus, bonusPoints, total: base + bonusPoints, onTime: !late, late };
}

/** Points for a graded quiz (the mark only). */
function quizPoints({ score, maxScore }, rules = RULES.quiz) {
  const base = Math.round(pctOf(score, maxScore) * rules.gradeMax);
  return { base, bonusPoints: 0, total: base };
}

/**
 * Points for an effort item (video, note, pastpaper, live) given what the student already earned today from capped items.
 * Returns the points to give now (0 when the daily cap is used up).
 */
function effortPoints(source, earnedTodayCapped = 0, rules = RULES.effort) {
  const value = rules[source];
  if (!Number.isFinite(value)) return 0;
  if (!rules.capped.includes(source)) return value;
  return Math.max(0, Math.min(value, rules.dailyCap - earnedTodayCapped));
}

/**
 * Whether the latest homeworks complete a streak. `entries` are the student's homework history entries
 * (any order, each with onTime and awardedAt). A streak is every full run of `length` on-time homeworks.
 */
function streakReached(entries = [], rules = RULES.streak) {
  const sorted = [...entries].sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
  let run = 0;
  for (const e of sorted) {
    if (e.onTime) run += 1; else break;
  }
  return run > 0 && run % rules.length === 0;
}

module.exports = { RULES, assignmentPoints, quizPoints, effortPoints, streakReached };
