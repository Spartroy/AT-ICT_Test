// Weekly performance report: the numbers and wording shared by the teacher's form and the student/parent report card.
// Mirrors backend/services/weeklyReport.js (totals), so what the teacher sees while typing is what gets saved.

export const STATES = [
  { id: 'done', label: 'Done' },
  { id: 'late', label: 'Late' },
  { id: 'missed', label: 'Missed' },
  { id: 'none', label: '—' }
];

export const DEFAULT_ATTITUDE = ['Punctuality', 'Respect', 'Focus', 'Teamwork'];

/** Phrases a teacher can tap to build a comment quickly. */
export const QUICK_COMMENTS = [
  'Excellent effort this week.',
  'Participates actively in class.',
  'Please complete homework on time.',
  'Needs to revise before the next quiz.',
  'Great improvement compared to last week.',
  'Please keep an eye on punctuality.'
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Points a single homework/quiz row adds: marks when entered, 0 of max when missed, nothing otherwise. */
export const rowPoints = (row) => {
  if (!row) return { gained: 0, possible: 0 };
  const max = isNum(row.max) ? row.max : 0;
  if (isNum(row.mark)) return { gained: row.mark, possible: max };
  if (row.state === 'missed' && max) return { gained: 0, possible: max };
  return { gained: 0, possible: 0 };
};

/** Points for one lesson (homework + quiz). */
export const lessonPoints = (lesson) => {
  const a = rowPoints(lesson && lesson.hw);
  const b = rowPoints(lesson && lesson.quiz);
  return { gained: a.gained + b.gained, possible: a.possible + b.possible };
};

/** Week totals and percentage (null when nothing has been marked). */
export const weekTotals = (lessons = []) => {
  const sum = lessons.reduce((acc, l) => {
    const p = lessonPoints(l);
    return { gained: acc.gained + p.gained, possible: acc.possible + p.possible };
  }, { gained: 0, possible: 0 });
  return { ...sum, percent: sum.possible ? Math.round((sum.gained / sum.possible) * 100) : null };
};

/** Share of the rated items (1-5 stars) as an average; 0 when nothing was rated. */
export const ratingAverage = (report) => {
  const vals = [...(report.lessons || []).map(l => l.contribution), ...(report.attitude || []).map(a => a.rating)].filter(v => v > 0);
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
};

/** The headline for a percentage: what the family reads first. */
export const tierFor = (percent) => {
  if (percent === null || percent === undefined) return { id: 'none', title: 'Week in progress', line: 'Marks will appear once homework and quizzes are graded.' };
  if (percent >= 90) return { id: 'top', title: 'Outstanding week!', line: 'Top marks across the board. Keep it up!' };
  if (percent >= 75) return { id: 'great', title: 'Great work!', line: 'A strong week with real progress.' };
  if (percent >= 60) return { id: 'good', title: 'Good progress', line: 'Solid effort. A little more and it is great.' };
  if (percent >= 40) return { id: 'ok', title: 'Keep pushing', line: 'There is room to grow. Small steps add up.' };
  return { id: 'low', title: 'Let’s turn it around', line: 'Next week is a fresh start. We are here to help.' };
};

/** Badges earned this week. `previous` is last week's published report (if any). */
export const badgesFor = (report, previous) => {
  const out = [];
  const rows = (report.lessons || []).flatMap(l => [l.hw]).filter(r => r && (r.title || r.state !== 'none' || isNum(r.mark)));
  if (rows.length && rows.every(r => r.state === 'done' || r.state === 'late' || isNum(r.mark))) out.push({ id: 'hw', label: 'Homework hero', hint: 'Every homework handed in' });
  const quizzes = (report.lessons || []).map(l => l.quiz).filter(r => r && isNum(r.mark) && r.max);
  if (quizzes.length && quizzes.reduce((a, r) => a + r.mark / r.max, 0) / quizzes.length >= 0.85) out.push({ id: 'quiz', label: 'Quiz ace', hint: 'Quiz average of 85% or more' });
  if (ratingAverage(report) >= 4) out.push({ id: 'talk', label: 'Class star', hint: 'Excellent contribution and attitude' });
  const now = weekPercent(report);
  const before = previous ? weekPercent(previous) : null;
  if (now !== null && before !== null && now - before >= 5) out.push({ id: 'up', label: 'On the rise', hint: `Up ${now - before}% on last week` });
  if (now !== null && now >= 90) out.push({ id: 'top', label: 'Top of the class', hint: '90% or more this week' });
  return out;
};

/** Percentage for a report, from the stored totals or (for a draft being edited) its rows. */
export const weekPercent = (report) => {
  if (!report) return null;
  if (isNum(report.percent)) return report.percent;
  if (isNum(report.possible) && report.possible > 0) return Math.round((report.gained / report.possible) * 100);
  return weekTotals(report.lessons).percent;
};

/** Last week's report in a newest-first list, for the trend line. */
export const previousOf = (reports, current) => {
  const i = reports.findIndex(r => r._id === (current && current._id));
  return i >= 0 ? reports[i + 1] || null : null;
};

/** 'Mon 2 Nov – Sun 8 Nov' from the week's Monday. */
export const weekRange = (weekStart, locale = 'en-GB') => {
  const start = new Date(weekStart);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + 6 * 86400000);
  const f = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${f(start)} – ${f(end)}`;
};

/** yyyy-mm-dd of a Date (UTC), for the week picker. */
export const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

/** The Monday (yyyy-mm-dd) of the week containing `day`, shifted by `weeks`. */
export const mondayOf = (day = new Date(), weeks = 0) => {
  const d = new Date(day);
  const base = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const back = (new Date(base).getUTCDay() + 6) % 7;
  return isoDay(new Date(base - back * 86400000 + weeks * 7 * 86400000));
};

/** A short message a teacher can paste into WhatsApp. */
export const shareText = ({ name, weekNumber, gained, possible, percent, comments }, link) => {
  const lines = [`Weekly Performance Report – Week ${weekNumber}`, `Student: ${name}`];
  if (possible) lines.push(`Points this week: ${gained} / ${possible}${percent !== null ? ` (${percent}%)` : ''}`);
  if (comments) lines.push('', comments);
  if (link) lines.push('', `Full report: ${link}`);
  return lines.join('\n');
};
