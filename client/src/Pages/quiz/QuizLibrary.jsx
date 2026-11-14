import React, { useState } from 'react';
import { ChevronRight, GraduationCap, Library, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import useApi from '../../hooks/useApi';
import { Empty, ErrorNote, Ic, Loading, fmtDate } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { announceChange, apiError, useTeacherChange } from '../teacher/modals/form';
import QuizBuilder from './QuizBuilder';
import QuizResults from './QuizResults';
import BankEditor from './BankEditor';
import '../../styles/quizgen.css';

const T = API_ENDPOINTS.THEORY_QUIZ.TEACHER;
const STATUS = { draft: { label: 'Draft', cls: 'c-gy' }, published: { label: 'Published', cls: 'c-pr' }, closed: { label: 'Closed', cls: 'c-am' } };

/** The teacher's quiz library: every generated quiz, its status, and a way into results, editing and the question bank. */
export default function QuizLibrary({ canEdit = true }) {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi(`${T}/quizzes`, b => b.data?.quizzes || []);
  const [builder, setBuilder] = useState(null); // { id? }
  const [results, setResults] = useState(null);
  const [bank, setBank] = useState(false);
  useTeacherChange('quiz', list.reload);

  if (list.loading && !list.data) return <Loading label="Loading quizzes…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];

  const remove = async (q) => {
    if (!(await confirm({ title: `Delete “${q.title}”?`, body: q.stats.started ? `Its ${q.stats.started} student attempt${q.stats.started === 1 ? '' : 's'} will be deleted too.` : 'This quiz has no attempts yet.', confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`${T}/quizzes/${q._id}`);
      toast('Quiz deleted');
      announceChange('quiz');
    } catch (err) {
      toast(apiError(err));
    }
  };

  return (
    <div className="card">
      <h3>
        <Ic as={GraduationCap} />Quiz library<small className="sub tcount-h">{items.length} total</small>
        <span className="qz-lib-acts">
          <button type="button" className="btn o sm" onClick={() => setBank(true)}><Ic as={Library} />Question bank</button>
          {canEdit && <button type="button" className="btn p sm" onClick={() => setBuilder({})}><Ic as={Plus} />New quiz</button>}
        </span>
      </h3>
      {!items.length && <Empty icon={GraduationCap}>No quizzes yet. Press “New quiz” to build one from the Classified questions.</Empty>}
      <div className="tbl" role="list">
        {items.map(q => {
          const st = STATUS[q.status];
          return (
            <div className="trow" role="listitem" key={q._id}>
              <button type="button" className="trow-open" onClick={() => (q.status === 'draft' ? setBuilder({ id: q._id }) : setResults(q._id))}>
                <span className="lic"><Ic as={GraduationCap} /></span>
                <span className="lmain"><b>{q.title}</b><small>{q.questions} questions · {q.totalMarks} marks{q.mode === 'online' ? ` · ${q.settings.durationMin} min` : ''} · {fmtDate(q.publishedAt || q.createdAt)}</small></span>
                <span className="tchips">
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  <span className="chip c-th">{q.mode === 'paper' ? 'Paper' : 'In portal'}</span>
                  {q.status !== 'draft' && <span className="tcount"><b>{q.stats.submitted}</b> submitted</span>}
                  {q.stats.toReview > 0 && <span className="chip c-am">{q.stats.toReview} to review</span>}
                  {q.stats.flagged > 0 && <span className="chip c-rd"><ShieldAlert size={11} /> {q.stats.flagged}</span>}
                  {q.stats.average !== null && <span className="chip c-pr">avg {q.stats.average}%</span>}
                </span>
                <Ic as={ChevronRight} />
              </button>
              {canEdit && <button type="button" className="ib sm" aria-label={`Edit ${q.title}`} onClick={() => setBuilder({ id: q._id })}><Ic as={Pencil} /></button>}
              {canEdit && <button type="button" className="ib sm dng" aria-label={`Delete ${q.title}`} onClick={() => remove(q)}><Ic as={Trash2} /></button>}
            </div>
          );
        })}
      </div>
      {builder && <QuizBuilder open onClose={() => { setBuilder(null); list.reload(); }} quizId={builder.id || null} />}
      {results && <QuizResults quizId={results} onClose={() => { setResults(null); list.reload(); }} onEdit={(id) => { setResults(null); setBuilder({ id }); }} />}
      {bank && <BankEditor onClose={() => setBank(false)} />}
    </div>
  );
}
