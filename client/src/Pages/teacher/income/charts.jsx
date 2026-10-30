import React from 'react';
import { chartScale, fmtMoney, fmtShort, monthLong, monthName } from './incomeFormat';

/** Income and expense bars for each month with the profit line over them. Plain SVG, readable with a screen reader. */
export function TrendChart({ trend = [], highlight }) {
  const W = 680;
  const H = 190;
  const s = chartScale(trend, { w: W, h: H });
  const line = s.columns.map(c => `${c.profit.x},${c.profit.y}`).join(' ');
  const empty = !trend.some(t => t.income || t.expenses);

  return (
    <figure className="inc-chart">
      <div className="inc-legend" aria-hidden="true">
        <span><i className="in" />Income</span><span><i className="ex" />Expenses</span><span><i className="pr" />Profit</span>
      </div>
      <svg viewBox={`-40 -8 ${W + 48} ${H + 36}`} role="img" aria-label={`Income, expenses and profit for ${trend.length} months`} preserveAspectRatio="xMidYMid meet">
        {s.ticks.map((t, i) => (
          <g key={i}>
            <line x1="0" x2={W} y1={t.y} y2={t.y} className="grid" />
            <text x="-6" y={t.y + 4} textAnchor="end" className="ax">{fmtShort(t.value)}</text>
          </g>
        ))}
        <line x1="0" x2={W} y1={s.zero} y2={s.zero} className="zero" />
        {s.columns.map(c => (
          <g key={c.month} className={c.month === highlight ? 'col on' : 'col'}>
            <title>{`${monthLong(c.month)}: income ${fmtMoney(trend.find(t => t.month === c.month).income)}, expenses ${fmtMoney(trend.find(t => t.month === c.month).expenses)}, profit ${fmtMoney(trend.find(t => t.month === c.month).profit)}`}</title>
            {c.month === highlight && <rect x={c.cx - 26} y="0" width="52" height={H} rx="10" className="hl" />}
            <rect x={c.income.x} y={c.income.y} width={c.income.w} height={c.income.h} rx="3" className="bar in" />
            <rect x={c.expenses.x} y={c.expenses.y} width={c.expenses.w} height={c.expenses.h} rx="3" className="bar ex" />
            <text x={c.cx} y={H + 18} textAnchor="middle" className="ax">{monthName(c.month)}</text>
          </g>
        ))}
        {s.columns.length > 1 && <polyline points={line} className="pline" />}
        {s.columns.map(c => <circle key={c.month} cx={c.profit.x} cy={c.profit.y} r="3.5" className="pdot" />)}
      </svg>
      {empty && <figcaption className="inc-empty">Nothing recorded in these months yet.</figcaption>}
      <table className="sr-only">
        <caption>Monthly income, expenses and profit</caption>
        <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Profit</th></tr></thead>
        <tbody>{trend.map(t => <tr key={t.month}><td>{monthLong(t.month)}</td><td>{t.income}</td><td>{t.expenses}</td><td>{t.profit}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars for a ranking. items: [{ key, label, value, right? }]; the longest bar is the biggest value. */
export function BarList({ items = [], tone = 'in', empty = 'Nothing yet.', format = fmtMoney }) {
  if (!items.length) return <p className="inc-none">{empty}</p>;
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <ol className="inc-bars">
      {items.map((it, i) => (
        <li key={it.key || it.label}>
          <span className="rk">{i + 1}</span>
          <div className="bd">
            <div className="tx"><b>{it.label}</b><span>{it.right ?? format(it.value)}</span></div>
            <div className="trk" aria-hidden="true"><i className={tone} style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }} /></div>
          </div>
        </li>
      ))}
    </ol>
  );
}
