import React, { useState } from 'react';
import { Eye, Plus, LayoutGrid } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { PHASE_COLORS } from './mapLogic';
import { groupStacks } from './flashcardLogic';
import { StackFormDialog, StudyDialog } from '../../../components/portal/Flashcards';

/** Flashcards: stacks, flip-card study dialog, create a stack. */
export default function Flashcards() {
  const stacks = useApi(API_ENDPOINTS.FLASHCARDS, b => b.data || []);
  const [creating, setCreating] = useState(false);
  const [studying, setStudying] = useState(null);

  if (stacks.loading && !stacks.data) return <Loading label="Loading flashcards…" />;
  if (stacks.error) return <ErrorNote error={stacks.error} onRetry={stacks.reload} />;

  const groups = groupStacks(stacks.data || []);

  return (
    <>
      <div className="fc-head">
        <p className="sub">Study and create flashcard stacks</p>
        <button type="button" className="btn p sm" onClick={() => setCreating(true)}><Ic as={Plus} />Create stack</button>
      </div>
      {groups.length ? groups.map(g => (
        <section className="fc-phase" key={g.key} aria-label={g.label} style={{ '--pc': g.phase ? PHASE_COLORS[g.phase - 1] : 'var(--ink-300)' }}>
          <h3 className="fc-phase__head">{g.label}{g.sub && <small>{g.sub}</small>}</h3>
          <div className="fc-g">
            {g.stacks.map(({ stack, number, name }) => (
              <button type="button" className="item fc-chap" key={stack._id} onClick={() => setStudying(stack)}>
                <span className="fc-no" aria-hidden="true">{number ?? <LayoutGrid className="i" />}</span>
                <span className="fc-chap__name">{number ? <small>Chapter {number}</small> : null}<b>{name}</b></span>
                <Ic as={Eye} />
              </button>
            ))}
          </div>
        </section>
      )) : <Empty icon={LayoutGrid}>No flashcard stacks yet. Create the first one.</Empty>}

      <StackFormDialog open={creating} onClose={() => setCreating(false)} onSaved={() => stacks.reload()} />
      <StudyDialog stack={studying} onClose={() => { setStudying(null); stacks.reload(); }} />
    </>
  );
}
