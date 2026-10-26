import React, { useEffect, useRef, useState } from 'react';
import { Check, ClipboardCheck, FilePenLine, PackageOpen } from 'lucide-react';
import { Ic, Seg } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import logoCircle from '../../../assets/brand/logo-circle.png';
import { useSourceDownload } from './SourceBox';
import { SESSION_LABEL, paperKey, resolveSelection, variantColor, yearStats } from './pastPaperLogic';

const SAVED = 'atict:pp-pick';
const readSaved = (paper) => {
  try { return JSON.parse(localStorage.getItem(`${SAVED}:${paper}`)) || {}; } catch { return {}; }
};
const writeSaved = (paper, sel) => {
  try { localStorage.setItem(`${SAVED}:${paper}`, JSON.stringify(sel)); } catch { /* remembering is a nicety */ }
};

function SourceLink({ v }) {
  const { go, busy } = useSourceDownload({ _id: `${v._id}-src`, title: `Source files · V${v.variant}`, externalUrl: v.src });
  return <button type="button" className="ppl-btn" onClick={go} disabled={busy}><Ic as={PackageOpen} />Source files</button>;
}

/** One variant: coloured spine tag, big buttons for the question paper, mark scheme and source files, and a practised tick. */
function VariantCard({ v, paper, done, onToggle, onOpen }) {
  return (
    <article className={`ppl-card pv-${variantColor.index(v.variant)} ${done ? 'is-done' : ''}`}>
      <span className="ppl-spine" aria-hidden="true"><img src={logoCircle} alt="" /><b>V{v.variant}</b></span>
      <div className="ppl-body">
        <header>
          <h4>Variant {v.variant}</h4>
          <button
            type="button"
            className={`ppl-tick ${done ? 'on' : ''}`}
            aria-pressed={done}
            aria-label={done ? `Variant ${v.variant}: practised, tap to undo` : `Mark variant ${v.variant} as practised`}
            onClick={() => onToggle(v, !done)}
          >
            <Ic as={Check} />{done ? 'Practised' : 'Mark done'}
          </button>
        </header>
        <div className="ppl-acts">
          {v.qp && <button type="button" className="ppl-btn" onClick={e => onOpen(e.currentTarget, v, 'qp')}><Ic as={FilePenLine} />Question paper</button>}
          {v.ms && <button type="button" className="ppl-btn" onClick={e => onOpen(e.currentTarget, v, 'ms')}><Ic as={ClipboardCheck} />Mark scheme</button>}
          {paper !== 1 && v.src && <SourceLink v={v} />}
        </div>
      </div>
    </article>
  );
}

/**
 * Phone-friendly past papers: pick the year (swipeable chips, newest first), then Jun or Nov,
 * and only that session's variants are listed. The last pick is remembered per paper.
 * years: groupPastPapers() output for the chosen paper.
 */
export default function PastPaperList({ years, paper, done, onToggle, onOpen }) {
  const toast = useToast();
  const [sel, setSel] = useState(() => resolveSelection(years, readSaved(paper)));
  const strip = useRef(null);

  // A different paper (or fresh data) can change which years exist.
  useEffect(() => { setSel(resolveSelection(years, readSaved(paper))); }, [years, paper]);
  useEffect(() => { if (sel.year) writeSaved(paper, sel); }, [paper, sel]);
  useEffect(() => {
    strip.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [sel.year]);

  const stats = yearStats(years, done);
  const group = years.find(g => g.year === sel.year);
  const session = group?.sessions.find(s => s.session === sel.session);
  const pickYear = (year) => setSel(resolveSelection(years, { year, session: sel.session }));

  const toggle = async (v, on) => {
    const ok = await onToggle(paperKey(v), on);
    if (!ok) toast("Couldn't save. Try again.");
  };

  if (!group) return null;
  return (
    <div className="ppl">
      <div className="ppl-years" ref={strip} role="group" aria-label="Year">
        {stats.map(y => (
          <button key={y.year} type="button" className={`ppl-year ${y.year === sel.year ? 'on' : ''}`} aria-pressed={y.year === sel.year} onClick={() => pickYear(y.year)}>
            <b>{y.year}</b>
            <small>{y.done}/{y.total}</small>
          </button>
        ))}
      </div>
      <Seg
        slide
        label="Session"
        value={sel.session}
        onChange={s => setSel(x => ({ ...x, session: s }))}
        tabs={group.sessions.map(s => ({
          id: s.session,
          label: SESSION_LABEL[s.session],
          count: `${s.variants.filter(v => done.has(paperKey(v))).length}/${s.variants.length}`
        }))}
      />
      <div className="ppl-list" key={`${sel.year}-${sel.session}`}>
        {session?.variants.map(v => (
          <VariantCard
            key={v._id}
            v={v}
            paper={paper}
            done={done.has(paperKey(v))}
            onToggle={toggle}
            onOpen={(el, variant, kind) => onOpen(el, variant, kind, group.year, session.session)}
          />
        ))}
      </div>
    </div>
  );
}
