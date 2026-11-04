// Message templates for contacting parents. The wording can use {parent}, {student}, {group} and {teacher}.

/** Starter templates shown alongside the teacher's own. They are not stored. */
export const BUILT_IN_TEMPLATES = [
  { _id: 'b-absent', title: 'Absence', body: 'Hello {parent}, {student} was absent from today’s class. Please let us know if everything is okay. — {teacher}' },
  { _id: 'b-homework', title: 'Missing homework', body: 'Hello {parent}, {student} has not handed in the latest homework yet. Please remind them to submit it. — {teacher}' },
  { _id: 'b-grade', title: 'Low grade', body: 'Hello {parent}, {student} scored lower than usual on the latest work. I’d be glad to talk about how to help. — {teacher}' },
  { _id: 'b-payment', title: 'Payment reminder', body: 'Hello {parent}, a friendly reminder that {student}’s payment is due. Thank you. — {teacher}' },
  { _id: 'b-praise', title: 'Good progress', body: 'Hello {parent}, {student} has been doing great work lately. Well done! — {teacher}' }
];

export const PLACEHOLDERS = ['{parent}', '{student}', '{group}', '{teacher}'];

/** Replaces the placeholders; an empty value becomes a neutral word so no raw {braces} are ever sent. */
export function fillTemplate(body, { parent, student, group, teacher } = {}) {
  const map = { parent: parent || 'there', student: student || 'your child', group: group || '', teacher: teacher || 'the teacher' };
  return String(body || '').replace(/\{(parent|student|group|teacher)\}/g, (_, k) => map[k]).replace(/[ \t]{2,}/g, ' ').trim();
}

/** Digits for wa.me: 01012345678 -> 201012345678; "+20 101…" and "0020…" are handled; '' when unusable. */
export function whatsappNumber(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `20${d.slice(1)}`;
  return d.length >= 9 && d.length <= 15 ? d : '';
}

export const whatsappLink = (raw, text) => {
  const n = whatsappNumber(raw);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text || '')}` : '';
};

/** tel: link keeping digits and one leading +; '' when there is nothing to dial. */
export const telHref = (raw) => {
  const s = String(raw || '').trim();
  const d = `${s.startsWith('+') ? '+' : ''}${s.replace(/\D/g, '')}`;
  return d.replace('+', '').length >= 5 ? `tel:${d}` : '';
};
