// Phone helpers for matching parent numbers across students (siblings share one).

/** Digits only, with 00/+ prefixes and the Egyptian country code folded into a leading 0, so "+20 101 234 5678" equals "0101 234 5678". */
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('20') && d.length === 12) d = `0${d.slice(2)}`;
  return d;
}

/** True when the number is long enough to identify someone (placeholders like "N/A" or 1000000000 are not). */
const isUsablePhone = (raw) => {
  const d = normalizePhone(raw);
  return d.length >= 8 && !/^(\d)\1+$/.test(d) && d !== '1000000000';
};

/** Escapes user text for use inside a RegExp. */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { normalizePhone, isUsablePhone, escapeRegex };
