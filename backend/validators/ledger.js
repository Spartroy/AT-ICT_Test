// Validates a manual income / expense entry typed by the teacher.

const KINDS = ['income', 'expense'];
const MAX_AMOUNT = 10000000;

/** { value } with clean fields, or { errors: [{ path, msg }] }. `student` is returned as given (the controller checks it exists). */
function cleanEntry(input = {}, now = new Date()) {
  const errors = [];
  const kind = String(input.kind || '').trim();
  if (!KINDS.includes(kind)) errors.push({ path: 'kind', msg: 'Choose income or expense' });

  const label = String(input.label || '').trim().replace(/\s+/g, ' ');
  if (!label) errors.push({ path: 'label', msg: kind === 'expense' ? 'Give the expense a category' : 'Say where the money came from' });
  else if (label.length > 60) errors.push({ path: 'label', msg: 'Keep it under 60 characters' });

  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) errors.push({ path: 'amount', msg: 'Enter an amount above zero' });
  else if (amount > MAX_AMOUNT) errors.push({ path: 'amount', msg: 'That amount is too large' });

  const date = input.date ? new Date(input.date) : new Date(now);
  if (Number.isNaN(date.getTime())) errors.push({ path: 'date', msg: 'The date is not valid' });
  else if (date.getTime() > now.getTime() + 366 * 86400000) errors.push({ path: 'date', msg: 'The date is too far ahead' });

  const note = String(input.note || '').trim().slice(0, 300);
  const student = kind === 'income' && input.student ? String(input.student) : undefined;

  if (errors.length) return { errors };
  return { value: { kind, label, amount, date, note, ...(student ? { student } : { student: undefined }) } };
}

module.exports = { cleanEntry, KINDS };
