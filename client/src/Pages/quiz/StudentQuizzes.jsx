import React, { useState } from 'react';
import { CheckCircle2, Clock, FileText, GraduationCap, Hourglass, Play, RotateCcw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import QuizPlayer from './QuizPlayer';
import QuizResult from './QuizResult';
import '../../styles/quizgen.css';

const S = API_ENDPOINTS.THEORY_QUIZ.STUDENT;
const TODO = ['open', 'in_progress', 'upcoming'];

/** The student's Quizzes tab: quizzes to take, and the report for the ones already done. */
export default function StudentQuizzes({ onChange }) {
  const list = useApi(`${S}/quizzes`, b => b.data?.quizzes || []);
  const [playing, setPlaying] = useState(null);
  const [viewing, setViewing] = useState(null);

  if (list.loading && !list.data) return <Loading label="Loading quizzes…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];
  const todo = items.filter(q => TODO.includes(q.state));
  const done = items.filter(q => !TODO.includes(q.state));

  const finished = (quiz, attemptId) => {
    setPlaying(null);
    setViewing({ attemptId, title: quiz.title });
    list.reload();
    onChange?.();
  };

  return (
    <div className="qz-student">
      {!items.length && <div className="card"><Empty icon={GraduationCap}>No quizzes yet. When your teacher publishes one it shows up here.</Empty></div>}
      {todo.length > 0 && (
        <section>
          <h3 className="qz-sh">To do</h3>
          <div className="qz-cards">{todo.map(q => <QuizCard key={q._id} q={q} onStart={() => setPlaying(q)} />)}</div>
        </section>
      )}
      {done.length > 0 && (
        <section>
          <h3 className="qz-sh">Done</h3>
          <div className="qz-cards">{done.map(q => <QuizCard key={q._id} q={q} onOpen={() => q.attemptId && setViewing({ attemptId: q.attemptId, title: q.title })} />)}</div>
        </section>
      )}
      {playing && <QuizPlayer quiz={playing} onExit={() => setPlaying(null)} onFinish={(id) => finished(playing, id)} />}
      {viewing && <QuizResult attemptId={viewing.attemptId} title={viewing.title} onClose={() => { setViewing(null); list.reload(); }} />}
    </div>
  );
}

function QuizCard({ q, onStart, onOpen }) {
  const pct = q.score !== null && q.max ? Math.round((q.score / q.max) * 100) : null;
  const pass = pct !== null && pct >= (q.passMark ?? 50);
  return (
    <article className={`card qz-scard ${q.state}`}>
      <div className="qz-sc-h">
        <span className="lic"><Ic as={q.mode === 'paper' ? FileText : GraduationCap} /></span>
        <div><b>{q.title}</b><small>{q.questions} questions · {q.totalMarks} marks{q.mode === 'online' ? ` · ${q.durationMin} min` : ' · on paper'}</small></div>
      </div>
      {q.description && <p className="qz-sc-d">{q.description}</p>}
      <div className="qz-sc-f">
        {q.state === 'open' && <><span className="chip c-pr">Open now</span>{q.closesAt && <small><Ic as={Clock} /> closes {fmtDateTime(q.closesAt)}</small>}<button type="button" className="btn p sm" onClick={onStart}><Ic as={Play} />Start quiz</button></>}
        {q.state === 'in_progress' && <><span className="chip c-am">In progress</span><button type="button" className="btn p sm" onClick={onStart}><Ic as={RotateCcw} />Continue</button></>}
        {q.state === 'upcoming' && <><span className="chip c-th">Opens {fmtDateTime(q.opensAt)}</span></>}
        {q.state === 'submitted' && <><span className="chip c-am"><Hourglass size={11} /> Being marked</span><button type="button" className="btn o sm" onClick={onOpen}>See answers so far</button></>}
        {q.state === 'graded' && <><span className={`chip ${pass ? 'c-pr' : 'c-rd'}`}><CheckCircle2 size={11} /> {q.score}/{q.max} · {pct}%</span><button type="button" className="btn o sm" onClick={onOpen}>View report</button></>}
        {q.state === 'paper' && <><span className="chip c-gy">Paper quiz</span><small>Your teacher adds your mark after marking.</small></>}
        {q.state === 'missed' && <><span className="chip c-gy">Closed</span><small>You didn’t take this one.</small></>}
      </div>
    </article>
  );
}
