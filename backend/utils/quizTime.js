// Quiz times are plain wall-clock "HH:MM" strings (the teacher's clock), so the end time is simple
// arithmetic on the start time. Going through Date and the server's time zone made it wrong, and
// crashed outright when the date arrived as a full ISO timestamp.

/** "10:30" + 45 minutes -> "11:15". Rolls past midnight ("23:50" + 20 -> "00:10"). Returns null if the inputs are not usable. */
function addMinutes(startTime, minutes) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(startTime || '').trim());
  const mins = Number(minutes);
  if (!match || !Number.isFinite(mins)) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  const total = (((h * 60 + m + Math.round(mins)) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

module.exports = { addMinutes };
