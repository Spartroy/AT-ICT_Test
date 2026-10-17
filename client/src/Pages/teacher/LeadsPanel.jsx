import React, { useMemo, useState } from 'react';
import { Download, MessageCircle, Phone, Trash2, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, SearchBox, fmtDateTime } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { apiError } from './modals/form';

const VARIANT_NAME = { A: 'A · ask first', B: 'B · ask after ~20s', none: 'No test' };

/** Number for wa.me: Egyptian local 01… becomes 201…; +20… loses the plus. */
const waNumber = (phone) => {
  const d = String(phone).replace(/\D/g, '');
  return d.startsWith('0') ? `20${d.slice(1)}` : d;
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Students › Leads: everyone who left a name and number for a free sample, and how each opt-in design is doing. */
export default function LeadsPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const res = useApi(`${API_ENDPOINTS.TEACHER_SAMPLES}/leads`, b => b.data);
  const [q, setQ] = useState('');

  const leads = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (res.data?.leads || []).filter(l => !term || `${l.name} ${l.phone} ${l.samples.join(' ')}`.toLowerCase().includes(term));
  }, [res.data, q]);

  if (res.loading && !res.data) return <Loading label="Loading leads…" />;
  if (res.error && !res.data) return <ErrorNote error={res.error} onRetry={res.reload} />;
  const d = res.data;
  const [a, b] = d.funnel;
  const enough = a.opened >= 30 && b.opened >= 30;
  const leader = a.rate !== null && b.rate !== null && a.rate !== b.rate ? (a.rate > b.rate ? 'A' : 'B') : null;

  const toggle = async (l) => {
    try { await api.patch(`${API_ENDPOINTS.TEACHER_SAMPLES}/leads/${l.id}`, { contacted: !l.contacted }); res.reload(); } catch (err) { toast(apiError(err)); }
  };
  const remove = async (l) => {
    if (!(await confirm({ title: `Delete ${l.name}?`, body: 'Their details are removed.', confirmLabel: 'Delete' }))) return;
    try { await api.del(`${API_ENDPOINTS.TEACHER_SAMPLES}/leads/${l.id}`); toast('Lead deleted'); res.reload(); } catch (err) { toast(apiError(err)); }
  };
  const exportCsv = () => {
    const rows = [['Name', 'Phone', 'Samples', 'Form version', 'Date', 'Contacted'], ...d.leads.map(l => [l.name, l.phone, l.samples.join('; '), l.variant, new Date(l.createdAt).toISOString(), l.contacted ? 'yes' : 'no'])];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'free-sample-leads.csv';
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="card" aria-labelledby="ld-test">
        <h3 id="ld-test" style={{ marginTop: 0 }}>Which form gets more sign-ups?</h3>
        <div className="ld-table" role="table" aria-label="Opt-in test results">
          <div className="ld-r head" role="row"><span role="columnheader">Version</span><span role="columnheader">Opened a sample</span><span role="columnheader">Saw the form</span><span role="columnheader">Signed up</span><span role="columnheader">Sign-up rate</span></div>
          {d.funnel.map(v => (
            <div className={`ld-r ${leader === v.variant && enough ? 'win' : ''}`} role="row" key={v.variant}>
              <span role="cell"><b>{VARIANT_NAME[v.variant]}</b></span>
              <span role="cell">{v.opened}</span>
              <span role="cell">{v.prompted}</span>
              <span role="cell">{v.submitted}</span>
              <span role="cell"><b>{v.rate === null ? '—' : `${v.rate}%`}</b></span>
            </div>
          ))}
        </div>
        <p className="sub ld-note">
          {enough
            ? leader ? `Version ${leader} is ahead. Switch Library › Free samples to “Always ${leader}” once the gap holds for a week.` : 'The two versions are level so far.'
            : 'Not enough visitors yet to call a winner. Wait for about 100 opens per version; early numbers swing a lot.'}
        </p>
      </section>

      <div className="card">
        <div className="ld-head">
          <h3 style={{ margin: 0 }}>{d.total} lead{d.total === 1 ? '' : 's'}</h3>
          <div className="ld-tools">
            <SearchBox value={q} onChange={setQ} placeholder="Search name, phone or sample…" label="Search leads" />
            <button type="button" className="btn o sm" onClick={exportCsv} disabled={!d.total}><Ic as={Download} />Export CSV</button>
          </div>
        </div>
        {!leads.length ? <Empty icon={Users}>{d.total ? 'No leads match your search.' : 'No leads yet. They appear here when visitors open a free sample.'}</Empty> : (
          <ul className="ld-list">
            {leads.map(l => (
              <li key={l.id} className={l.contacted ? 'done' : ''}>
                <div className="ld-who">
                  <b>{l.name}</b>
                  <small className="sub">{l.phone} · {fmtDateTime(l.createdAt)}{l.samples.length ? ` · ${l.samples.join(', ')}` : ''}</small>
                </div>
                <span className="chip c-gy">{l.variant === 'none' ? '—' : `Form ${l.variant}`}</span>
                <span className="lact">
                  <a className="btn o sm" href={`https://wa.me/${waNumber(l.phone)}`} target="_blank" rel="noopener noreferrer"><Ic as={MessageCircle} />WhatsApp</a>
                  <a className="ib sm" href={`tel:${l.phone}`} aria-label={`Call ${l.name}`}><Ic as={Phone} /></a>
                  <label className="cb ld-done"><input type="checkbox" checked={l.contacted} onChange={() => toggle(l)} /><span /> Contacted</label>
                  <button type="button" className="ib sm dng" aria-label={`Delete ${l.name}`} onClick={() => remove(l)}><Ic as={Trash2} /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
