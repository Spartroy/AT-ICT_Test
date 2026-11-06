// Dial codes offered in the registration form (the country code is required for every phone number).
export const DIAL_CODES = [
  { code: '962', label: 'Jordan' }, { code: '20', label: 'Egypt' }, { code: '966', label: 'Saudi Arabia' },
  { code: '971', label: 'UAE' }, { code: '965', label: 'Kuwait' }, { code: '974', label: 'Qatar' },
  { code: '973', label: 'Bahrain' }, { code: '968', label: 'Oman' }, { code: '961', label: 'Lebanon' },
  { code: '970', label: 'Palestine' }, { code: '963', label: 'Syria' }, { code: '964', label: 'Iraq' },
  { code: '92', label: 'Pakistan' }, { code: '44', label: 'United Kingdom' }, { code: '1', label: 'USA / Canada' }
];

/** Splits "+962 790702617" into { code: '962', local: '790702617' }; code is '' when there is no known prefix. */
export function splitPhone(value) {
  const text = String(value || '').trim();
  if (!text.startsWith('+')) return { code: '', local: text };
  const digits = text.replace(/\D/g, '');
  const hit = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length).find(c => digits.startsWith(c.code));
  return hit ? { code: hit.code, local: digits.slice(hit.code.length) } : { code: '', local: text.replace(/^\+/, '') };
}

/** Joins a dial code and the local part; a leading 0 on the local part is dropped. */
export const joinPhone = (code, local) => {
  const l = String(local || '').replace(/^0+/, '');
  return code ? `+${code}${l ? ` ${l}` : ''}` : String(local || '');
};
