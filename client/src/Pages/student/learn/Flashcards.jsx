import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Layers, LayoutGrid, Play, Plus } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { PHASE_COLORS } from './mapLogic';
import { combinedStack, countCards, groupStacks } from './flashcardLogic';
import { StackFormDialog, StudyDialog } from '../../../components/portal/Flashcards';

/** A pile of cards. Hover or focus fans the cards out; `open` keeps them fanned. */
function Deck({ color, layers = 4, open = false, small = false, onClick, label, children, style, ...rest }) {
  return (
    <button type="button" className={`deck ${open ? 'open' : ''} ${small ? 'sm' : ''}`} style={{ '--pc': color, ...style }} onClick={onClick} aria-label={label} {...rest}>
      <span className="deck-pile" aria-hidden="true">
        {Array.from({ length: layers }, (_, i) => <i key={i} style={{ '--i': layers - 1 - i, '--n': layers }} />)}
      </span>
      <span className="deck-face">{children}</span>
    </button>
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Flashcards: one deck per phase. Tap a phase and its chapters open as smaller decks below it.
 * Study a chapter, or the whole phase as one pile. Students can also create their own stacks.
 */
export default function Flashcards({ onBack }) {
  const stacks = useApi(API_ENDPOINTS.FLASHCARDS, b => b.data || []);
  const [creating, setCreating] = useState(false);
  const [studying, setStudying] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const groups = useMemo(() => groupStacks(stacks.data || []), [stacks.data]);

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
        <button type="button" className="btn p sm" onClick={() => setCreating(true)}><Ic as={Plus} />Create stack</button>
      </div>

      {groups.length ? (
        <>
          <div className="fc-decks" role="group" aria-label="Flashcard phases">
            {groups.map(g => (
              <Deck
                key={g.key}
                color={colorOf(g)}
                open={g.key === openKey}
                aria-pressed={g.key === openKey}
                label={`${g.label}, ${plural(countCards(g.stacks), 'card')} in ${plural(g.stacks.length, 'stack')}`}
                onClick={() => setOpenKey(g.key)}
              >
                <b className="deck-title">{g.label}</b>
                <small>{g.sub || 'Your own and shared stacks'}</small>
                <em>{plural(g.stacks.length, 'stack')} · {plural(countCards(g.stacks), 'card')}</em>
              </Deck>
            ))}
          </div>

          {current && (
            <section className="fc-open" key={current.key} style={{ '--pc': colorOf(current) }} aria-label={`${current.label} stacks`}>
              <div className="fc-open-head">
                <h3>{current.label}{current.sub && <small>{current.sub}</small>}</h3>
                {countCards(current.stacks) > 0 && (
                  <button type="button" className="btn o sm" onClick={() => setStudying(combinedStack(current))}>
                    <Ic as={Play} />Study all {countCards(current.stacks)} cards
                  </button>
                )}
              </div>
              <div className="fc-chapters">
                {current.stacks.map(({ stack, number, name }, i) => (
                  <Deck
                    key={stack._id}
                    small
                    layers={Math.min(3, Math.max(1, stack.cards?.length || 1))}
                    color={colorOf(current)}
                    onClick={() => setStudying(stack)}
                    label={`${number ? `Chapter ${number}, ` : ''}${name}, ${plural(stack.cards?.length || 0, 'card')}`}
                    style={{ '--pc': colorOf(current), '--d': `${i * 0.05}s` }}
                  >
                    <span className="deck-no">{number ?? <Ic as={LayoutGrid} />}</span>
                    <b>{name}</b>
                    <em>{plural(stack.cards?.length || 0, 'card')}</em>
                  </Deck>
                ))}
              </div>
            </section>
          )}
        </>
      ) : <Empty icon={Layers}>No flashcard stacks yet. Create the first one.</Empty>}

      <StackFormDialog open={creating} onClose={() => setCreating(false)} onSaved={() => stacks.reload()} />
      <StudyDialog stack={studying} onClose={() => { setStudying(null); stacks.reload(); }} />
    </>
  );
}
