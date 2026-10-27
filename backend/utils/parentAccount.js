// Parent account naming: "<StudentName>_<code>_Parent@atict.com", e.g. Omar_731_Parent@atict.com.
// The code is three random digits so the address can't be guessed from the student's name alone.
const crypto = require('crypto');

const DOMAIN = 'atict.com';

/** First name reduced to letters and digits (the User email pattern only allows word characters). */
function nameForEmail(firstName) {
  const first = String(firstName || '').trim().split(/\s+/)[0] || '';
  const clean = first.normalize('NFKD').replace(/[^A-Za-z0-9]/g, '');
  if (!clean) return 'Student';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/** Three random digits, "000" to "999". */
const randomCode = () => String(crypto.randomInt(0, 1000)).padStart(3, '0');

const parentEmail = (firstName, code) => `${nameForEmail(firstName)}_${code}_Parent@${DOMAIN}`;

/**
 * Picks an address nobody uses yet. `taken(email)` resolves true when it is in use.
 * Tries random codes first; after `tries` misses it walks 000..999 so a full house still finds a free one.
 */
async function freeParentEmail(firstName, taken, { tries = 25, code = randomCode } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const email = parentEmail(firstName, code());
    if (!(await taken(email))) return email;
  }
  for (let n = 0; n < 1000; n += 1) {
    const email = parentEmail(firstName, String(n).padStart(3, '0'));
    if (!(await taken(email))) return email;
  }
  throw new Error('No free parent email left for this name');
}

module.exports = { nameForEmail, randomCode, parentEmail, freeParentEmail };
