import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, BookOpen } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, Empty, ErrorNote, Ic, Loading, fmtDate } from '../../../components/portal/kit';
import { useConfirm, useToast } from '../../../components/portal/PortalUI';
import { apiError } from '../modals/form';
import EntryDialog from './EntryDialog';
import { currentMonth, fmtMoney, periodTitle } from './incomeFormat';

const KINDS = [{ id: '', label: 'All' }, { id: 'income', label: 'Income' }, { id: 'expense', label: 'Expenses' }];

/** Income › Income & expenses: everything typed in by hand, with add, edit and delete. */
export default function Entries() {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [all, setAll] = useState(false);
  const [dialog, setDialog] = useState(null); // { kind, entry? }
  const period = all ? '' : month;
  const list = useApi(`${API_ENDPOINTS.TEACHER_INCOME}/entries?${new URLSearchParams({ ...(kind && { kind }), ...(period && { period }) })}`, b => b.data || {});

  const remove = async (e) => {
    if (!(await confirm({ title: `Delete this ${e.kind}?`, body: `${e.label}: ${fmtMoney(e.amount, e.currency)}`, confirmLabel: 'Delete' }))) return;
    try { await api.del(`${API_ENDPOINTS.TEACHER_INCOME}/entries/${e.id}`); toast('Deleted'); list.reload(); } catch (err) { toast(apiError(err)); }
  };

  const entries = list.data?.entries || [];
  const total = entries.reduce((n, e) => n + (e.kind === 'income' ? e.amount : -e.amount), 0);

  return (
    <>
      <div className="inc-bar">
        <Chips items={KINDS} value={kind} onChange={setKind} label="Type" />
        {!all && <input className="inp inc-pick" type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} aria-label="Month" />}
        <button type="button" className={`ch ${all ? 'on' : ''}`} aria-pressed={all} onClick={() => setAll(a => !a)}>All time</button>
        <span className="sp" />
        <button type="button" className="btn o sm" onClick={() => setDialog({ kind: 'income' })}><Ic as={ArrowDownLeft} />Add income</button>
        <button type="button" className="btn p sm" onClick={() => setDialog({ kind: 'expense' })}><Ic as={ArrowUpRight} />Add expense</button>
      </div>

      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && !entries.length && <div className="card"><Empty icon={BookOpen}>Nothing entered for {all ? 'any period' : periodTitle(month)}. Use Add income or Add expense. Payment plans show up in the Overview by themselves.</Empty></div>}
      {!!entries.length && (
        <div className="card inc-list">
          <h3>{all ? 'All entries' : periodTitle(month)}<small className="inc-sub">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · net <b className={total < 0 ? 'bad' : 'ok'}>{fmtMoney(total)}</b></small></h3>
          {entries.map(e => (
            <div className="inc-row" key={e.id}>
              <span className={`inc-ic ${e.kind}`}><Ic as={e.kind === 'income' ? ArrowDownLeft : ArrowUpRight} /></span>
              <div className="inc-main">
                <b>{e.label}</b>
                <small>{fmtDate(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}{e.student ? ` · from ${e.student.name}` : ''}{e.note ? ` · ${e.note}` : ''}</small>
              </div>
              <b className={`inc-amt ${e.kind}`}>{e.kind === 'expense' ? '−' : '+'}{fmtMoney(e.amount, e.currency)}</b>
              <button type="button" className="ib sm" aria-label={`Edit ${e.label}`} onClick={() => setDialog({ kind: e.kind, entry: e })}><Ic as={Pencil} /></button>
              <button type="button" className="ib sm dng" aria-label={`Delete ${e.label}`} onClick={() => remove(e)}><Ic as={Trash2} /></button>
            </div>
          ))}
        </div>
      )}

      <EntryDialog open={!!dialog} kind={dialog?.kind} entry={dialog?.entry} suggestions={dialog ? list.data?.suggestions?.[dialog.kind] || [] : []} onClose={() => setDialog(null)} onSaved={list.reload} />
    </>
  );
}
