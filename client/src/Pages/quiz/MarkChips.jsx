import React from 'react';

/** The marks a teacher can pick for a question worth `max`: halves for small questions, whole marks, or quarters of the total. */
export function chipValues(max) {
  const m = Number(max) || 0;
  const out = [];
  if (m <= 4) for (let v = 0; v <= m; v += 0.5) out.push(v);
  else if (m <= 12) for (let v = 0; v <= m; v += 1) out.push(v);
  else [0, 0.25, 0.5, 0.75, 1].forEach(f => out.push(Math.round(m * f * 2) / 2));
  return [...new Set(out)];
}

export const markText = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const whole = Math.floor(n);
  if (n === whole) return String(n);
  return whole ? `${whole}½` : '½';
};

/** Quick-pick chips for a mark: tap a number instead of typing. Tapping the chosen chip again clears it. */
export default function MarkChips({ value, max, onChange, label }) {
  const chosen = value === '' || value === undefined || value === null ? null : Number(value);
  const values = chipValues(max);
  const custom = chosen !== null && !values.includes(chosen);
  return (
    <div className="qz-chips" role="radiogroup" aria-label={label}>
      {values.map(v => (
        <button key={v} type="button" role="radio" aria-checked={chosen === v} className={`${chosen === v ? 'on' : ''} ${v === Number(max) ? 'full' : ''} ${v === 0 ? 'zero' : ''}`} onClick={() => onChange(chosen === v ? '' : v)}>{markText(v)}</button>
      ))}
      {custom && <button type="button" role="radio" aria-checked className="on custom" onClick={() => onChange('')}>{markText(chosen)}</button>}
    </div>
  );
}
