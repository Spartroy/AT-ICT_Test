import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Download, Hourglass, Medal, TrendingDown, Wallet } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { downloadFile } from '../../../lib/api';
import { Chips, Empty, ErrorNote, Ic, Loading, Stat } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { BarList, TrendChart } from './charts';
import EntryDialog from './EntryDialog';
import { currentMonth, fmtMoney, periodTitle, periodValue } from './incomeFormat';

const MODES = [{ id: 'month', label: 'Month' }, { id: 'year', label: 'Year' }, { id: 'all', label: 'All time' }];

/** Income › Overview: profit, trend, who pays most and least, who owes, where money comes from and goes, next month. */
export default function Overview() {
  const toast = useToast();
  const now = new Date();
  const [pick, setPick] = useState({ mode: 'month', month: currentMonth(now), year: now.getFullYear() });
  const [dialog, setDialog] = useState(null); // 'income' | 'expense'
  const period = periodValue(pick);
  const sum = useApi(`${API_ENDPOINTS.TEACHER_INCOME}/summary?period=${period}`, b => b.data || {});
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i), []); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => downloadFile(`${API_ENDPOINTS.TEACHER_INCOME}/export?period=${period}`, `income-${period}.csv`)
    .catch(err => toast(err.message || "Couldn't export"));

  const d = sum.data;
  const t = d?.totals || {};
  const money = (n) => fmtMoney(n);
  const nothing = d && !t.income && !t.expenses;

  return (
    <>
      <div className="inc-bar">
        <Chips items={MODES} value={pick.mode} onChange={mode => setPick(p => ({ ...p, mode }))} label="Period" />
        {pick.mode === 'month' && <input className="inp inc-pick" type="month" value={pick.month} max={currentMonth(now)} onChange={e => e.target.value && setPick(p => ({ ...p, month: e.target.value }))} aria-label="Month" />}
        {pick.mode === 'year' && (
          <select className="inp inc-pick" value={pick.year} onChange={e => setPick(p => ({ ...p, year: Number(e.target.value) }))} aria-label="Year">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <span className="sp" />
        <button type="button" className="btn o sm" onClick={() => setDialog('income')}><Ic as={ArrowDownLeft} />Add income</button>
        <button type="button" className="btn o sm" onClick={() => setDialog('expense')}><Ic as={ArrowUpRight} />Add expense</button>
        <button type="button" className="btn o sm" onClick={exportCsv}><Ic as={Download} />Export CSV</button>
      </div>

      {sum.loading && !d && <Loading label="Loading the numbers…" />}
      {sum.error && <ErrorNote error={sum.error} onRetry={sum.reload} />}

      {d && (
        <>
          <p className="inc-title">{periodTitle(period)}</p>
          <div className="g4">
            <Stat icon={ArrowDownLeft} label="Income" value={money(t.income)} note={<small className="faint">{money(t.fromPlans)} from plans · {money(t.fromManual)} manual</small>} />
            <Stat icon={ArrowUpRight} label="Expenses" value={money(t.expenses)} note={<small className="faint">{d.expenseByCategory?.length ? `${d.expenseByCategory.length} categor${d.expenseByCategory.length === 1 ? 'y' : 'ies'}` : 'None recorded'}</small>} />
            <Stat icon={Wallet} label="Profit" value={<span className={t.profit < 0 ? 'bad' : t.profit > 0 ? 'ok' : ''}>{money(t.profit)}</span>} note={<small className="faint">{t.margin === null ? 'No income yet' : `${t.margin}% margin`}</small>} />
            <Stat icon={Hourglass} label="Collection rate" value={d.collection?.rate === null || d.collection?.rate === undefined ? '—' : `${d.collection.rate}%`}
              note={<small className="faint">{d.collection?.billed ? `${money(d.collection.collected)} of ${money(d.collection.billed)} billed` : 'Nothing was due'}{d.collection?.avgDaysToPay !== null && d.collection?.avgDaysToPay !== undefined ? ` · pays in ${d.collection.avgDaysToPay} days` : ''}</small>} />
          </div>

          <div className="card">
            <h3><Ic as={Wallet} />Month by month<small className="inc-sub">Last 12 months</small></h3>
            <TrendChart trend={d.trend} highlight={pick.mode === 'month' ? period : undefined} />
          </div>

          {nothing && <div className="card"><Empty icon={Wallet}>Nothing recorded for {periodTitle(period)}. Confirm a payment proof or add income or an expense to see the numbers.</Empty></div>}

          <div className="g2">
            <div className="card">
              <h3><Ic as={Medal} />Top paying students</h3>
              <BarList tone="in" empty="No payments confirmed in this period." items={(d.topPayers || []).map(p => ({ key: p.id, label: p.name, value: p.amount }))} />
            </div>
            <div className="card">
              <h3><Ic as={TrendingDown} />Lowest paying students</h3>
              <BarList tone="ex" empty="No students yet." items={(d.lowestPayers || []).map(p => ({ key: p.id, label: p.name, value: p.amount, right: p.amount ? money(p.amount) : 'Nothing paid' }))} />
            </div>
          </div>

          <div className="g2">
            <div className="card">
              <h3><Ic as={ArrowDownLeft} />Income by source</h3>
              <BarList tone="in" empty="No income in this period." items={(d.bySource || []).map(s => ({ label: s.label, value: s.amount, right: `${money(s.amount)} · ${s.share}%` }))} />
            </div>
            <div className="card">
              <h3><Ic as={ArrowUpRight} />Expenses by category</h3>
              <BarList tone="ex" empty="No expenses in this period." items={(d.expenseByCategory || []).map(s => ({ label: s.label, value: s.amount, right: `${money(s.amount)} · ${s.share}%` }))} />
            </div>
          </div>

          <div className="g2">
            <div className="card">
              <h3><Ic as={Hourglass} />Still owed<small className="inc-sub">{d.outstanding?.count ? `${d.outstanding.count} open · ${money(d.outstanding.total)}` : ''}</small></h3>
              {!d.outstanding?.items?.length && <Empty icon={Wallet}>Nobody owes anything right now.</Empty>}
              <ul className="inc-owed">
                {(d.outstanding?.items || []).map(o => (
                  <li key={o.id}>
                    <span><b>{o.name}</b><small>{o.description || 'Payment plan'}</small></span>
                    <span className="amt">{money(o.amount)}</span>
                    <span className={`chip ${o.daysLate ? 'c-rd' : 'c-gy'}`}>{o.daysLate ? `${o.daysLate} day${o.daysLate === 1 ? '' : 's'} late` : 'Not due yet'}</span>
                  </li>
                ))}
              </ul>
              {d.outstanding?.overdue > 0 && <p className="inc-foot bad">{money(d.outstanding.overdue)} is overdue.</p>}
            </div>
            <div className="card inc-forecast">
              <h3><Ic as={CalendarClock} />Next month</h3>
              <p className="inc-big">{money(d.forecast?.expected)}</p>
              <p className="sub">{d.forecast?.count ? `expected from ${d.forecast.count} payment plan${d.forecast.count === 1 ? '' : 's'} due in ${periodTitle(d.forecast.month)}.` : `No payment plans are due in ${periodTitle(d.forecast?.month || period)} yet.`}</p>
              {d.forecast?.carryCount > 0 && <p className="inc-foot">Plus <b>{money(d.forecast.carryOver)}</b> still unpaid from earlier ({d.forecast.carryCount}).</p>}
              <small className="sub">Counts open plans only. Cash and workshops you have not entered yet are not included.</small>
            </div>
          </div>
        </>
      )}

      <EntryDialog open={!!dialog} kind={dialog} suggestions={dialog ? d?.suggestions?.[dialog] || [] : []} onClose={() => setDialog(null)} onSaved={sum.reload} />
    </>
  );
}
