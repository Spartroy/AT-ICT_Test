import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookX, CheckCircle2, RotateCcw } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { useReducedMotion } from '../../../hooks/useMediaQuery';
import ResourceViewer from '../../../components/portal/viewer/ResourceViewer';
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
  const [readyPhase, setReadyPhase] = useState(-1);
  const [reading, setReading] = useState(null);

  const items = useMemo(() => notes.data?.[phase] || [], [notes.data, phase]);
  const read = progress.notes;
  const readCount = items.filter(n => read.has(n._id)).length;
  const selected = items.find(n => n._id === selId) || items.find(n => !read.has(n._id)) || items[0];

  // Chapters fly out of the hub every time a phase is shown. The "pre" state is derived from the phase
  // (not from a flag reset in an effect), so a new phase never flashes fully drawn before animating.
  const entered = reduced || (readyPhase === phase && !!notes.data);
  useEffect(() => {
    if (reduced || !notes.data) return undefined;
    // A short timeout (not requestAnimationFrame) so the "pre" frame is always painted first, even in throttled tabs.
    const t = setTimeout(() => setReadyPhase(phase), 60);
    return () => clearTimeout(t);
  }, [phase, reduced, notes.data]);

  if (notes.loading && !notes.data) return <Loading label="Loading notes…" />;
  if (notes.error) return <ErrorNote error={notes.error} onRetry={notes.reload} />;

  const color = PHASE_COLORS[phase];
  const R = items.length > 5 ? 128 : 112;
  const positions = orbitPositions(items.length, R);
  const pre = entered ? '' : ' pre';
  const sel = selected ? chapterInfo(selected) : null;
  const selRead = selected ? read.has(selected._id) : false;

  // Clicking a chapter opens its notes in a wide frame inside the portal.
  const openChapter = (n) => {
    setSelId(n._id);
    if (n.linkUrl) setReading(n);
    else toast('These notes are coming soon.');
  };

  const onOrbKey = (e, n) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openChapter(n);
    }
  };

  const toggleReadOf = async (n) => {
    const was = read.has(n._id);
    const ok = await progress.setDone('note', n._id, !was);
    toast(ok ? (was ? 'Marked as unread' : 'Marked as read') : "Couldn't save. Try again.");
  };

  return (
    <>
      <div className="seg" role="tablist" aria-label="Phases">
        {[0, 1, 2].map(p => {
          const list = notes.data?.[p] || [];
          return (
            <button key={p} type="button" role="tab" aria-selected={p === phase} className={p === phase ? 'on' : ''} onClick={() => { if (p !== phase) { setPhase(p); setSelId(null); } }}>
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
              <g className="hub" key={phase} aria-hidden="true">
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
                    aria-label={`Open chapter ${info.num} ${info.title}${isRead ? ', read' : ''}`}
                    onClick={() => openChapter(n)}
                    onMouseEnter={() => setSelId(n._id)}
                    onFocus={() => setSelId(n._id)}
                    onKeyDown={e => onOrbKey(e, n)}
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
            <aside className="odet card" aria-live="polite" key={selected._id}>
              <div className="onum">Chapter {sel.num}</div>
              <h3 className="odet-title">{sel.title}</h3>
              <p className="sub">Interactive notes · {selRead ? <b className="ok">Read ✓</b> : 'Not read yet'}</p>
              <div className="oact">
                <button
                  type="button"
                  className="btn p"
                  disabled={!selected.linkUrl}
                  onClick={() => setReading(selected)}
                >
                  <Ic as={BookOpen} />{selected.linkUrl ? 'Open notes' : 'Notes coming soon'}
                </button>
                <button type="button" className="btn o" onClick={() => toggleReadOf(selected)}>{selRead ? 'Mark as unread' : 'Mark as read'}</button>
              </div>
            </aside>
          )}
        </div>
      )}
      {reading && (
        <ResourceViewer
          kind="web"
          src={reading.linkUrl}
          title={`Chapter ${chapterInfo(reading).num} · ${chapterInfo(reading).title}`}
          backLabel="Back to notes"
          onClose={() => setReading(null)}
          actions={(
            <button type="button" className="btn p sm" onClick={() => toggleReadOf(reading)}>
              <Ic as={read.has(reading._id) ? RotateCcw : CheckCircle2} /><span>{read.has(reading._id) ? 'Mark as unread' : 'Mark as read'}</span>
            </button>
          )}
        />
      )}
    </>
  );
}
