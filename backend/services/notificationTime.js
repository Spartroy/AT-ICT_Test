// Time helpers for reminders. Schedules are written in the school's local time, so everything is converted with the
// configured time zone instead of the server's (Railway runs in UTC).

/** "19:00" or "7:00 PM" → minutes since midnight (null if it can't be read). */
function clockToMinutes(text) {
  const m = String(text || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    const pm = m[3].toLowerCase() === 'pm';
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (pm ? 12 : 0);
  }
  return h > 23 || min > 59 ? null : h * 60 + min;
}

/** { weekday: 'Monday', ymd: '2026-10-13', minutes: 1140 } for a moment in the given time zone. */
function zonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(fmt.formatToParts(date).map(x => [x.type, x.value]));
  return { weekday: p.weekday, ymd: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** True when `minutes` falls inside the quiet window; the window may wrap past midnight (22:00 to 07:00). */
function inQuietHours(minutes, { enabled, start, end } = {}) {
  if (!enabled) return false;
  const s = clockToMinutes(start);
  const e = clockToMinutes(end);
  if (s === null || e === null || s === e) return false;
  return s < e ? minutes >= s && minutes < e : minutes >= s || minutes < e;
}

/** 90 → "1 hour 30 min", 1440 → "1 day", 45 → "45 min". */
function humanMinutes(total) {
  const t = Math.max(1, Math.round(total));
  if (t < 60) return `${t} min`;
  if (t % 1440 === 0) {
    const days = t / 1440;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${h} hour${h === 1 ? '' : 's'}${m ? ` ${m} min` : ''}`;
}

module.exports = { clockToMinutes, zonedParts, inQuietHours, humanMinutes };
