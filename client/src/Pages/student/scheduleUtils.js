// Helpers for the Schedule model shape: { schedule: [{ day: 'Monday', sessions: [{ startTime, endTime, type, topic, isActive }] }] }.
// Times are free strings: "19:00" (time inputs) or "7:00 PM" (older data); both are handled.

export const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Minutes since midnight, or null. */
export function toMinutes(t) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]) % (m[3] ? 12 : 24);
  if (m[3] && m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

/** "19:00" → "7:00 PM"; compact → "7p" / "7:30p" (week strip). */
export function shortTime(t, compact = false) {
  const mins = toMinutes(t);
  if (mins === null) return t || '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h % 12 || 12;
  const ap = h >= 12 ? 'PM' : 'AM';
  if (compact) return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${ap[0].toLowerCase()}`;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export const typeChip = (type) => ({ practical: 'c-pr', revision: 'c-am', quiz: 'c-rd' }[type] || 'c-th');

/** Days array from either the Schedule document or its `schedule` array. */
const daysOf = (s) => (Array.isArray(s) ? s : Array.isArray(s?.schedule) ? s.schedule : []);

/** Sessions per weekday (Mon..Sun), active only, sorted by start time. Accepts the Schedule doc or its days. */
export function weekFromSchedule(schedule) {
  const days = daysOf(schedule);
  return WEEK.map(day => {
    const d = days.find(x => x.day === day);
    return (d?.sessions || [])
      .filter(s => s.isActive !== false)
      .sort((a, b) => (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0));
  });
}

/** Next `count` sessions from now (looking 7 days ahead), each with a `when` label and `date`. */
export function sessionsAhead(days, count, now = new Date()) {
  const week = weekFromSchedule(days);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const out = [];
  for (let offset = 0; offset < 7 && out.length < count; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const idx = (date.getDay() + 6) % 7;
    week[idx]
      .filter(s => offset > 0 || (toMinutes(s.endTime) ?? toMinutes(s.startTime) ?? 0) >= nowMins)
      .forEach(s => {
        if (out.length < count) {
          out.push({
            ...s,
            date,
            when: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : WEEK[idx].slice(0, 3)
          });
        }
      });
  }
  return out;
}
