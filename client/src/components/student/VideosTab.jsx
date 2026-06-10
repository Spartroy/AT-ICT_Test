import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  PlayIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─── Map geometry ─────────────────────────────────────────────────────────────── */
const MAP_W    = 300;
const NODE_R   = 30;
const ROW_H    = 108;
const PAD_TOP  = 36;
const LEFT_CX  = 68;
const RIGHT_CX = MAP_W - 68;

function buildPath(positions) {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].cx} ${positions[0].cy}`;
  for (let i = 1; i < positions.length; i++) {
    const p = positions[i - 1];
    const c = positions[i];
    const b = ROW_H * 0.5;
    d += ` C ${p.cx} ${p.cy + b} ${c.cx} ${c.cy - b} ${c.cx} ${c.cy}`;
  }
  return d;
}

/* ─── Per-program colour tokens ────────────────────────────────────────────────── */
const PROG = {
  Word:       { hex: '#3b82f6', btn: 'bg-blue-600   hover:bg-blue-700',   grad: 'from-blue-900/40   via-blue-800/30   to-transparent' },
  PowerPoint: { hex: '#f97316', btn: 'bg-orange-600 hover:bg-orange-700', grad: 'from-orange-900/40 via-orange-800/30 to-transparent' },
  Access:     { hex: '#ef4444', btn: 'bg-red-600     hover:bg-red-700',   grad: 'from-red-900/40     via-red-800/30     to-transparent' },
  Excel:      { hex: '#22c55e', btn: 'bg-green-600   hover:bg-green-700', grad: 'from-green-900/40   via-green-800/30   to-transparent' },
  SharePoint: { hex: '#818cf8', btn: 'bg-indigo-600  hover:bg-indigo-700',grad: 'from-indigo-900/40  via-indigo-800/30  to-transparent' },
};

/* ─── Duolingo winding-path map ─────────────────────────────────────────────────── */
const DuolingoPath = ({ videos = [], onPlay, color = '#3b82f6', sublabel = null }) => {
  if (!videos.length) return (
    <p className="text-gray-600 text-xs text-center py-3">
      {sublabel ? `No ${sublabel.toLowerCase()} yet` : 'No videos yet'}
    </p>
  );

  const positions = videos.map((_, i) => ({
    cx: i % 2 === 0 ? LEFT_CX : RIGHT_CX,
    cy: PAD_TOP + i * ROW_H,
  }));
  const svgH  = PAD_TOP + (videos.length - 1) * ROW_H + PAD_TOP + 56;
  const pathD = buildPath(positions);
  const diam  = NODE_R * 2;

  return (
    <div>
      {sublabel && (
        <div className="flex items-center gap-2 mb-1 px-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{sublabel}</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      )}
      <div className="relative mx-auto" style={{ width: MAP_W, height: svgH }}>
        <svg aria-hidden="true" className="absolute inset-0 pointer-events-none" width={MAP_W} height={svgH} style={{ overflow: 'visible' }}>
          <path d={pathD} fill="none" stroke={`${color}18`} strokeWidth="32" strokeLinecap="round" />
          <path d={pathD} fill="none" stroke={`${color}30`} strokeWidth="11" strokeLinecap="round" />
          <path d={pathD} fill="none" stroke={`${color}12`} strokeWidth="4" strokeLinecap="round" strokeDasharray="4 14" />
        </svg>
        {positions.map(({ cx, cy }, i) => {
          const video = videos[i];
          return (
            <div key={video._id || i} className="absolute" style={{ left: cx - NODE_R, top: cy - NODE_R }}>
              {i === 0 && (
                <span className="absolute inset-0 rounded-full animate-ping pointer-events-none" style={{ background: `${color}22`, animationDuration: '2.5s' }} />
              )}
              <button
                onClick={() => onPlay(video)}
                className="relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                style={{ width: diam, height: diam, background: `linear-gradient(145deg, ${color}, ${color}bb)`, border: `3px solid ${color}70`, boxShadow: `0 0 20px ${color}45, 0 4px 16px rgba(0,0,0,0.5)` }}
                aria-label={`Play: ${video.title}`}
              >
                <PlayIcon className="h-6 w-6 text-white drop-shadow" />
              </button>
              <div className="absolute pointer-events-none" style={{ top: diam + 7, left: '50%', transform: 'translateX(-50%)', width: 112, textAlign: 'center' }}>
                <p className="text-[11px] font-semibold text-gray-300 leading-tight line-clamp-2">{video.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Accordion ─────────────────────────────────────────────────────────────────── */
const Accordion = ({ header, expanded, onToggle, children, className = '' }) => (
  <div className={`bg-[#161616] border border-white/5 rounded-xl overflow-hidden ${className}`}>
    <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors">
      {header}
      <ChevronDownIcon
        className="h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-300"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </button>
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
          <div className="pb-6 pt-2 border-t border-white/5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ─── Theory phase accordion ────────────────────────────────────────────────────── */
const PhaseAccordion = ({ phase, videos, expanded, onToggle, onPlay }) => (
  <Accordion
    expanded={expanded}
    onToggle={onToggle}
    header={
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.4)' }}>
          <span className="text-blue-400 text-sm font-bold">{phase}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Phase {phase}</h3>
          <p className="text-xs text-gray-500">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    }
  >
    <div className="flex justify-center pt-2">
      <DuolingoPath videos={videos} onPlay={onPlay} color="#3b82f6" />
    </div>
  </Accordion>
);

/* ─── Practical program accordion ────────────────────────────────────────────────── */
const ProgramAccordion = ({ name, programVideos, expanded, onToggle, onPlay }) => {
  const c      = PROG[name];
  const guides = programVideos.guides || [];
  const tasks  = programVideos.tasks  || [];
  const total  = guides.length + tasks.length;
  return (
    <Accordion
      expanded={expanded}
      onToggle={onToggle}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${c.hex}18`, border: `2px solid ${c.hex}55` }}>
            <ComputerDesktopIcon className="h-5 w-5 text-white/80" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Microsoft {name}</h3>
            <p className="text-xs text-gray-500">
              {total} video{total !== 1 ? 's' : ''}
              <span className="text-gray-600 mx-1">·</span>
              {guides.length} guides · {tasks.length} tasks
            </p>
          </div>
        </div>
      }
    >
      <div className="px-4 pt-3">
        <DuolingoPath videos={guides} onPlay={onPlay} color={c.hex} sublabel="Guides" />
      </div>
      {(guides.length > 0 || tasks.length > 0) && <div className="mx-6 my-1 border-t border-white/5" />}
      <div className="px-4">
        <DuolingoPath videos={tasks} onPlay={onPlay} color={`${c.hex}cc`} sublabel="Tasks" />
      </div>
    </Accordion>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────────────── */
const VideosTab = ({ studentData }) => {
  const [activeSection, setActiveSection]       = useState('theory');
  const [expandedSections, setExpandedSections] = useState({});
  const [videos, setVideos]                     = useState({ theory: {}, practical: {} });
  const [loading, setLoading]                   = useState(true);
  const [selectedVideo, setSelectedVideo]       = useState(null);
  const [showPlayer, setShowPlayer]             = useState(false);

  const toggle = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res   = await fetch(API_ENDPOINTS.STUDENT.VIDEOS, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setVideos(data.data.videos);
        }
      } catch (err) { console.error('Error fetching videos:', err); }
      finally        { setLoading(false); }
    })();
  }, []);

  const play = (video) => { setSelectedVideo(video); setShowPlayer(true); };

  const PROGRAMS = ['Word', 'PowerPoint', 'Access', 'Excel', 'SharePoint'];

  const TABS = [
    { id: 'theory',    label: 'Theory',    Icon: BookOpenIcon        },
    { id: 'practical', label: 'Practical', Icon: ComputerDesktopIcon },
    { id: 'other',     label: 'Other',     Icon: PlayIcon            },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <PlayIcon className="h-5 w-5 text-[#CA133E]" />
          Recordings Library
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Video lessons and tutorials</p>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeSection === id
                ? 'bg-[#CA133E] text-white'
                : 'bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-white/10 border-t-[#CA133E] rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">Loading videos…</p>
          </div>
        ) : activeSection === 'theory' ? (
          <div className="space-y-2">
            {[1, 2, 3].map(phase => (
              <PhaseAccordion
                key={phase}
                phase={phase}
                videos={videos.theory?.[`phase${phase}`] || []}
                expanded={!!expandedSections[`phase${phase}`]}
                onToggle={() => toggle(`phase${phase}`)}
                onPlay={play}
              />
            ))}
          </div>
        ) : activeSection === 'practical' ? (
          <div className="space-y-2">
            {PROGRAMS.map(name => (
              <ProgramAccordion
                key={name}
                name={name}
                programVideos={videos.practical?.[name.toLowerCase()] || {}}
                expanded={!!expandedSections[name.toLowerCase()]}
                onToggle={() => toggle(name.toLowerCase())}
                onPlay={play}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Other Videos</h3>
              <p className="text-xs text-gray-500 mt-0.5">Revisions, additional materials, and miscellaneous content</p>
            </div>
            <div className="px-4 py-4 flex justify-center">
              <DuolingoPath videos={videos.other || []} onPlay={play} color="#a855f7" />
            </div>
          </div>
        )}
      </div>

      {/* Player modal */}
      <AnimatePresence>
        {showPlayer && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#161616] border border-white/10 rounded-xl p-5 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              role="dialog" aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">{selectedVideo.title}</h3>
                <button
                  onClick={() => { setShowPlayer(false); setSelectedVideo(null); }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideosTab;
