import React, { useEffect, useState } from 'react';
import { FileBarChart, Printer } from 'lucide-react';
import { Empty, ErrorNote, Ic, Loading } from '../portal/kit';
import ReportCard from './ReportCard';
import { weekPercent, weekRange } from './reportLogic';

const plain = (text, params) => String(text).replace(/\{(\w+)\}/g, (_, k) => (params && params[k] !== undefined ? params[k] : `{${k}}`));

/**
 * Student/parent side: the published reports of a child, newest first, with a strip of past weeks to flip between.
 * `state` is a useApi result whose data is { reports, student? }.
 */
export default function ReportsView({ state, name, t = plain, locale }) {
  const reports = state.data?.reports || [];
  const [picked, setPicked] = useState(null);
  // Follow the newest report until the reader chooses another week
  useEffect(() => { setPicked(null); }, [reports[0]?._id]);

  if (state.loading && !state.data) return <Loading label={t('Loading reports…')} />;
  if (state.error) return <ErrorNote error={state.error} onRetry={state.reload} />;
  if (!reports.length) return <div className="card"><Empty icon={FileBarChart}>{t('No weekly reports yet. They appear here as soon as your teacher publishes them.')}</Empty></div>;

  const current = reports.find(r => r._id === picked) || reports[0];
  const history = [...reports].slice(0, 10).reverse();

  return (
    <div className="rp-view">
      <div className="rp-toolbar">
        <div className="rp-history" role="group" aria-label={t('Choose a week')}>
          {history.map(r => {
            const pct = weekPercent(r);
            return (
              <button key={r._id} type="button" className={`rp-wk ${r._id === current._id ? 'on' : ''}`} aria-pressed={r._id === current._id} onClick={() => setPicked(r._id)} title={weekRange(r.weekStart, locale)}>
                <span className="rp-wk-bar"><i style={{ height: `${Math.max(6, pct || 0)}%` }} /></span>
                <small>{t('W{n}', { n: r.weekNumber })}</small>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn o sm rp-print" onClick={() => window.print()}><Ic as={Printer} />{t('Print / save as PDF')}</button>
      </div>
      <ReportCard report={current} reports={reports} name={name} t={t} locale={locale} />
    </div>
  );
}
