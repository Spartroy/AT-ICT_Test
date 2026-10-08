import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Play, FileText, Presentation, Database, Table, Share2, Star, CheckCircle2, X, RotateCcw, PlayCircle, Check } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Accordion, Chips, Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { Dialog, useToast } from '../../../components/portal/PortalUI';
import useProgress from './useProgress';
import { buildVideoGroups, nodeStates, doneCount, defaultOpenGroup, serpentineRows } from './mapLogic';

export const MAP_ICONS = { play: Play, doc: FileText, slides: Presentation, db: Database, grid: Table, share: Share2, star: Star };

const NODE_W = 140; // px per lesson in the map

const SECTIONS = [
  { id: 'theory', label: 'Theory' },
  { id: 'practical', label: 'Practical' },
  { id: 'other', label: 'Other' }
];

/** Videos: Duolingo-style serpentine maps per phase / program / revisions. */
export default function VideoMaps() {
  const videos = useApi(API_ENDPOINTS.STUDENT.VIDEOS, b => buildVideoGroups(b.data?.videos));
  const progress = useProgress();
  const [section, setSection] = useState('theory');
  const [openMap, setOpenMap] = useState({});
  const [playing, setPlaying] = useState(null);
  // A group's lessons sit on one centred line when they fit; otherwise they wrap into rows that fit the width.
  const areaRef = useRef(null);
  const [areaWidth, setAreaWidth] = useState(900);
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const measure = () => setAreaWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [videos.data]);
  const colsFor = (count) => Math.max(3, Math.min(count, Math.floor((areaWidth - 56) / NODE_W)));
  const toast = useToast();

  const groups = useMemo(() => videos.data?.[section] || [], [videos.data, section]);

  // Default: open the first group in each section that still has unfinished lessons.
  useEffect(() => {
    if (!videos.data || progress.loading || openMap[section]) return;
    setOpenMap(m => ({ ...m, [section]: { [defaultOpenGroup(groups, progress.videos)]: true } }));
  }, [videos.data, progress.loading, progress.videos, groups, section, openMap]);

  if (videos.loading && !videos.data) return <Loading label="Loading videos…" />;
  if (videos.error) return <ErrorNote error={videos.error} onRetry={videos.reload} />;

  const isOpen = (i) => !!openMap[section]?.[i];
  const toggle = (i, open) => setOpenMap(m => ({ ...m, [section]: { ...(m[section] || {}), [i]: open } }));

  const mark = async (item, done) => {
    const ok = await progress.setDone('video', item.id, done);
    toast(ok ? (done ? 'Marked as done' : 'Marked as not done') : "Couldn't save your progress. Try again.");
  };

  // Clicking a lesson opens the player straight away; marking it done is explicit (hover button / player button).
  const watch = (item) => setPlaying(item);

  return (
    <>
      <Chips items={SECTIONS} value={section} onChange={setSection} label="Video section" />
      <div ref={areaRef}>
      {groups.map((g, gi) => {
        const cols = colsFor(g.items.length);
        const nodes = nodeStates(g.items, progress.videos);
        const GroupIcon = MAP_ICONS[g.icon] || Play;
        return (
          <Accordion
            key={g.key}
            open={isOpen(gi)}
            onToggle={open => toggle(gi, open)}
            count={`${doneCount(g.items, progress.videos)}/${g.items.length}`}
            head={
              <>
                <span className="n" style={{ borderColor: g.color, color: g.color }}>{g.num || <GroupIcon className="i" aria-hidden="true" />}</span>
                <span><h4>{g.title}</h4><small>{g.sub}</small></span>
              </>
            }
          >
            {g.items.length ? (
              <div className="nodes">
                {serpentineRows(nodes, cols).map(row => (
                  <div
                    key={row.start}
                    className={`srow ${row.reverse ? 'rev' : ''} ${row.more ? 'more' : ''}`}
                    style={{ '--n': cols, '--k': row.items.length, '--c': g.color }}
                  >
                    {row.items.map((node) => (
                      <div key={node.id} className={`node st-${node.state}`} style={{ '--c': g.color }}>
                        <button
                          type="button"
                          className="nbtn"
                          onClick={() => watch({ ...node, group: g })}
                          aria-label={`${node.title}${node.state === 'done' ? ', completed' : node.state === 'cur' ? ', start here' : ''}`}
                        >
                          <span className="nc"><GroupIcon className="i" aria-hidden="true" /><i className="rr" /></span>
                          <span className="nl">{node.title}</span>
                        </button>
                        <button
                          type="button"
                          className="nmark"
                          aria-label={node.state === 'done' ? `Mark ${node.title} as not done` : `Mark ${node.title} as done`}
                          onClick={() => mark(node, node.state !== 'done')}
                        >
                          <Ic as={node.state === 'done' ? RotateCcw : Check} />{node.state === 'done' ? 'Undo' : 'Mark done'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon={PlayCircle}>No videos here yet.</Empty>
            )}
          </Accordion>
        );
      })}
      </div>

      <Dialog open={!!playing} onClose={() => setPlaying(null)} size="xl" labelledBy="player-title">
        {playing && (() => {
          const isDone = progress.videos.has(playing.id);
          return (
            <>
              <button type="button" className="ib x" aria-label="Close video" onClick={() => setPlaying(null)}><Ic as={X} /></button>
              <span className="chip" style={{ background: playing.group.color, color: 'var(--ink-990)' }}>{playing.group.title}</span>
              <h3 id="player-title" className="node-title">{playing.title}</h3>
              <div className="player player-xl">
                {playing.url
                  ? <iframe src={playing.url} title={playing.title} allow="autoplay; fullscreen; picture-in-picture" />
                  : <Empty icon={PlayCircle}>This video isn't available yet.</Empty>}
              </div>
              <div className="node-acts">
                <button type="button" className={`btn ${isDone ? 'o' : 'p'}`} onClick={() => mark(playing, !isDone)}>
                  <Ic as={isDone ? RotateCcw : CheckCircle2} />{isDone ? 'Mark as not done' : 'Mark as done'}
                </button>
                {playing.description && <p className="sub node-desc">{playing.description}</p>}
              </div>
            </>
          );
        })()}
      </Dialog>
    </>
  );
}
