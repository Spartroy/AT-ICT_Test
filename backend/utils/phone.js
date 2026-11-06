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

// Dial codes by country / nationality (lower-case). Used to show stored local numbers with a country code.
const DIAL = {
  jordan: '962', jordanian: '962', egypt: '20', egyptian: '20', 'saudi arabia': '966', saudi: '966',
  'united arab emirates': '971', uae: '971', emirati: '971', kuwait: '965', kuwaiti: '965', qatar: '974', qatari: '974',
  lebanon: '961', lebanese: '961', palestine: '970', palestinian: '970', syria: '963', syrian: '963',
  pakistan: '92', pakistani: '92', bahrain: '973', bahraini: '973', oman: '968', omani: '968', iraq: '964', iraqi: '964',
  'united kingdom': '44', uk: '44', british: '44', 'united states': '1', usa: '1', american: '1', canada: '1', canadian: '1'
};
const DEFAULT_DIAL = '962'; // The Royal College School is in Jordan

/** Dial code for the first hint (country, then nationality) we recognise; '' when none. */
const dialFor = (...hints) => {
  for (const h of hints) {
    const code = DIAL[String(h || '').trim().toLowerCase()];
    if (code) return code;
  }
  return '';
};

/**
 * Full international form: "+962 790702617". Numbers already starting with + or 00 keep their code;
 * a leading 0 is swapped for the code of the student's country/nationality (Jordan when unknown).
 * Returns '' for placeholders like "N/A".
 */
function toInternational(raw, { country, nationality } = {}) {
  const text = String(raw || '').trim();
  let d = text.replace(/\D/g, '');
  if (d.length < 7) return '';
  if (text.startsWith('+') || d.startsWith('00')) {
    if (!text.startsWith('+')) d = d.slice(2);
    const known = Object.values(DIAL).filter((c, i, a) => a.indexOf(c) === i).sort((a, b) => b.length - a.length).find(c => d.startsWith(c));
    return known ? `+${known} ${d.slice(known.length)}` : `+${d}`;
  }
  const dial = dialFor(country, nationality) || DEFAULT_DIAL;
  const local = d.startsWith('0') ? d.slice(1) : d;
  return `+${dial} ${local}`;
}

module.exports = { normalizePhone, isUsablePhone, escapeRegex, toInternational };
