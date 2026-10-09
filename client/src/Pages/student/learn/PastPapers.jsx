import React, { useMemo, useState } from 'react';
import { ClipboardCheck, FilePenLine } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, Empty, ErrorNote, Loading } from '../../../components/portal/kit';
import logoCircle from '../../../assets/brand/logo-circle.png';
import BookOverlay, { SPINE } from './BookOverlay';
import SourceBox from './SourceBox';
import { groupPastPapers, PAPERS, SESSION_LABEL } from './pastPaperLogic';

/** One question-paper or mark-scheme book on a year shelf. */
function PaperBook({ code, variant, title, icon: Icon, onOpen, hidden }) {
  return (
    <button
      type="button"
      className={`spine spine--mini tier-l ${hidden ? 'out' : ''}`}
      style={{ '--c': SPINE.c, '--tc': SPINE.tc }}
      aria-label={`${title}, open`}
      onClick={e => onOpen(e.currentTarget)}
    >
      <img className="sp-logo" src={logoCircle} alt="" />
      <span className="sp-title"><span className="sp-text"><b>{code}</b><i>V{variant}</i></span></span>
      <Icon className="sp-icon" aria-hidden="true" />
    </button>
  );
}

/** Past papers: one shelf per year with a metal year label, Jun and Nov side by side. */
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
          <div className={`bshelf pp${paper !== 1 ? ' has-box' : ''}`}>
            <div className="metal" aria-hidden="true"><i /><i /><b>{year}</b></div>
            <div className="pp-sessions">
              {sessions.map(({ session, variants }) => (
                <div className="pp-session" key={session}>
                  <span className="pp-tag">{SESSION_LABEL[session]}</span>
                  <div className="pp-variants">
                    {variants.map(v => (
                      <div className="pp-books" key={v._id || v.variant}>
                        {v.qp && <PaperBook code="QP" variant={v.variant} title={`Question paper, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={FilePenLine} hidden={open?.m._id === `${v._id}-qp`} onOpen={sp => openBook(sp, v, 'qp', year, session)} />}
                        {v.ms && <PaperBook code="MS" variant={v.variant} title={`Mark scheme, ${SESSION_LABEL[session]} ${year}, variant ${v.variant}`} icon={ClipboardCheck} hidden={open?.m._id === `${v._id}-ms`} onOpen={sp => openBook(sp, v, 'ms', year, session)} />}
                        {paper !== 1 && v.src && <SourceBox compact m={{ _id: `${v._id}-src`, title: `Source files · V${v.variant}`, externalUrl: v.src }} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="plank" />
          </div>
        </section>
      )) : <Empty icon={FilePenLine}>No past papers for Paper {paper} yet.</Empty>}
      {open && <BookOverlay key={open.m._id} {...open} onClosed={() => setOpen(null)} />}
    </>
  );
}
