/** When the student tour appears. loginCount comes from the server (studentInfo.loginCount, counted at each login). */
export const HINT_LOGINS = 6;

/**
 * - autoStart: only on the very first login, and only until the tour has been finished once (so a reload mid-tour resumes it).
 * - forced: that first run can't be skipped.
 * - showHint: a halo and a "need help?" bubble on the help button for the first HINT_LOGINS logins, until the
 *   student uses the button, closes the bubble this session, or has just finished the tour.
 */
export function tourPlan({ loginCount, seen = false, helpUsed = false, hintDismissed = false, justFinished = false } = {}) {
  const n = Number.isFinite(loginCount) ? loginCount : 0;
  const autoStart = n === 1 && !seen;
  const showHint = n >= 1 && n <= HINT_LOGINS && !helpUsed && !hintDismissed && !justFinished && !autoStart;
  return { autoStart, forced: autoStart, showHint };
}
