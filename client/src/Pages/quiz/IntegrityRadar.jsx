import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Radar, RefreshCw, ShieldAlert, Users, Eye, X, Flag, Volume2, VolumeX } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Ic } from '../../components/portal/kit';
import { sfx, unlockAudio } from './quizSound';
import '../../styles/quizgen.css';

const T = API_ENDPOINTS.THEORY_QUIZ.TEACHER;
const SWEEP_SECONDS = 60;
const RING = { none: [0.8, 0.94], low: [0.6, 0.76], medium: [0.38, 0.56], high: [0.14, 0.34] };
const RISK_LABEL = { none: 'Clear', low: 'Low', medium: 'Watch', high: 'Alert' };
// The same ladder the student sees: reminder, yellow card (pause), second yellow (marks off), red card (sent off)
const LEVEL = { clear: { label: '', n: 0 }, reminder: { label: 'Reminder', n: 1 }, yellow1: { label: 'Yellow card', n: 2 }, yellow2: { label: '2nd yellow', n: 3 }, red: { label: 'Red card', n: 4 } };

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

/** Where a student's blip sits: the angle is fixed per student, the distance from the centre shrinks as risk grows. */
export function blipPosition(id, risk) {
  const [lo, hi] = RING[risk] || RING.none;
  const r = lo + (hi - lo) * hash(`${id}r`);
  const a = hash(`${id}a`) * Math.PI * 2;
  return { x: 50 + Math.cos(a) * r * 46, y: 50 + Math.sin(a) * r * 46 };
}

const clock = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * The teacher's live anti-cheat screen. Scans every minute: who is sitting a quiz right now, who has been flagged,
 * and a log of every anomaly (tab switches, pastes, cards...). Students show as blips; the closer to the centre, the higher the risk.
 */
export default function IntegrityRadar({ onClose }) {
  const scan = useApi(`${T}/radar`, b => b.data);
  const [secs, setSecs] = useState(SWEEP_SECONDS);
  const [picked, setPicked] = useState(null);
  const [fresh, setFresh] = useState(() => new Set());
  const [filter, setFilter] = useState('all'); // all | live | flagged
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  const seen = useRef(null);
  const reload = scan.reload;

  useEffect(() => { unlockAudio(); }, []);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s <= 1 ? SWEEP_SECONDS : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (secs === SWEEP_SECONDS) reload(); }, [secs, reload]);

  const data = scan.data;
  const feed = useMemo(() => data?.feed || [], [data]);
  useEffect(() => {
    if (!data) return undefined;
    const ids = new Set(feed.map(f => f.id));
    if (seen.current) {
      const added = new Set([...ids].filter(id => !seen.current.has(id)));
      if (added.size) {
        // Alarm for new rule-breaking: the worst new incident decides how loud it is
        const worst = feed.filter(f => added.has(f.id) && (f.kind === 'card' || f.kind === 'violation')).reduce((m, f) => (f.severity === 'high' ? 'red' : f.severity === 'medium' ? (m === 'red' ? m : 'yellow1') : m === 'red' || m === 'yellow1' ? m : 'reminder'), '');
        if (worst && !mutedRef.current) sfx.alarm(worst);
        setFresh(added); const t = setTimeout(() => setFresh(new Set()), 8000); seen.current = ids; return () => clearTimeout(t); }
    }
    seen.current = ids;
    return undefined;
  }, [data, feed]);

  const rows = useMemo(() => {
    const all = data?.rows || [];
    if (filter === 'live') return all.filter(r => r.status === 'live');
    if (filter === 'flagged') return all.filter(r => r.risk === 'medium' || r.risk === 'high');
    return all;
  }, [data, filter]);
  const shownFeed = picked ? feed.filter(f => f.attemptId === picked) : feed;
  const sel = (data?.rows || []).find(r => r.attemptId === picked);
  const t = data?.totals || { live: 0, flagged: 0, cards: 0, away: 0 };

  return (
    <div className="sg-screen qz-screen qz-radar" role="dialog" aria-modal="true" aria-label="Integrity radar">
      <div className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={onClose}><Ic as={X} />Close</button>
        <h2 className="sg-screen-title"><Ic as={Radar} /> Integrity radar</h2>
        <div className="sg-screen-acts">
          <span className="qz-next hide-sm">Next sweep in <b>{secs}s</b></span>
          <button type="button" className="btn o sm" onClick={() => { setMuted(m => !m); unlockAudio(); }} aria-pressed={muted} aria-label={muted ? 'Unmute alarm' : 'Mute alarm'}><Ic as={muted ? VolumeX : Volume2} />{muted ? 'Muted' : 'Alarm on'}</button>
          <button type="button" className="btn p sm" onClick={() => { unlockAudio(); reload(); setSecs(SWEEP_SECONDS); }} disabled={scan.loading}><Ic as={RefreshCw} className={scan.loading ? 'i qz-spin' : 'i'} />Scan now</button>
        </div>
      </div>
      <div className="sg-screen-body">
        <div className="sg-screen-inner qz-rd-grid">
          <section className="qz-rd-scope" aria-label="Radar">
            <div className="qz-scope">
              <div className="qz-ring r1" /><div className="qz-ring r2" /><div className="qz-ring r3" /><div className="qz-ring r4" />
              <div className="qz-cross h" /><div className="qz-cross v" />
              <div className="qz-sweep" />
              <span className="qz-core" aria-hidden="true" />
              {(data?.rows || []).map(r => {
                const pos = blipPosition(r.attemptId, r.risk);
                return (
                  <button key={r.attemptId} type="button" className={`qz-blip ${r.risk} ${r.status} lv-${r.level} ${picked === r.attemptId ? 'sel' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => setPicked(p => (p === r.attemptId ? null : r.attemptId))} aria-label={`${r.student}, ${LEVEL[r.level]?.label || RISK_LABEL[r.risk]}${r.status === 'live' ? ', sitting now' : ''}`}>
                    <i /><span>{r.student.split(' ')[0]}{LEVEL[r.level]?.n ? ` · ${LEVEL[r.level].label}` : ''}</span>
                  </button>
                );
              })}
              {!data?.rows?.length && <p className="qz-scope-empty">{scan.loading ? 'Scanning…' : 'Nothing on the radar. Quizzes taken in the last 48 hours show up here.'}</p>}
            </div>
            <div className="qz-legend"><span className="none">Clear</span><span className="low">Low</span><span className="medium">Watch</span><span className="high">Alert</span><small>Closer to the centre = higher risk</small></div>
          </section>

          <section className="qz-rd-side">
            <div className="qz-stats">
              <div><Users size={16} /><b>{t.live}</b><small>sitting now</small></div>
              <div className={t.alarms ? 'alarm' : t.flagged ? 'warn' : ''}><ShieldAlert size={16} /><b>{t.alarms || t.flagged}</b><small>{t.alarms ? 'rule breakers' : 'flagged'}</small></div>
              <div className={t.cards ? 'warn' : ''}><Flag size={16} /><b>{t.cards}</b><small>cards given</small></div>
              <div className={t.away ? 'warn' : ''}><Eye size={16} /><b>{t.away}</b><small>away now</small></div>
            </div>

            <div className="qz-rd-head"><h3>Students</h3>
              <div className="qz-pills" role="group" aria-label="Filter">{[['all', 'All'], ['live', 'Sitting now'], ['flagged', 'Flagged']].map(([k, l]) => <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
            </div>
            <ul className="qz-rd-list">
              {rows.map(r => (
                <li key={r.attemptId} className={`${picked === r.attemptId ? 'sel' : ''} lv-${r.level}`}>
                  <button type="button" onClick={() => setPicked(p => (p === r.attemptId ? null : r.attemptId))}>
                    <span className={`qz-dot ${r.risk}`} />
                    <span className="n"><b>{r.student}</b><small>{r.quiz}{r.group ? ` · ${r.group}` : ''}</small></span>
                    <span className="m">
                      {r.status === 'live' && <em className="live">{r.away ? 'away' : 'live'}</em>}
                      {LEVEL[r.level]?.n > 0 && <em className={`lvl ${r.level}`}>{LEVEL[r.level].label}</em>}
                      {r.tabLeaves > 0 && <em>{r.tabLeaves} tab</em>}
                      {r.pastes > 0 && <em>{r.pastes} paste</em>}
                    </span>
                  </button>
                </li>
              ))}
              {!rows.length && <li className="empty">No students match.</li>}
            </ul>

            <div className="qz-rd-head"><h3>Anomaly log{sel ? ` · ${sel.student}` : ''}</h3>{picked && <button type="button" className="btn o sm" onClick={() => setPicked(null)}>Show all</button>}</div>
            <ol className="qz-log" aria-live="polite">
              {shownFeed.map(f => (
                <li key={f.id} className={`${f.severity} ${fresh.has(f.id) ? 'new' : ''}`}>
                  <time>{clock(f.at)}</time><i />
                  <span><b>{f.student}</b> {f.text}<small>{f.quiz}</small></span>
                </li>
              ))}
              {!shownFeed.length && <li className="empty">No anomalies logged. All quiet.</li>}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
