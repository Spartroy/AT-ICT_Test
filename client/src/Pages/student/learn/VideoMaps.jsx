import React, { useEffect, useMemo, useState } from 'react';
import { Play, FileText, Presentation, Database, Table, Share2, Star, CheckCircle2, X, RotateCcw, PlayCircle } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Accordion, Chips, Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { Dialog, useToast } from '../../../components/portal/PortalUI';
import useMediaQuery from '../../../hooks/useMediaQuery';
import useProgress from './useProgress';
import { buildVideoGroups, nodeStates, doneCount, defaultOpenGroup, serpentineRows } from './mapLogic';

export const MAP_ICONS = { play: Play, doc: FileText, slides: Presentation, db: Database, grid: Table, share: Share2, star: Star };

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
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(null);
  const narrow = useMediaQuery('(max-width: 700px)');
  const cols = narrow ? 3 : 4;
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

  const watch = (item) => {
    setSelected(null);
    setPlaying(item);
    if (!progress.videos.has(item.id)) progress.setDone('video', item.id, true);
  };

  return (
    <>
      <Chips items={SECTIONS} value={section} onChange={setSection} label="Video section" />
      {groups.map((g, gi) => {
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
                    {row.items.map((node, k) => (
                      <button
                        key={node.id}
                        type="button"
                        className={`node st-${node.state}`}
                        style={{ '--c': g.color }}
                        onClick={() => setSelected({ ...node, group: g, index: row.start + k })}
                        aria-label={`${node.title}${node.state === 'done' ? ', completed' : node.state === 'cur' ? ', start here' : ''}`}
                      >
                        <span className="nc"><GroupIcon className="i" aria-hidden="true" /><i className="rr" /></span>
                        <span className="nl">{node.title}</span>
                      </button>
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

      <Dialog open={!!selected} onClose={() => setSelected(null)} labelledBy="node-title">
        {selected && (
          <>
            <button type="button" className="ib x" aria-label="Close" onClick={() => setSelected(null)}><Ic as={X} /></button>
            <span className="chip" style={{ background: selected.group.color, color: 'var(--ink-990)' }}>{selected.group.title}</span>
            <h3 id="node-title" className="node-title">{selected.title}</h3>
            <p className="sub">{selected.group.kind}{selected.state === 'done' ? ' · completed ✓' : ''}</p>
            {selected.description && <p className="sub" style={{ marginTop: 10 }}>{selected.description}</p>}
            <div className="node-acts">
              <button type="button" className="btn p" onClick={() => watch(selected)}>
                <Ic as={Play} />{selected.state === 'done' ? 'Review' : 'Watch now'}
              </button>
              {selected.state === 'done' ? (
                <button type="button" className="btn o" onClick={() => { mark(selected, false); setSelected(null); }}><Ic as={RotateCcw} />Mark as not done</button>
              ) : (
                <button type="button" className="btn o" onClick={() => { mark(selected, true); setSelected(null); }}><Ic as={CheckCircle2} />Mark as done</button>
              )}
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={!!playing} onClose={() => setPlaying(null)} size="wide" labelledBy="player-title">
        {playing && (
          <>
            <button type="button" className="ib x" aria-label="Close video" onClick={() => setPlaying(null)}><Ic as={X} /></button>
            <h3 id="player-title" className="node-title" style={{ marginTop: 0 }}>{playing.title}</h3>
            <div className="player">
              {playing.url
                ? <iframe src={playing.url} title={playing.title} allow="autoplay; fullscreen" allowFullScreen />
                : <Empty icon={PlayCircle}>This video isn't available yet.</Empty>}
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
