import React, { useMemo, useState } from 'react';
import { Check, ClipboardCheck, FilePenLine, LayoutList, Library } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Loading, Seg } from '../../../components/portal/kit';
import logoCircle from '../../../assets/brand/logo-circle.png';
import BookOverlay, { SPINE } from './BookOverlay';
import SourceBoxFront from './SourceBoxFront';
import PastPaperList from './PastPaperList';
import usePastPaperProgress from './usePastPaperProgress';
import useMediaQuery from '../../../hooks/useMediaQuery';
import { groupPastPapers, paperKey, PAPERS, shelvesOf, SESSION_LABEL, variantColor } from './pastPaperLogic';

const VIEW_KEY = 'atict:pp-view';
const VIEWS = [
  { id: 'list', label: <span className="pp-vl">List</span>, icon: LayoutList },
  { id: 'shelf', label: <span className="pp-vl">Shelf</span>, icon: Library }
];
const savedView = () => {
  try { const v = localStorage.getItem(VIEW_KEY); return VIEWS.some(x => x.id === v) ? v : null; } catch { return null; }
};

/** A thin question-paper or mark-scheme book: code on top, variant under it. */
function PaperBook({ code, variant, title, icon: Icon, onOpen, hidden }) {
  return (
    <button
      type="button"
      className={`spine spine--mini ${hidden ? 'out' : ''}`}
      aria-label={`${title}, open`}
      onClick={e => onOpen(e.currentTarget)}
    >
      <img className="sp-logo" src={logoCircle} alt="" />
      <div className="pb-code"><strong>{code}</strong><em>V{variant}</em></div>
      <Icon className="sp-icon" aria-hidden="true" />
    </button>
  );
}

/**
 * Past papers: each year has a metal year label. Theory has one year per shelf, the practical papers two years side by side.
 * Within a year Jun and Nov sit side by side; each variant is a thin QP book
 * and MS book on the shelf, and (papers 2 and 3) its source files in a front-view box on a shelf hung underneath.
 */
export default function PastPapers() {
  const papers = useApi(API_ENDPOINTS.PASTPAPERS, b => b.data?.papers || []);
  const [paper, setPaper] = useState(1);
  const [open, setOpen] = useState(null);
  const progress = usePastPaperProgress();
  // Phones start on the compact list (no endless shelves); a student's own choice is remembered.
  const phone = useMediaQuery('(max-width: 900px)');
  const [picked, setPicked] = useState(savedView);
  const view = picked || (phone ? 'list' : 'shelf');
  const chooseView = (v) => {
    setPicked(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* the choice just isn't remembered */ }
  };

  const years = useMemo(() => groupPastPapers(papers.data || [], paper), [papers.data, paper]);
  const shelves = useMemo(() => shelvesOf(years, paper), [years, paper]);

  if (papers.loading && !papers.data) return <Loading label="Loading past papers…" />;
  if (papers.error) return <ErrorNote error={papers.error} onRetry={papers.reload} />;

  const openBook = (spine, v, kind, year, session) => {
    const label = kind === 'qp' ? 'Question Paper' : 'Mark Scheme';
    setOpen({
      m: { _id: `${v._id}-${kind}`, title: `${label} · ${SESSION_LABEL[session]} ${year} · V${v.variant}`, type: 'theory', externalUrl: v[kind] },
      spine,
      style: { c: variantColor(v.variant), tc: SPINE.tc },
      catLabel: `Paper ${paper}`
    });
  };

  return (
    <>
      <div className="pp-bar">
        <Seg tabs={PAPERS.map(p => ({ id: p.id, label: <>Paper {p.id}<span className="pp-kind"> · {p.id === 1 ? 'Theory' : 'Practical'}</span></> }))} value={paper} onChange={setPaper} label="Past paper" slide />
        <Seg tabs={VIEWS} value={view} onChange={chooseView} label="Past paper layout" slide className="pp-view" />
      </div>
      {!years.length ? <Empty icon={FilePenLine}>No past papers for Paper {paper} yet.</Empty> : view === 'list' ? (
        <PastPaperList years={years} paper={paper} done={progress.done} onToggle={progress.setDone} onOpen={(el, v, kind, year, session) => openBook(el, v, kind, year, session)} />
      ) : shelves.map(group => (
        <section className="ppyear" key={group[0].year} aria-label={`Paper ${paper}, ${group.map(g => g.year).join(' and ')}`}>
          <div className="bshelf pp">
            <div className="pp-years">
              {group.map(({ year, sessions }) => (
                <div className="pp-year" key={year}>
                <div className="metal" aria-hidden="true"><i /><i /><b>{year}</b></div>
                <div className="pp-sessions">
                  {sessions.map(({ session, variants }) => {
                    const hasBoxes = paper !== 1 && variants.some(v => v.src);
                    return (
                      <div className="pp-session" key={session}>
                        <span className="pp-tag">{SESSION_LABEL[session]}</span>
                        {/* One grid: every variant is a column, so the books and the box under them line up. */}
                        <div className="pp-rack" style={{ '--n': variants.length }}>
                          {variants.map(v => (
                            <div className={`pp-cell pp-cell--books pv-${variantColor.index(v.variant)}`} key={`b${v._id}`}>
                              {progress.done.has(paperKey(v)) && <i className="pp-done" role="img" aria-label={`Variant ${v.variant} practised`} title="Practised"><Check className="i" aria-hidden="true" /></i>}
                              {v.qp && <PaperBook code="QP" variant={v.variant} title={`Question paper, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={FilePenLine} hidden={open?.m._id === `${v._id}-qp`} onOpen={sp => openBook(sp, v, 'qp', year, session)} />}
                              {v.ms && <PaperBook code="MS" variant={v.variant} title={`Mark scheme, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={ClipboardCheck} hidden={open?.m._id === `${v._id}-ms`} onOpen={sp => openBook(sp, v, 'ms', year, session)} />}
                            </div>
                          ))}
                          <div className="pp-plank" />
                          {hasBoxes && (
                            <>
                              <div className="pp-hangers" aria-hidden="true"><i /><i /></div>
                              {variants.map(v => (
                                <div className={`pp-cell pp-cell--box pv-${variantColor.index(v.variant)}`} key={`s${v._id}`}>
                                  {v.src && <SourceBoxFront m={{ _id: `${v._id}-src`, title: `Source files · V${v.variant}`, externalUrl: v.src }} label={`Source files · V${v.variant}`} />}
                                </div>
                              ))}
                              <div className="pp-plank pp-plank--hung" />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
      {open && <BookOverlay key={open.m._id} {...open} onClosed={() => setOpen(null)} />}
    </>
  );
}
