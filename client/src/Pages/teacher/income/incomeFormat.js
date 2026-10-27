/** Formatting and small bits of logic for the Income dashboard. */

export const fmtMoney = (n, currency = 'EGP') => {
  const v = Number(n) || 0;
  const whole = Math.abs(v - Math.round(v)) < 0.005;
  return `${v.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })} ${currency}`;
};

/** Compact label for chart axes: 1,250 -> 1.3k */
export const fmtShort = (n) => {
  const v = Math.abs(Number(n) || 0);
  const s = v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v));
  return `${n < 0 ? '-' : ''}${s.replace('.0', '')}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthName = (key) => MONTHS[Number(String(key).slice(5, 7)) - 1] || key;
export const monthLong = (key) => {
  const [y, m] = String(key).split('-');
  return `${MONTHS[Number(m) - 1] || ''} ${y}`;
};

/** The period string the API expects, from the picker state. */
export function periodValue({ mode, month, year }) {
  if (mode === 'all') return 'all';
  if (mode === 'year') return String(year);
  return month;
}

export const currentMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

/** Human title for a period key: "October 2026", "2026", "All time". */
export function periodTitle(key) {
  if (key === 'all') return 'All time';
  if (/^\d{4}$/.test(key)) return key;
  const [y, m] = String(key).split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * Geometry for the month-by-month chart. Returns bars (income, expenses) and the profit line as pixel coordinates
 * inside a w x h plot, with the zero line, so the component only has to draw.
 */
export function chartScale(trend = [], { w = 680, h = 190 } = {}) {
  const values = trend.flatMap(t => [t.income, t.expenses, t.profit]);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = (max - min) || 1;
  const pad = span * 0.08;
  const top = max + (max > 0 ? pad : 0);
  const bottom = min - (min < 0 ? pad : 0);
  const range = (top - bottom) || 1;
  const y = (v) => Math.round(((top - v) / range) * h * 10) / 10;
  const band = trend.length ? w / trend.length : w;
  const bar = Math.min(22, band * 0.32);
  const zero = y(0);
  return {
    zero,
    ticks: [top, (top + bottom) / 2, bottom].map(v => ({ value: v, y: y(v) })),
    columns: trend.map((t, i) => {
      const cx = band * i + band / 2;
      return {
        month: t.month,
        cx,
        income: { x: cx - bar - 1, y: Math.min(y(t.income), zero), w: bar, h: Math.abs(zero - y(t.income)) },
        expenses: { x: cx + 1, y: Math.min(y(t.expenses), zero), w: bar, h: Math.abs(zero - y(t.expenses)) },
        profit: { x: cx, y: y(t.profit) }
      };
    })
  };
}
