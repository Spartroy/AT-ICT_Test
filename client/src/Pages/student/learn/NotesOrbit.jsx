import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookX } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { useReducedMotion } from '../../../hooks/useMediaQuery';
import useProgress from './useProgress';
import { PHASE_COLORS, chapterInfo, twoLines, orbitPositions } from './mapLogic';

const HUB_R = 54;
const HUB_LEN = 2 * Math.PI * HUB_R;

/** Interactive notes: each phase is a hub with its chapters orbiting it. */
export default function NotesOrbit() {
  const notes = useApi(API_ENDPOINTS.STUDENT.NOTES, b => {
    const g = b.data?.notes || {};
    return [1, 2, 3].map(p => [...(g[`phase${p}`] || [])].sort((a, c) => (a.chapter ?? 99) - (c.chapter ?? 99) || (a.order ?? 0) - (c.order ?? 0)));
  });
  const progress = useProgress();
  const toast = useToast();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [selId, setSelId] = useState(null);
  const [entered, setEntered] = useState(false);

  const items = useMemo(() => notes.data?.[phase] || [], [notes.data, phase]);
  const read = progress.notes;
  const readCount = items.filter(n => read.has(n._id)).length;
  const selected = items.find(n => n._id === selId) || items.find(n => !read.has(n._id)) || items[0];

  // Re-run the fly-out animation whenever the phase changes.
  useEffect(() => {
    if (reduced) return setEntered(true);
    setEntered(false);
    let inner;
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setEntered(true)); });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [phase, reduced, notes.data]);

  if (notes.loading && !notes.data) return <Loading label="Loading notes…" />;
  if (notes.error) return <ErrorNote error={notes.error} onRetry={notes.reload} />;

  const color = PHASE_COLORS[phase];
  const R = items.length > 5 ? 128 : 112;
  const positions = orbitPositions(items.length, R);
  const pre = entered ? '' : ' pre';
  const sel = selected ? chapterInfo(selected) : null;
  const selRead = selected ? read.has(selected._id) : false;

  const toggleRead = async () => {
    const ok = await progress.setDone('note', selected._id, !selRead);
    toast(ok ? (selRead ? 'Marked as unread' : 'Marked as read') : "Couldn't save. Try again.");
  };

  const onOrbKey = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelId(id);
    }
  };

  return (
    <>
      <div className="seg" role="tablist" aria-label="Phases">
        {[0, 1, 2].map(p => {
          const list = notes.data?.[p] || [];
          return (
            <button key={p} type="button" role="tab" aria-selected={p === phase} className={p === phase ? 'on' : ''} onClick={() => { setPhase(p); setSelId(null); }}>
              Phase {p + 1}<em className="oc">{list.filter(n => read.has(n._id)).length}/{list.length}</em>
            </button>
          );
        })}
      </div>

      {!items.length ? (
        <Empty icon={BookX}>No notes in this phase yet.</Empty>
      ) : (
        <div className="orbit">
          <div className="ostage">
            <svg viewBox="-200 -185 400 370" style={{ '--pc': color }} role="group" aria-label={`Phase ${phase + 1} chapters`}>
              <circle className="orbring" r={R} />
              {positions.map((pos, i) => (
                <line key={`l${items[i]._id}`} className={`ol${pre}`} x1="0" y1="0" x2={pos.x} y2={pos.y} style={{ '--d': `${(i * 0.07).toFixed(2)}s` }} />
              ))}
              <g className="hub" aria-hidden="true">
                <circle className="h" r="46" />
                <circle className="hr" r={HUB_R} />
                <circle className="hp" r={HUB_R} strokeDasharray={HUB_LEN} strokeDashoffset={HUB_LEN * (1 - readCount / items.length)} />
                <text y="-2" style={{ fontWeight: 700, fontSize: 13 }}>Phase {phase + 1}</text>
                <text y="14" style={{ fontSize: 10 }}>{readCount}/{items.length} read</text>
              </g>
              {items.map((n, i) => {
                const info = chapterInfo(n);
                const lines = twoLines(info.title);
                const isRead = read.has(n._id);
                return (
                  <g
                    key={n._id}
                    className={`orb${pre}${isRead ? ' rd' : ''}${n._id === selected?._id ? ' sel' : ''}`}
                    style={{ '--x': `${positions[i].x}px`, '--y': `${positions[i].y}px`, '--d': `${(0.15 + i * 0.07).toFixed(2)}s` }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={n._id === selected?._id}
                    aria-label={`Chapter ${info.num} ${info.title}${isRead ? ', read' : ''}`}
                    onClick={() => setSelId(n._id)}
                    onKeyDown={e => onOrbKey(e, n._id)}
                  >
                    <circle r="36" />
                    <text className="on" y="-15">{info.num}</text>
                    {lines.map((s, k) => <text key={k} className="ot" y={(lines.length === 2 ? -1 : 5) + k * 11}>{s}</text>)}
                    <g className="ck"><circle cx="27" cy="-27" r="10" /><path d="m22 -27 4 4 7-8" /></g>
                  </g>
                );
              })}
            </svg>
          </div>
          {sel && (
            <aside className="odet card" aria-live="polite">
              <div className="onum">Chapter {sel.num}</div>
              <h3 className="odet-title">{sel.title}</h3>
              <p className="sub">Interactive notes · {selRead ? <b className="ok">Read ✓</b> : 'Not read yet'}</p>
              <div className="oact">
                <button
                  type="button"
                  className="btn p"
                  disabled={!selected.linkUrl}
                  onClick={() => window.open(selected.linkUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Ic as={BookOpen} />{selected.linkUrl ? 'Open notes' : 'Notes coming soon'}
                </button>
                <button type="button" className="btn o" onClick={toggleRead}>{selRead ? 'Mark as unread' : 'Mark as read'}</button>
              </div>
            </aside>
          )}
        </div>
      )}
    </>
  );
}
