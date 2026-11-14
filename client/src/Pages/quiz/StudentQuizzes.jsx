import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, Clock, FileText, GraduationCap, Hourglass, ListChecks, Play, RefreshCw, RotateCcw, Timer } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import QuizPlayer from './QuizPlayer';
import QuizResult from './QuizResult';
import { countdownLabel } from './quizLogic';
import '../../styles/quizgen.css';

const S = API_ENDPOINTS.THEORY_QUIZ.STUDENT;
const TODO = ['open', 'in_progress', 'upcoming'];

/** Ticks every second so countdowns move. `offset` is how far this device's clock is from the server's. */
function useNow(offset, live) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    if (!live) return undefined;
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset, live]);
  return now;
}

/** The student's Quizzes tab: quizzes to take, and the report for the ones already done. */
export default function StudentQuizzes({ onChange }) {
  const list = useApi(`${S}/quizzes`, b => ({ quizzes: b.data?.quizzes || [], serverNow: b.data?.serverNow }));
  const [playing, setPlaying] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [checked, setChecked] = useState(() => new Date());

  const items = useMemo(() => list.data?.quizzes || [], [list.data]);
  const offset = useMemo(() => (list.data?.serverNow ? new Date(list.data.serverNow).getTime() - Date.now() : 0), [list.data]);
  const waiting = items.some(q => q.state === 'upcoming' || q.state === 'submitted');
  const now = useNow(offset, waiting);

  // Quizzes being marked are checked again every half minute, so the report appears without a page reload
  const reload = list.reload;
  useEffect(() => {
    if (!items.some(q => q.state === 'submitted')) return undefined;
    const t = setInterval(() => { reload(); setChecked(new Date()); }, 30000);
    return () => clearInterval(t);
  }, [items, reload]);

  if (list.loading && !list.data) return <Loading label="Loading quizzes…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;

  const todo = items.filter(q => TODO.includes(q.state));
  const done = items.filter(q => !TODO.includes(q.state));

  const refresh = () => { list.reload(); setChecked(new Date()); };
  const finished = (quiz, attemptId) => {
    setPlaying(null);
    setViewing({ attemptId, title: quiz.title });
    list.reload();
    onChange?.();
  };

  return (
    <div className="qz-student">
      <div className="qz-refresh">
        <small>Checked {checked.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</small>
        <button type="button" className="btn o sm" onClick={refresh} disabled={list.loading} aria-label="Refresh quizzes"><Ic as={RefreshCw} className={list.loading ? 'i qz-spin' : 'i'} />Refresh</button>
      </div>
      {!items.length && <div className="card"><Empty icon={GraduationCap}>No quizzes yet. When your teacher publishes one it shows up here.</Empty></div>}
      {todo.length > 0 && (
        <section>
          <h3 className="qz-sh">To do</h3>
          <div className="qz-cards">{todo.map(q => <QuizCard key={q._id} q={q} now={now} onStart={() => setPlaying(q)} />)}</div>
        </section>
      )}
      {done.length > 0 && (
        <section>
          <h3 className="qz-sh">Done</h3>
          <div className="qz-cards">{done.map(q => <QuizCard key={q._id} q={q} now={now} onOpen={() => q.attemptId && setViewing({ attemptId: q.attemptId, title: q.title })} />)}</div>
        </section>
      )}
      {playing && <QuizPlayer quiz={playing} onExit={() => setPlaying(null)} onFinish={(id) => finished(playing, id)} />}
      {viewing && <QuizResult attemptId={viewing.attemptId} title={viewing.title} onClose={() => { setViewing(null); list.reload(); }} />}
    </div>
  );
}

function QuizCard({ q, now, onStart, onOpen }) {
  const pct = q.score !== null && q.max ? Math.round((q.score / q.max) * 100) : null;
  const pass = pct !== null && pct >= (q.passMark ?? 50);
  const opensIn = q.state === 'upcoming' && q.opensAt ? new Date(q.opensAt).getTime() - now : 0;
  // When the countdown reaches zero the card opens by itself (the server still checks when the student presses Start)
  const state = q.state === 'upcoming' && q.opensAt && opensIn <= 0 ? 'open' : q.state;
  return (
    <article className={`card qz-scard ${state}`}>
      <div className="qz-sc-h">
        <span className="lic"><Ic as={q.mode === 'paper' ? FileText : GraduationCap} /></span>
        <div><b>{q.title}</b>{q.mode === 'paper' && <small>On paper</small>}</div>
      </div>
      <div className="qz-sc-facts" aria-label="Quiz details">
        <span title="Questions"><ListChecks size={15} />{q.questions} questions</span>
        <span title="Marks"><Award size={15} />{q.totalMarks} marks</span>
        {q.mode === 'online' && <span title="Time allowed"><Timer size={15} />{q.durationMin} min</span>}
      </div>
      {q.description && <p className="qz-sc-d">{q.description}</p>}
      {state === 'upcoming' && q.opensAt && (
        <div className="qz-opens" role="timer" aria-label="Time until the quiz opens">
          <Clock size={18} /><div><small>Opens in</small><b>{countdownLabel(opensIn)}</b></div>
        </div>
      )}
      <div className="qz-sc-f">
        {state === 'open' && <><span className="chip c-pr">Open now</span>{q.closesAt && <small><Ic as={Clock} /> closes {fmtDateTime(q.closesAt)}</small>}<button type="button" className="btn p sm qz-pop" onClick={onStart}><Ic as={Play} />Start quiz</button></>}
        {state === 'in_progress' && <><span className="chip c-am">In progress</span><button type="button" className="btn p sm qz-pop" onClick={onStart}><Ic as={RotateCcw} />Continue</button></>}
        {state === 'upcoming' && <><span className="chip c-th">Opens {fmtDateTime(q.opensAt)}</span></>}
        {state === 'submitted' && <><span className="chip c-am"><Hourglass size={11} /> Being marked</span><button type="button" className="btn o sm" onClick={onOpen}>See answers so far</button></>}
        {state === 'graded' && <><span className={`chip ${pass ? 'c-pr' : 'c-rd'}`}><CheckCircle2 size={11} /> {q.score}/{q.max} · {pct}%</span><button type="button" className="btn o sm" onClick={onOpen}>View report</button></>}
        {state === 'paper' && <><span className="chip c-gy">Paper quiz</span><small>Your teacher adds your mark after marking.</small></>}
        {state === 'missed' && <><span className="chip c-gy">Closed</span><small>You didn’t take this one.</small></>}
      </div>
    </article>
  );
}

