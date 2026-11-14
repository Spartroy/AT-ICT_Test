import React, { useState } from 'react';
import { Check, ChevronDown, Hourglass, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { ErrorNote, Ic, Loading, Ring } from '../../components/portal/kit';
import { questionTitle } from './quizLogic';
import '../../styles/quizgen.css';

const S = API_ENDPOINTS.THEORY_QUIZ.STUDENT;

/** A student's report: score, what is still waiting for the teacher, weak topics, and every question marked. */
export default function QuizResult({ attemptId, title, onClose }) {
  const res = useApi(`${S}/attempts/${attemptId}/result`, b => b.data);
  const d = res.data;
  return (
    <div className="sg-screen qz-screen" role="dialog" aria-modal="true" aria-label="Quiz result">
      <div className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={onClose}><Ic as={X} />Close</button>
        <h2 className="sg-screen-title">{d?.title || title || 'Your result'}</h2>
        <div className="sg-screen-acts" />
      </div>
      <div className="sg-screen-body">
        <div className="sg-screen-inner qz-inner qz-result">
          {res.loading && !d && <Loading label="Marking your answers…" />}
          {res.error && <ErrorNote error={res.error} onRetry={res.reload} />}
          {d && <Report d={d} />}
        </div>
      </div>
    </div>
  );
}

function Report({ d }) {
  if (d.paper) return <PaperReport d={d} />;
  const final = d.reviewed;
  const percent = d.max ? Math.round((d.score / (final ? d.max : d.scoredOutOf || 1)) * 100) : 0;
  const pass = final && d.percent >= (d.passMark ?? 50);
  const weak = d.topics.filter(t => t.max).map(t => ({ ...t, p: Math.round((t.got / t.max) * 100) })).sort((a, b) => a.p - b.p);
  return (
    <>
      <section className={`card qz-hero ${final ? (pass ? 'pass' : 'fail') : ''}`}>
        <Ring p={final ? d.percent : percent} size={120} fs="1.7rem" w={9} label={final ? 'Your score' : 'So far'} color={final ? (pass ? 'var(--ok)' : 'var(--crimson-glow)') : 'var(--am)'} />
        <div>
          <h2>{final ? `${d.score} / ${d.max}` : `${d.score} / ${d.scoredOutOf}`}<small>{final ? ` · ${d.percent}%` : ' on the questions marked automatically'}</small></h2>
          {final && <p>{pass ? 'Well done, you passed this quiz.' : 'Not there yet. Look at the topics below and try again after revising.'}</p>}
          {d.awaitingReview && <p className="qz-wait"><Hourglass size={15} /> Your written answers are waiting for your teacher to check them. The final score appears here once they have.</p>}
          {d.autoSubmitted && <p className="qz-wait">Your time ran out, so the quiz was handed in for you.</p>}
        </div>
      </section>

      {weak.length > 0 && (
        <section className="card">
          <h3>By topic</h3>
          {weak.map(t => <div key={t.topic} className="qz-bar-row"><span>{t.topic}</span><div><i className={t.p < 50 ? 'low' : t.p < 75 ? 'mid' : 'hi'} style={{ width: `${t.p}%` }} /></div><b>{t.p}%</b></div>)}
          {weak[0].p < 75 && <p className="qz-revise">Revise first: <b>{weak.filter(t => t.p < 75).slice(0, 3).map(t => t.topic).join(', ')}</b></p>}
        </section>
      )}

      <section className="qz-items">
        {d.items.map((it, i) => <Item key={it.uid} n={i + 1} it={it} />)}
      </section>
    </>
  );
}

function PaperReport({ d }) {
  return (
    <>
      <section className="card qz-hero pass">
        <Ring p={d.percent || 0} size={120} fs="1.7rem" w={9} label="Your mark" color="var(--ok)" />
        <div><h2>{d.score} / {d.max}<small> · {d.percent}%</small></h2><p>Marked by your teacher from your paper.</p></div>
      </section>
      <section className="card">
        <h3>Question by question</h3>
        {d.items.map((it, i) => <div key={i} className="qz-bar-row q"><span><b>Q{i + 1}</b> {questionTitle(it).slice(0, 90)}<small>{it.category}</small></span><div><i className={it.awarded / it.max < 0.5 ? 'low' : it.awarded / it.max < 0.75 ? 'mid' : 'hi'} style={{ width: `${(it.awarded / it.max) * 100}%` }} /></div><b>{it.awarded}/{it.max}</b></div>)}
      </section>
    </>
  );
}

function Item({ n, it }) {
  const [open, setOpen] = useState(false);
  const full = !it.pending && it.awarded === it.max;
  return (
    <article className={`qz-ritem ${it.pending ? 'wait' : full ? 'ok' : it.awarded > 0 ? 'part' : 'no'}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="qz-no">Q{n}</span>
        <span className="qz-rt">{questionTitle(it).slice(0, 140)}<small>{it.topic} · {it.category}</small></span>
        <span className={`chip ${it.pending ? 'c-am' : full ? 'c-pr' : it.awarded > 0 ? 'c-am' : 'c-rd'}`}>{it.pending ? 'Waiting' : `${it.awarded}/${it.max}`}</span>
        <ChevronDown size={16} className={open ? 'open' : ''} />
      </button>
      {open && (
        <div className="qz-rbody">
          {it.rows && it.rows.map((r, i) => (
            <div key={i} className={`qz-rrow ${r.correct ? 'ok' : 'no'}`}>
              <i>{r.correct ? <Check size={13} /> : <X size={13} />}</i>
              <span>{r.label}</span>
              <em>{r.given || 'No answer'}</em>
              {!r.correct && <strong>Answer: {r.expected}</strong>}
            </div>
          ))}
          {it.note && <p className="qz-note">{it.note}</p>}
          {it.pending && <p className="qz-note">Your answer is saved. Your teacher will mark it soon.</p>}
          {it.pending && it.answer && <div className="qz-ans">{Array.isArray(it.answer) ? it.answer.filter(Boolean).join('\n') : it.answer}</div>}
          {it.parts && it.parts.map((p, i) => (
            <div key={i} className="qz-wpart">
              {p.label && <p className="qz-wq"><b>({p.label})</b> {p.text}</p>}
              <div className="qz-ans">{p.answer || <em>No answer</em>}</div>
              <div className="qz-pts">{(p.matched || []).map(m => <span key={m} className="hit"><Check size={11} />{m}</span>)}{(p.missed || []).map(m => <span key={m} className="miss">{m}</span>)}</div>
              <p className="qz-score">{p.awarded} / {p.max} marks</p>
              {p.feedback && <p className="qz-fb-note">Teacher: {p.feedback}</p>}
              <details><summary>Model answer</summary><div className="qz-model"><small>Model answer</small>{String(p.model || '').split('\n').map((l, k) => <p key={k}>{l}</p>)}</div></details>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
