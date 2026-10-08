import React, { useState } from 'react';
import { Eye, Plus, LayoutGrid } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../../components/portal/kit';
import { StackFormDialog, StudyDialog } from '../../../components/portal/Flashcards';

/** Flashcards: stats, stacks, flip-card study dialog, create a stack. */
export default function Flashcards() {
  const stacks = useApi(API_ENDPOINTS.FLASHCARDS, b => b.data || []);
  const [creating, setCreating] = useState(false);
  const [studying, setStudying] = useState(null);

  if (stacks.loading && !stacks.data) return <Loading label="Loading flashcards…" />;
  if (stacks.error) return <ErrorNote error={stacks.error} onRetry={stacks.reload} />;

  const list = stacks.data || [];
  const teacher = list.filter(s => s.isTeacherStack).length;
  const total = list.reduce((n, s) => n + (s.totalCards || s.cards?.length || 0), 0);

  return (
    <>
      <div className="fc-head">
        <p className="sub">Study and create flashcard stacks</p>
        <button type="button" className="btn p sm" onClick={() => setCreating(true)}><Ic as={Plus} />Create stack</button>
      </div>
      <div className="stats4">
        {[['Total stacks', list.length], ['Teacher stacks', teacher], ['Student stacks', list.length - teacher], ['Total cards', total]].map(([label, value]) => (
          <div className="stat" key={label}><div><small>{label}</small><b>{value}</b></div></div>
        ))}
      </div>
      {list.length ? (
        <div className="fc-g">
          {list.map(s => (
            <button type="button" className="item fc-item" key={s._id} onClick={() => setStudying(s)}>
              <span className="fc-item__body">
                <span className={`chip ${s.isTeacherStack ? 'c-th' : 'c-pr'}`}>{s.isTeacherStack ? 'Teacher' : 'Student'} · {s.totalCards || s.cards?.length || 0} cards</span>
                <b>{s.title}</b>
                <small>{s.studyCount || 0} studies · {s.creatorName || [s.createdBy?.firstName, s.createdBy?.lastName].filter(Boolean).join(' ')}</small>
              </span>
              <Ic as={Eye} />
            </button>
          ))}
        </div>
      ) : <Empty icon={LayoutGrid}>No flashcard stacks yet. Create the first one.</Empty>}

      <StackFormDialog open={creating} onClose={() => setCreating(false)} onSaved={() => stacks.reload()} />
      <StudyDialog stack={studying} onClose={() => { setStudying(null); stacks.reload(); }} />
    </>
  );
}
