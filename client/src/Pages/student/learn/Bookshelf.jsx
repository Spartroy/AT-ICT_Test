import React, { useMemo, useState } from 'react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, ErrorNote, Loading, SearchBox } from '../../../components/portal/kit';
import { Download } from 'lucide-react';
import ResourceViewer from '../../../components/portal/viewer/ResourceViewer';
import { usePortalUI } from '../../../components/portal/PortalUI';
import { directDownload, startDownload } from '../../../lib/directDownload';
import logoCircle from '../../../assets/brand/logo-circle.png';
import BookOverlay, { CoverTitle, SPINE } from './BookOverlay';
import PastPapers from './PastPapers';
import RevSheet from './RevSheet';
import SourceBox from './SourceBox';
import { iconFor, sizeTier } from './bookDesign';
import '../../../styles/books.css';

const CATS = [
  { id: 'theory', label: 'Theory' },
  { id: 'practical', label: 'Practical' },
  { id: 'other', label: 'Revision' },
  { id: 'pastpapers', label: 'Past papers' }
];

/** book | revsheet | source (older materials only have the isSourceFile flag). */
export const kindOf = (m) => m.kind === 'revsheet' || m.kind === 'source' ? m.kind : (m.isSourceFile ? 'source' : 'book');

/** Materials: brand bookshelf. Books, revision sheets and boxes of source files stand on the same shelf. */
export default function Bookshelf() {
  const materials = useApi(API_ENDPOINTS.STUDENT.MATERIALS, b => b.data?.allMaterials || []);
  const [cat, setCat] = useState('theory');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const { toast } = usePortalUI();

  // Straight download when the link allows it, otherwise the link opens in a new tab.
  const downloadSource = (link) => {
    const { url, isDirect } = directDownload(link);
    if (isDirect) { startDownload(url); toast('Your download is starting…'); } else window.open(url, '_blank', 'noopener,noreferrer');
  };

  const counts = useMemo(() => Object.fromEntries(CATS.map(c => [c.id, (materials.data || []).filter(m => m.type === c.id).length])), [materials.data]);
  const matches = (materials.data || []).filter(m => m.type === cat && m.title.toLowerCase().includes(q.trim().toLowerCase()));
  const books = matches.filter(m => kindOf(m) === 'book');
  const sheets = matches.filter(m => kindOf(m) === 'revsheet');
  const sources = matches.filter(m => kindOf(m) === 'source');

  if (materials.loading && !materials.data) return <Loading label="Loading materials…" />;
  if (materials.error) return <ErrorNote error={materials.error} onRetry={materials.reload} />;

  const hint = [
    books.length && 'Tap a book to open it.',
    sheets.length && 'Tap a folder to read the sheet.',
    sources.length && "Hover a box to see what's inside, then tap it to download the files."
  ].filter(Boolean).join(' ');

  return (
    <>
      {cat !== 'pastpapers' && <SearchBox value={q} onChange={setQ} placeholder="Search materials…" />}
      <Chips items={CATS.map(c => ({ ...c, count: c.id === 'pastpapers' ? undefined : counts[c.id] }))} value={cat} onChange={setCat} label="Material category" />

      {cat === 'pastpapers' ? <PastPapers /> : matches.length ? (
        <>
          <div className={`bshelf${sources.length || sheets.length ? ' has-box' : ''}`}>
            <div className="books">
              {books.map((m) => {
                const Icon = iconFor(m);
                return (
                  <button
                    key={m._id}
                    type="button"
                    className={`spine tier-${sizeTier(m.title)} ${open?.m._id === m._id ? 'out' : ''}`}
                    style={{ '--c': SPINE.c, '--tc': SPINE.tc }}
                    aria-label={`${m.title}, open book`}
                    onClick={e => setOpen({ m, spine: e.currentTarget, style: SPINE })}
                  >
                    <img className="sp-logo" src={logoCircle} alt="" />
                    <span className="sp-title"><span className="sp-text"><CoverTitle title={m.title} /></span></span>
                    <Icon className="sp-icon" aria-hidden="true" />
                  </button>
                );
              })}
              {sheets.map(m => <RevSheet key={m._id} m={m} onOpen={setSheet} />)}
              {sources.map(m => <SourceBox key={m._id} m={m} />)}
            </div>
            <div className="plank" />
          </div>
          <p className="sub" style={{ marginTop: 12, fontSize: '.85rem' }}>{hint}</p>
        </>
      ) : (
        <p className="sub" style={{ padding: '30px 0' }}>{q ? 'No materials match your search.' : 'Nothing here yet.'}</p>
      )}

      {open && <BookOverlay key={open.m._id} {...open} catLabel={CATS.find(c => c.id === open.m.type)?.label} onClosed={() => setOpen(null)} />}
      {sheet && (
        <ResourceViewer
          kind="web"
          src={sheet.externalUrl}
          title={sheet.title}
          backLabel="Back to materials"
          onClose={() => setSheet(null)}
          actions={sheet.sourceUrl && (
            <button type="button" className="btn p sm" onClick={() => downloadSource(sheet.sourceUrl)}>
              <Download className="i" aria-hidden="true" /><span>Download source files</span>
            </button>
          )}
        />
      )}
    </>
  );
}
