import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import SiteLayout, { SI, useReveal } from './SiteLayout';
import '../../styles/hall.css';

const HOME_LIMIT = 11;

/** Hall of Fame entries (preset names + whatever the teacher added in the portal), newest class first. */
export function useHallOfFame() {
  return useApi(API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME, b => b.data?.hallOfFame || []);
}

const HofCard = ({ s, i }) => (
  <li className="hof-card rv" style={{ '--d': `${Math.min(i, 12) * 0.05}s` }}>
    <span className="hof-av" aria-hidden="true">{(s.name || '?').trim()[0]?.toUpperCase()}</span>
    <div>
      <b>{s.name}</b>
      <small>Class of {s.year || 'N/A'}</small>
    </div>
    <span className="hof-badge"><SI name="award" />IGCSE success</span>
  </li>
);

const JoinCard = ({ i }) => (
  <li className="rv" style={{ '--d': `${Math.min(i, 12) * 0.05}s` }}>
    <Link className="hof-card hof-join" to="/register">
      <span className="hof-av" aria-hidden="true">?</span>
      <div><b>You're next</b><small>Your name belongs here.</small></div>
      <span className="hof-badge hof-badge--cta">Claim your spot <SI name="arrow" /></span>
    </Link>
  </li>
);

/** Home-page section: the latest names, with a link to the full wall. */
export function HallSection() {
  const hof = useHallOfFame();
  const ref = useRef(null);
  const entries = hof.data || [];
  const shown = entries.slice(0, HOME_LIMIT);
  useReveal(ref, [entries.length]);

  return (
    <section id="hall" ref={ref} className="sec hof-sec deep" aria-labelledby="hall-title">
      <div className="wrap">
        <div className="center rv">
          <span className="eyebrow">Hall of Fame</span>
          <h2 className="h2" id="hall-title">Students who made it to the <em>top.</em></h2>
          <p className="lead">Real AT-ICT students, real results. Your name could be next.</p>
        </div>
        {hof.loading && !hof.data && <p className="lead center" role="status">Loading…</p>}
        {hof.error && !hof.data && <p className="lead center" role="alert">Couldn't load the Hall of Fame right now.</p>}
        {hof.data && (
          <ul className="hof-grid" aria-label="Hall of Fame students">
            {shown.map((s, i) => <HofCard key={s._id || s.name} s={s} i={i} />)}
            <JoinCard i={shown.length} />
          </ul>
        )}
        {entries.length > HOME_LIMIT && (
          <div className="center hof-more rv">
            <Link className="btn btn-o" to="/hall-of-fame">See all {entries.length} students<SI name="arrow" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

/** Full page: every student, searchable, filtered by class year. */
export default function HallOfFamePage() {
  const hof = useHallOfFame();
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const [year, setYear] = useState('all');

  const entries = useMemo(() => hof.data || [], [hof.data]);
  const years = useMemo(() => [...new Set(entries.map(e => e.year).filter(Boolean))].sort().reverse(), [entries]);
  const list = entries.filter(e => (year === 'all' || e.year === year) && e.name.toLowerCase().includes(q.trim().toLowerCase()));
  useReveal(ref, [list.length, year]);

  return (
    <SiteLayout>
      <Seo title="Hall of Fame" description="AT-ICT students who earned top IGCSE ICT grades." path="/hall-of-fame" />
      <section ref={ref} className="page-hero deep hof-page" style={{ minHeight: '100svh' }}>
        <div className="wrap">
          <div className="center">
            <span className="eyebrow">Hall of Fame</span>
            <h1 className="h2">Students who made it to the <em>top.</em></h1>
            <p className="lead">Real AT-ICT students, real results.</p>
            {hof.data && <p className="hof-count"><b>{entries.length}</b> student{entries.length === 1 ? '' : 's'} and counting</p>}
          </div>

          {entries.length > 1 && (
            <div className="hof-tools">
              <label className="hof-search">
                <SI name="search" />
                <span className="sr-only">Search students</span>
                <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…" />
              </label>
              {years.length > 1 && (
                <div className="hof-years" role="group" aria-label="Filter by class year">
                  {['all', ...years].map(y => (
                    <button key={y} type="button" className={y === year ? 'on' : ''} aria-pressed={y === year} onClick={() => setYear(y)}>
                      {y === 'all' ? 'All years' : `Class of ${y}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {hof.loading && !hof.data && <p className="lead center" role="status">Loading…</p>}
          {hof.error && !hof.data && <p className="lead center" role="alert">Couldn't load the Hall of Fame right now.</p>}
          {hof.data && !entries.length && <p className="lead center">The first names are coming soon.</p>}
          {hof.data && !!entries.length && !list.length && <p className="lead center" role="status">No students match your search.</p>}
          {hof.data && (
            <ul className="hof-grid" aria-label="Hall of Fame students">
              {list.map((s, i) => <HofCard key={s._id || s.name} s={s} i={i} />)}
              <JoinCard i={list.length} />
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
