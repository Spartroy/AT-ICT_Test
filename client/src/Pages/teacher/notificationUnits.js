// Reminder times are stored in minutes; the settings screen shows them as "2 hours", "1 day", "30 minutes".

export const UNITS = [
  { id: 'minutes', label: 'minutes', factor: 1 },
  { id: 'hours', label: 'hours', factor: 60 },
  { id: 'days', label: 'days', factor: 1440 }
];

/** 120 → { value: 2, unit: 'hours' }; picks the largest unit that divides evenly. */
export function splitMinutes(total) {
  const unit = [...UNITS].reverse().find(u => total % u.factor === 0) || UNITS[0];
  return { value: total / unit.factor, unit: unit.id };
}

/** { value: 2, unit: 'hours' } → 120 (NaN when the value is empty or not a whole number). */
export function toMinutes({ value, unit }) {
  const n = Number(value);
  const factor = UNITS.find(u => u.id === unit)?.factor || 1;
  return Number.isInteger(n) && n > 0 ? n * factor : NaN;
}
