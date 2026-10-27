// Counts student logins for the first-run tutorial and the "need help?" hint.
const HINT_LOGINS = 6; // logins on which the help button gets a halo and bubble

/**
 * Next value of studentInfo.loginCount. A student who already signed in before this counter existed
 * (they have a lastLogin but no count) is placed past the hint window, so only genuinely new students see it.
 */
function nextLoginCount(previous, lastLogin) {
  if (Number.isFinite(previous)) return previous + 1;
  return lastLogin ? HINT_LOGINS + 1 : 1;
}

module.exports = { nextLoginCount, HINT_LOGINS };
