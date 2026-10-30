// Pure leaderboard rules: ranking students by points and how far each moved since a day ago.
const DAY_MS = 24 * 60 * 60 * 1000;

const sessionPoints = (student) => student.studentInfo?.points?.currentSession || 0;

/** Points the student had `windowMs` ago: today's session points minus what was awarded since (never below 0). */
function pointsBefore(student, now = Date.now(), windowMs = DAY_MS) {
  const since = now - windowMs;
  const recent = (student.studentInfo?.points?.history || [])
    .filter(h => h.awardedAt && new Date(h.awardedAt).getTime() > since)
    .reduce((sum, h) => sum + (h.total || 0), 0);
  return Math.max(0, sessionPoints(student) - recent);
}

/** Orders by points (highest first), ties by name so the order is stable. Ties share the same rank. */
function rankBy(students, pointsOf) {
  const sorted = [...students].sort((a, b) =>
    pointsOf(b) - pointsOf(a) || `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  const ranks = new Map();
  sorted.forEach((s, i) => {
    ranks.set(String(s._id), i > 0 && pointsOf(sorted[i - 1]) === pointsOf(s) ? ranks.get(String(sorted[i - 1]._id)) : i + 1);
  });
  return { sorted, ranks };
}

/**
 * Standings for a list of students, each with rank, points and `movement`
 * (places gained since yesterday: positive = up, negative = down, 0 = same).
 */
function buildStandings(students, now = Date.now()) {
  const current = rankBy(students, sessionPoints);
  const before = rankBy(students, s => pointsBefore(s, now));
  return current.sorted.map(s => {
    const rank = current.ranks.get(String(s._id));
    return {
      rank,
      _id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      avatar: s.avatar || null,
      points: sessionPoints(s),
      totalPoints: s.studentInfo?.points?.total || 0,
      sessionLabel: s.studentInfo?.points?.sessionLabel || s.studentInfo?.session || '',
      group: s.studentInfo?.group || null,
      movement: before.ranks.get(String(s._id)) - rank
    };
  });
}

module.exports = { buildStandings, pointsBefore, DAY_MS };
