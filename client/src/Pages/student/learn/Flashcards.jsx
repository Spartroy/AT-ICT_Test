import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Layers, LayoutGrid, Play, Plus } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { PHASE_COLORS } from './mapLogic';
import { combinedStack, countCards, groupStacks } from './flashcardLogic';
import { StackFormDialog, StudyDialog } from '../../../components/portal/Flashcards';
import { useFocusTarget, useLearnPreview } from '../../../lib/learnPreview';

/**
 * Flashcards: pick a phase (tabs), then a chapter (list). Study one chapter or the whole phase. Students can also create their own stacks.
 */
export default function Flashcards({ onBack }) {
  const stacks = useApi(API_ENDPOINTS.FLASHCARDS, b => b.data || []);
  const [creating, setCreating] = useState(false);
  const [studying, setStudying] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const preview = useLearnPreview();
  const focus = useFocusTarget();
  const groups = useMemo(() => groupStacks(stacks.data || []), [stacks.data]);

  // A Library row's "View" studies that stack.
  const focused = useRef(null);
  useEffect(() => {
    if (!focus || !stacks.data || focused.current === focus) return;
    focused.current = focus;
    const stack = stacks.data.find(s => s._id === focus);
    if (stack) setStudying(stack);
  }, [focus, stacks.data]);

  // The first deck starts open so there is something to tap straight away.
  useEffect(() => {
    if (groups.length && !groups.some(g => g.key === openKey)) setOpenKey(groups[0].key);
  }, [groups, openKey]);

  if (stacks.loading && !stacks.data) return <Loading label="Loading flashcards…" />;
  if (stacks.error) return <ErrorNote error={stacks.error} onRetry={stacks.reload} />;

  const current = groups.find(g => g.key === openKey);
  const colorOf = (g) => (g.phase ? PHASE_COLORS[g.phase - 1] : 'var(--ink-300)');

  return (
    <>
      <div className="fc-head">
        <div className="fc-head-l">
          {onBack && <button type="button" className="btn o sm" onClick={onBack}><Ic as={ArrowLeft} />Labs</button>}
          <p className="sub">Pick a phase, then a chapter. Flip the cards to test yourself.</p>
        </div>
        {!preview && <button type="button" className="btn p sm" onClick={() => setCreating(true)}><Ic as={Plus} />Create stack</button>}
      </div>

      {groups.length ? (
        <>
          <div className="fct" role="tablist" aria-label="Flashcard phases">
            {groups.map(g => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={g.key === openKey}
                className={`fct-tab ${g.key === openKey ? 'on' : ''}`}
                style={{ '--pc': colorOf(g) }}
                onClick={() => setOpenKey(g.key)}
              >
                <span className="fct-dot" aria-hidden="true" />
                <b>{g.label}</b>
                {g.sub && <small>{g.sub}</small>}
              </button>
            ))}
          </div>

          {current && (
            <section className="fcp" key={current.key} role="tabpanel" style={{ '--pc': colorOf(current) }} aria-label={`${current.label} stacks`}>
              <header className="fcp-head">
                <div>
                  <h3>{current.label}</h3>
                  {current.sub && <p className="sub">{current.sub}</p>}
                </div>
                {countCards(current.stacks) > 0 && (
                  <button type="button" className="btn p sm" onClick={() => setStudying(combinedStack(current))}>
                    <Ic as={Play} />Study all
                  </button>
                )}
              </header>
              <ul className="fcl">
                {current.stacks.map(({ stack, number, name }) => (
                  <li key={stack._id}>
                    <button
                      type="button"
                      className="fcl-row"
                      onClick={() => setStudying(stack)}
                      aria-label={`${number ? `Chapter ${number}, ` : ''}${name}`}
                    >
                      <span className="fcl-no">{number ?? <Ic as={LayoutGrid} />}</span>
                      <span className="fcl-name"><b>{name}</b></span>
                      <Ic as={ChevronRight} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : <Empty icon={Layers}>No flashcard stacks yet. Create the first one.</Empty>}

      <StackFormDialog open={creating} onClose={() => setCreating(false)} onSaved={() => stacks.reload()} />
      <StudyDialog stack={studying} onClose={() => { setStudying(null); stacks.reload(); }} />
    </>
  );
}
