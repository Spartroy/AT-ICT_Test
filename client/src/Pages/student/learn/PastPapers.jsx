import React, { useMemo, useState } from 'react';
import { ClipboardCheck, FilePenLine } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, Empty, ErrorNote, Loading } from '../../../components/portal/kit';
import logoCircle from '../../../assets/brand/logo-circle.png';
import BookOverlay, { SPINE } from './BookOverlay';
import SourceBoxFront from './SourceBoxFront';
import { groupPastPapers, PAPERS, SESSION_LABEL } from './pastPaperLogic';

/** A thin question-paper or mark-scheme book: code on top, variant under it. */
function PaperBook({ code, variant, title, icon: Icon, onOpen, hidden }) {
  return (
    <button
      type="button"
      className={`spine spine--mini ${hidden ? 'out' : ''}`}
      style={{ '--c': SPINE.c, '--tc': SPINE.tc }}
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
 * Past papers: one card per year with a metal year label. Jun and Nov sit side by side; each variant is a thin QP book
 * and MS book on the shelf, and (papers 2 and 3) its source files in a front-view box on a shelf hung underneath.
 */
export default function PastPapers() {
  const papers = useApi(API_ENDPOINTS.PASTPAPERS, b => b.data?.papers || []);
  const [paper, setPaper] = useState(1);
  const [open, setOpen] = useState(null);

  const years = useMemo(() => groupPastPapers(papers.data || [], paper), [papers.data, paper]);

  if (papers.loading && !papers.data) return <Loading label="Loading past papers…" />;
  if (papers.error) return <ErrorNote error={papers.error} onRetry={papers.reload} />;

  const openBook = (spine, v, kind, year, session) => {
    const label = kind === 'qp' ? 'Question Paper' : 'Mark Scheme';
    setOpen({
      m: { _id: `${v._id}-${kind}`, title: `${label} · ${SESSION_LABEL[session]} ${year} · V${v.variant}`, type: 'theory', externalUrl: v[kind] },
      spine,
      style: SPINE,
      catLabel: `Paper ${paper}`
    });
  };

  return (
    <>
      <Chips items={PAPERS.map(p => ({ id: p.id, label: p.label }))} value={paper} onChange={setPaper} label="Past paper" />
      {years.length ? years.map(({ year, sessions }) => (
        <section className="ppyear" key={year} aria-label={`Paper ${paper}, ${year}`}>
          <div className="bshelf pp">
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
                        <div className="pp-cell pp-cell--books" key={`b${v._id}`}>
                          {v.qp && <PaperBook code="QP" variant={v.variant} title={`Question paper, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={FilePenLine} hidden={open?.m._id === `${v._id}-qp`} onOpen={sp => openBook(sp, v, 'qp', year, session)} />}
                          {v.ms && <PaperBook code="MS" variant={v.variant} title={`Mark scheme, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={ClipboardCheck} hidden={open?.m._id === `${v._id}-ms`} onOpen={sp => openBook(sp, v, 'ms', year, session)} />}
                        </div>
                      ))}
                      <div className="pp-plank" />
                      {hasBoxes && (
                        <>
                          <div className="pp-hangers" aria-hidden="true"><i /><i /></div>
                          {variants.map(v => (
                            <div className="pp-cell pp-cell--box" key={`s${v._id}`}>
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
        </section>
      )) : <Empty icon={FilePenLine}>No past papers for Paper {paper} yet.</Empty>}
      {open && <BookOverlay key={open.m._id} {...open} onClosed={() => setOpen(null)} />}
    </>
  );
}
