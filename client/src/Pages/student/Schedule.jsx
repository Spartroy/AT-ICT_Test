import React, { useMemo, useState } from 'react';
import { Clock, BookOpen, Monitor, ClipboardCheck, CalendarDays } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, fmtDate } from '../../components/portal/kit';
import { WEEK, weekFromSchedule, typeChip, shortTime, sessionsAhead } from './scheduleUtils';

export default function Schedule() {
  const res = useApi(API_ENDPOINTS.STUDENT.SCHEDULE, b => b.data || {});
  const [view, setView] = useState('week');
  const days = res.data?.schedule?.schedule;
  const week = useMemo(() => weekFromSchedule(days), [days]);
  const upcoming = useMemo(() => sessionsAhead(days, 4), [days]);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const today = week[todayIdx];

  if (res.loading && !res.data) return <Loading label="Loading schedule…" />;
  if (res.error) return <ErrorNote error={res.error} onRetry={res.reload} />;

  const head = (
    <PageHead
      title="Weekly schedule"
      actions={
        <div className="seg" style={{ margin: 0 }} role="tablist" aria-label="Schedule view">
          {['week', 'day'].map(v => (
            <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'week' ? 'Week' : 'Day'}</button>
          ))}
        </div>
      }
    />
  );

  if (!res.data?.schedule) {
    return <>{head}<div className="card"><Empty icon={CalendarDays}>{res.data?.message || 'No schedule assigned yet. Contact your teacher.'}</Empty></div></>;
  }

  return (
    <>
      {head}
      {view === 'week' ? (
        <div className="card">
          <div className="week" id="wk2">
            {WEEK.map((d, i) => (
              <div className={`wd ${i === todayIdx ? 'today' : ''}`} key={d}>
                <small>{d.slice(0, 3)}</small>
                {week[i].length ? week[i].map((s, k) => (
                  <div className={`ev ${s.type === 'practical' ? 'pr' : 'th'}`} key={k}>
                    <b>{s.type}</b>{shortTime(s.startTime)}{s.topic ? <span className="ev-topic">{s.topic}</span> : null}
                  </div>
                )) : <span className="no" aria-label="No sessions">—</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <h3><Ic as={CalendarDays} />{WEEK[todayIdx]}</h3>
          {today.length ? today.map((s, k) => <SessionRow s={s} key={k} />) : <Empty icon={CalendarDays}>No sessions today.</Empty>}
        </div>
      )}

      <div className="sch-g">
        <div className="card">
          <h3><Ic as={Clock} />Today — {WEEK[todayIdx]}</h3>
          {today.length ? today.map((s, k) => <SessionRow s={s} key={k} />) : <Empty icon={Clock}>No sessions today.</Empty>}
        </div>
        <div className="card">
          <h3><Ic as={ClipboardCheck} />Upcoming sessions</h3>
          {upcoming.length ? (
            <div className="ups">
              {upcoming.map((s, k) => (
                <div className="up" key={k}>
                  <span className={`chip ${typeChip(s.type)}`}>{s.type}</span>
                  <b className="up-time">{shortTime(s.startTime)}</b>
                  <small>{s.when === 'Today' || s.when === 'Tomorrow' ? s.when : fmtDate(s.date, { weekday: 'short', month: 'short', day: 'numeric' })}{s.topic ? ` · ${s.topic}` : ''}</small>
                </div>
              ))}
            </div>
          ) : <Empty icon={ClipboardCheck}>Nothing in the next 7 days.</Empty>}
        </div>
      </div>
      {res.data.schedule.updatedAt && <p className="sub sch-updated">Last updated {fmtDate(res.data.schedule.updatedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
    </>
  );
}

function SessionRow({ s }) {
  const practical = s.type === 'practical';
  return (
    <div className={`next sess-${practical ? 'pr' : 'th'}`}>
      <span className="sess-ic"><Ic as={practical ? Monitor : BookOpen} /></span>
      <div><h4>{s.topic || `${practical ? 'Practical' : 'Theory'} session`}</h4><p>{shortTime(s.startTime)} — {shortTime(s.endTime)}</p></div>
      <span className={`chip ${typeChip(s.type)}`} style={{ marginLeft: 'auto' }}>{s.type}</span>
    </div>
  );
}
