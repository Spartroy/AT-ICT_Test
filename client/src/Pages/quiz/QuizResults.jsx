import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BarChart3, Bot, Check, CheckCircle2, ClipboardCheck, Download, Printer, ShieldAlert, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import useApi from '../../hooks/useApi';
import { Empty, ErrorNote, Ic, Loading, Seg, fmtDateTime, initials } from '../../components/portal/kit';
import { Dialog, DialogHeader, useToast } from '../../components/portal/PortalUI';
import { announceChange, apiError } from '../teacher/modals/form';
import { openPaper } from './paperPrint';
import { RISK, formatClock, pctClass, questionTitle } from './quizLogic';
import '../../styles/quizgen.css';

const T = API_ENDPOINTS.THEORY_QUIZ.TEACHER;
const STATUS = {
  not_started: { label: 'Not started', cls: 'c-gy' },
  in_progress: { label: 'Answering', cls: 'c-am' },
  submitted: { label: 'To review', cls: 'c-am' },
  graded: { label: 'Marked', cls: 'c-pr' }
};
const pct = (s, m) => (m ? Math.round((s / m) * 100) : 0);

/** Results screen for one quiz: students, per-question report, and paper-mark entry. */
export default function QuizResults({ quizId, onClose, onEdit }) {
  const toast = useToast();
  const quiz = useApi(`${T}/quizzes/${quizId}`, b => b.data?.quiz);
  const list = useApi(`${T}/quizzes/${quizId}/attempts`, b => b.data?.attempts || []);
  const [tab, setTab] = useState('students');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = quiz.data;
  const rows = list.data || [];
  const isPaper = q?.mode === 'paper';
  const toReview = rows.filter(r => r.status === 'submitted').length;
  const reload = () => { quiz.reload(); list.reload(); };

  useEffect(() => { if (isPaper) setTab(t => (t === 'students' ? 'paper' : t)); }, [isPaper]);

  const confirmAll = async () => {
    setBusy(true);
    try {
      const r = await api.post(`${T}/quizzes/${quizId}/confirm-all`, {});
      toast(`${r.data.confirmed} attempt${r.data.confirmed === 1 ? '' : 's'} marked and released`);
      announceChange('quiz');
      reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const lines = [['Student', 'Group', 'Status', 'Score', 'Out of', 'Percent', 'Submitted', 'Integrity']];
    rows.forEach(r => lines.push([r.student?.name, r.student?.group || '', STATUS[r.status]?.label || r.status, r.score ?? '', r.max ?? '', r.score !== null && r.score !== undefined ? pct(r.score, r.max) : '', r.submittedAt ? new Date(r.submittedAt).toISOString() : '', r.risk ? RISK[r.risk]?.label : '']));
    const csv = lines.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' }));
    a.download = `${(q?.title || 'quiz').replace(/[^\w-]+/g, '_')}-results.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const printKey = async (answerKey) => {
    try {
      const full = await api.get(`${T}/quizzes/${quizId}`);
      if (!openPaper({ quiz: full.data.quiz, items: full.data.quiz.items, answerKey })) toast('Allow pop-ups to open the paper');
    } catch (err) {
      toast(apiError(err));
    }
  };

  const setStatus = async (publish) => {
    try {
      await api.post(`${T}/quizzes/${quizId}/publish`, { publish });
      announceChange('quiz');
      reload();
      toast(publish ? 'Quiz published' : 'Quiz closed');
    } catch (err) {
      toast(apiError(err));
    }
  };

  return (
    <div className="sg-screen qz-screen" role="dialog" aria-modal="true" aria-label="Quiz results">
      <div className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={onClose}><Ic as={X} />Close</button>
        <h2 className="sg-screen-title">{q?.title || 'Quiz'}</h2>
        <div className="sg-screen-acts">
          {q && onEdit && <button type="button" className="btn o sm" onClick={() => onEdit(q._id)}>Edit</button>}
        </div>
      </div>
      <div className="sg-screen-body">
        <div className="sg-screen-inner qz-inner">
          {(quiz.loading && !q) && <Loading label="Loading results…" />}
          {quiz.error && <ErrorNote error={quiz.error} onRetry={reload} />}
          {q && (
            <>
              <div className="qz-resh">
                <div>
                  <span className={`chip ${q.status === 'published' ? 'c-pr' : q.status === 'closed' ? 'c-gy' : 'c-am'}`}>{q.status}</span>
                  <span className="chip c-th">{q.mode === 'paper' ? 'Paper' : 'In portal'}</span>
                  <span className="qz-meta">{q.questions} questions · {q.totalMarks} marks{q.mode === 'online' ? ` · ${q.settings.durationMin} min` : ''}{q.stats.average !== null ? ` · class average ${q.stats.average}%` : ''}</span>
                </div>
                <div className="qz-resh-acts">
                  {toReview > 0 && <button type="button" className="btn p sm" disabled={busy} onClick={confirmAll}><Ic as={CheckCircle2} />Accept all suggested marks ({toReview})</button>}
                  <button type="button" className="btn o sm" onClick={() => printKey(false)}><Ic as={Printer} />Paper</button>
                  <button type="button" className="btn o sm" onClick={() => printKey(true)}><Ic as={ClipboardCheck} />Mark scheme</button>
                  <button type="button" className="btn o sm" onClick={exportCsv}><Ic as={Download} />CSV</button>
                  {q.status === 'published' ? <button type="button" className="btn o sm" onClick={() => setStatus(false)}>Close quiz</button> : <button type="button" className="btn o sm" onClick={() => setStatus(true)}>{q.status === 'closed' ? 'Reopen' : 'Publish'}</button>}
                </div>
              </div>
              <Seg
                label="Results sections"
                value={tab}
                onChange={setTab}
                tabs={[
                  ...(isPaper ? [{ id: 'paper', label: 'Enter marks', icon: ClipboardCheck }] : []),
                  { id: 'students', label: 'Students', icon: Users, count: toReview || '' },
                  { id: 'report', label: 'Report', icon: BarChart3 }
                ]}
              />
              {tab === 'students' && <StudentsTab rows={rows} loading={list.loading && !list.data} error={list.error} onOpen={setOpen} paper={isPaper} />}
              {tab === 'report' && <ReportTab quizId={quizId} onOpen={(id) => setOpen(id)} />}
              {tab === 'paper' && <PaperTab quiz={q} rows={rows} reload={reload} />}
            </>
          )}
        </div>
      </div>
      {open && <AttemptReview quizId={quizId} attemptId={open} onClose={() => { setOpen(null); reload(); }} />}
    </div>
  );
}

function StudentsTab({ rows, loading, error, onOpen, paper }) {
  if (loading) return <Loading label="Loading students…" />;
  if (error) return <ErrorNote error={error} />;
  if (!rows.length) return <Empty icon={Users}>No students are assigned to this quiz.</Empty>;
  return (
    <div className="card qz-table">
      <div className="tbl" role="list">
        {rows.map(r => {
          const st = STATUS[r.status] || STATUS.not_started;
          const canOpen = r.attemptId && r.status !== 'in_progress' && !paper;
          return (
            <div className="trow" role="listitem" key={r.student?._id || r.attemptId}>
              <button type="button" className="trow-open" disabled={!canOpen} onClick={() => onOpen(r.attemptId)}>
                <span className="av" aria-hidden="true">{initials(r.student?.name)}</span>
                <span className="lmain"><b>{r.student?.name}</b><small>{r.student?.group ? `Group ${r.student.group}` : 'No group'}{r.submittedAt ? ` · ${fmtDateTime(r.submittedAt)}` : ''}{r.autoSubmitted ? ' · time ran out' : ''}</small></span>
                <span className="tchips">
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  {r.score !== null && r.score !== undefined && r.status !== 'not_started' && <span className={`chip ${pctClass(pct(r.score, r.max))}`}>{r.score}/{r.max} · {pct(r.score, r.max)}%</span>}
                  {r.aiMarked && r.status === 'submitted' && <span className="chip c-th" title="Marks suggested by AI"><Bot size={11} /> AI</span>}
                  {r.risk && r.risk !== 'none' && <span className={`chip ${RISK[r.risk].cls}`} title={`${r.flags} integrity flag${r.flags === 1 ? '' : 's'}`}><ShieldAlert size={11} /> {RISK[r.risk].label}</span>}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- report ----------------------------------------------------------------------------------------------------------

function ReportTab({ quizId, onOpen }) {
  const report = useApi(`${T}/quizzes/${quizId}/report`, b => b.data);
  const d = report.data;
  if (report.loading && !d) return <Loading label="Building the report…" />;
  if (report.error) return <ErrorNote error={report.error} onRetry={report.reload} />;
  if (!d || !d.submitted) return <Empty icon={BarChart3}>The report appears once students have submitted.</Empty>;
  const maxBucket = Math.max(1, ...d.distribution.map(b => b.count));
  return (
    <div className="qz-report">
      <div className="qz-kpis">
        {[['Submitted', d.submitted], ['Average', `${d.average}%`], ['Highest', `${d.highest}%`], ['Lowest', `${d.lowest}%`], ['Pass rate', `${d.passRate}%`]].map(([k, v]) => <div key={k} className="card"><small>{k}</small><b>{v}</b></div>)}
      </div>
      <div className="qz-cols">
        <section className="card"><h3>Score spread</h3>
          <div className="qz-hist">{d.distribution.map(b => <div key={b.label}><i style={{ height: `${(b.count / maxBucket) * 100}%` }}><em>{b.count || ''}</em></i><span>{b.label}</span></div>)}</div>
        </section>
        <section className="card"><h3>Topics to revisit</h3>
          {d.topics.slice(0, 6).map(t => <div key={t.topic} className="qz-bar-row"><span>{t.topic}</span><div><i className={t.percent < 50 ? 'low' : t.percent < 75 ? 'mid' : 'hi'} style={{ width: `${t.percent}%` }} /></div><b>{t.percent}%</b></div>)}
        </section>
      </div>
      <section className="card"><h3>Question by question<small className="sub tcount-h">How many marks the class earned</small></h3>
        {d.items.map((it, i) => (
          <div key={it.uid} className="qz-bar-row q"><span><b>Q{i + 1}</b> {questionTitle(it).slice(0, 90)}<small>{it.category} · {it.marks} marks</small></span><div><i className={it.facility < 40 ? 'low' : it.facility < 70 ? 'mid' : 'hi'} style={{ width: `${it.facility ?? 0}%` }} /></div><b>{it.facility ?? '–'}%</b></div>
        ))}
      </section>
      {d.similar.length > 0 && (
        <section className="card qz-similar"><h3><Ic as={AlertTriangle} />Answers that look alike<small className="sub tcount-h">Worth a conversation, not proof</small></h3>
          {d.similar.map((s, i) => (
            <div key={i} className="qz-sim"><b>{s.a}</b> and <b>{s.b}</b><small>{s.reasons.join(' · ')}</small>
              <span><button type="button" className="btn o sm" onClick={() => onOpen(s.attemptA)}>{s.a.split(' ')[0]}</button><button type="button" className="btn o sm" onClick={() => onOpen(s.attemptB)}>{s.b.split(' ')[0]}</button></span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ---- paper marks -------------------------------------------------------------------------------------------------------

function PaperTab({ quiz, rows, reload }) {
  const toast = useToast();
  const [sid, setSid] = useState('');
  const [marks, setMarks] = useState({});
  const [busy, setBusy] = useState(false);
  const row = rows.find(r => String(r.student?._id) === sid);
  const detail = useApi(row?.attemptId ? `${T}/quizzes/${quiz._id}/attempts/${row.attemptId}` : null, b => b.data);
  const full = useApi(`${T}/quizzes/${quiz._id}`, b => b.data?.quiz);
  const items = full.data?.items || [];

  useEffect(() => {
    if (!sid) return;
    const m = {};
    (detail.data?.attempt?.grades || []).forEach(g => { if (g.entered) m[g.uid] = g.awarded; });
    setMarks(m);
  }, [sid, detail.data]);

  const total = items.reduce((n, it) => n + (Number(marks[it.uid]) || 0), 0);
  const save = async () => {
    setBusy(true);
    try {
      await api.put(`${T}/quizzes/${quiz._id}/paper`, { studentId: sid, marks });
      toast('Marks saved. The student can see them now.');
      announceChange('quiz');
      reload();
      const idx = rows.findIndex(r => String(r.student?._id) === sid);
      const next = rows.slice(idx + 1).find(r => r.status !== 'graded');
      setSid(next ? String(next.student._id) : '');
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qz-paper">
      <aside className="card">
        <h3>Students</h3>
        <div className="qz-plist">
          {rows.map(r => (
            <button key={r.student?._id} type="button" className={String(r.student?._id) === sid ? 'on' : ''} onClick={() => setSid(String(r.student._id))}>
              <span className="av" aria-hidden="true">{initials(r.student?.name)}</span>
              <span>{r.student?.name}</span>
              {r.status === 'graded' ? <span className="chip c-pr">{r.score}/{r.max}</span> : <span className="chip c-gy">—</span>}
            </button>
          ))}
        </div>
      </aside>
      <section className="card">
        {!sid && <Empty icon={ClipboardCheck}>Choose a student, then type the mark they earned on each question.</Empty>}
        {sid && (
          <>
            <h3>{row?.student?.name}<small className="sub tcount-h">{total} / {quiz.totalMarks}</small></h3>
            {full.loading && !items.length && <Loading />}
            <div className="qz-marks-grid">
              {items.map((it, i) => (
                <label key={it.uid}>
                  <span><b>Q{i + 1}</b> {questionTitle(it).slice(0, 70)}<small>{it.category}</small></span>
                  <input className="inp" type="number" min="0" max={it.marks} step="0.5" value={marks[it.uid] ?? ''} placeholder="0" onChange={e => setMarks(m => ({ ...m, [it.uid]: e.target.value }))} aria-label={`Marks for question ${i + 1}`} />
                  <em>/ {it.marks}</em>
                </label>
              ))}
            </div>
            <div className="mfoot"><button type="button" className="btn p" disabled={busy} onClick={save}><Ic as={Check} />{busy ? 'Saving…' : 'Save and next student'}</button></div>
          </>
        )}
      </section>
    </div>
  );
}

// ---- reviewing one attempt ------------------------------------------------------------------------------------------------

function AttemptReview({ quizId, attemptId, onClose }) {
  const toast = useToast();
  const data = useApi(`${T}/quizzes/${quizId}/attempts/${attemptId}`, b => b.data);
  const [marks, setMarks] = useState({});
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState('');
  const seeded = useRef(null);
  const attempt = data.data?.attempt;
  const quiz = data.data?.quiz;

  useEffect(() => {
    if (!attempt || seeded.current === attempt._id + attempt.score) return;
    seeded.current = attempt._id + attempt.score;
    const m = {};
    const n = {};
    attempt.grades.forEach((g, gi) => (g.parts || []).forEach((p, pi) => { m[`${gi}:${pi}`] = p.awarded; if (p.feedback) n[`${gi}:${pi}`] = p.feedback; }));
    setMarks(m);
    setNotes(n);
  }, [attempt]);

  const live = useMemo(() => {
    if (!attempt) return 0;
    return attempt.grades.reduce((sum, g, gi) => sum + (g.parts ? g.parts.reduce((s, p, pi) => s + (Number(marks[`${gi}:${pi}`] ?? p.awarded) || 0), 0) : (g.awarded || 0)), 0);
  }, [attempt, marks]);

  const send = async (confirm) => {
    setBusy(confirm ? 'confirm' : 'save');
    try {
      await api.put(`${T}/quizzes/${quizId}/attempts/${attemptId}/review`, { marks, comments: notes, confirm });
      toast(confirm ? 'Marked and released to the student' : 'Marks saved');
      announceChange('quiz');
      if (confirm) onClose(); else data.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy('');
    }
  };

  const askAi = async () => {
    setBusy('ai');
    try {
      const r = await api.post(`${T}/quizzes/${quizId}/attempts/${attemptId}/ai`, {});
      toast(`AI re-marked ${r.data.suggested} answer${r.data.suggested === 1 ? '' : 's'}`);
      seeded.current = null;
      data.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <Dialog open onClose={onClose} size="wide" labelledBy="qz-rev-t" className="qz-review">
      <DialogHeader id="qz-rev-t" icon={ClipboardCheck} title={attempt ? `${attempt.student?.name}` : 'Attempt'} sub={attempt ? `${attempt.status === 'graded' ? 'Marked' : 'Waiting for you'} · submitted ${fmtDateTime(attempt.submittedAt)}${attempt.autoSubmitted ? ' (time ran out)' : ''}` : ''} onClose={onClose} />
      <div className="mbody">
        {data.loading && !attempt && <Loading />}
        {data.error && <ErrorNote error={data.error} onRetry={data.reload} />}
        {attempt && quiz && (
          <>
            <Integrity integrity={attempt.integrity} />
            {quiz.items.map((it, gi) => <ReviewItem key={it.uid} index={gi} item={it} grade={attempt.grades[gi]} answer={attempt.answers?.[it.uid]} marks={marks} setMarks={setMarks} notes={notes} setNotes={setNotes} />)}
            <div className="qz-revfoot">
              <div className="qz-total"><b>{Math.round(live * 2) / 2}</b> / {attempt.maxScore}<small>{pct(live, attempt.maxScore)}%</small></div>
              <div>
                <button type="button" className="btn o" disabled={!!busy} onClick={askAi}><Ic as={Bot} />{busy === 'ai' ? 'Marking…' : 'Ask AI to re-mark'}</button>
                <button type="button" className="btn o" disabled={!!busy} onClick={() => send(false)}>{busy === 'save' ? 'Saving…' : 'Save'}</button>
                <button type="button" className="btn p" disabled={!!busy} onClick={() => send(true)}><Ic as={CheckCircle2} />{attempt.status === 'graded' ? 'Update & release' : 'Confirm & release'}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function Integrity({ integrity }) {
  const [open, setOpen] = useState(false);
  if (!integrity) return null;
  const r = RISK[integrity.risk] || RISK.none;
  return (
    <div className={`qz-integrity ${integrity.risk}`}>
      <div><Ic as={ShieldAlert} /><b>Integrity</b><span className={`chip ${r.cls}`}>{r.label}</span>
        <small>{integrity.tabLeaves} tab leaves · {formatClock(integrity.awayMs)} away · {integrity.pastes} pastes · {integrity.fullscreenExits} fullscreen exits</small>
      </div>
      {integrity.flags.length > 0 ? <ul>{integrity.flags.map(f => <li key={f.id} className={f.severity}>{f.text}</li>)}</ul> : <p>Nothing unusual was recorded.</p>}
      {integrity.flags.length > 0 && <button type="button" className="qz-linkbtn" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'What does this mean?'}</button>}
      {open && <p className="qz-note">These come from the browser (leaving the tab, pasting, full screen). Students sometimes leave by accident or lose connection, so use them as a prompt for a quick chat rather than proof.</p>}
    </div>
  );
}

function ReviewItem({ index, item, grade, answer, marks, setMarks, notes, setNotes }) {
  const written = !!grade?.parts;
  return (
    <article className="qz-rev">
      <header><span className="qz-no">Q{index + 1}</span><b>{questionTitle(item).slice(0, 160)}</b><span className="chip c-gy">{item.category}</span></header>
      {!written && grade && (
        <div className="qz-rows">
          {(grade.rows || []).map((r, i) => (
            <div key={i} className={r.correct ? 'ok' : 'no'}>
              <i>{r.correct ? <Check size={13} /> : <X size={13} />}</i>
              <span>{r.label}</span>
              <em>{r.given || '—'}</em>
              {!r.correct && <strong>{r.expected}</strong>}
            </div>
          ))}
          {grade.note && <small>{grade.note}</small>}
          <div className="qz-got">{grade.parts ? '' : `${Math.round(((grade.rows || []).filter(r => r.correct).length / Math.max(1, (grade.rows || []).length)) * grade.max * 2) / 2} / ${grade.max}`}</div>
        </div>
      )}
      {written && grade.parts.map((p, pi) => {
        const key = `${index}:${pi}`;
        return (
          <div className="qz-wpart" key={pi}>
            {p.label && <p className="qz-wq"><b>({p.label})</b> {p.text}</p>}
            <div className="qz-ans">{String(p.answer || answer || '').trim() || <em>No answer</em>}</div>
            <details><summary>Model answer</summary><div className="qz-model"><small>Model answer</small>{String(p.model || '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div></details>
            {(p.matched?.length > 0 || p.missed?.length > 0) && (
              <div className="qz-pts">{p.matched.map(m => <span key={m} className="hit"><Check size={11} />{m}</span>)}{p.missed.map(m => <span key={m} className="miss">{m}</span>)}</div>
            )}
            <div className="qz-mk">
              <input className="inp" type="number" min="0" max={p.max} step="0.5" value={marks[key] ?? ''} onChange={e => setMarks(m => ({ ...m, [key]: e.target.value }))} aria-label={`Marks for question ${index + 1}${p.label ? ` part ${p.label}` : ''}`} />
              <span>/ {p.max}</span>
              <span className={`chip ${p.source === 'ai' ? 'c-th' : p.source === 'teacher' ? 'c-pr' : 'c-gy'}`}>{p.source === 'ai' ? 'AI suggested' : p.source === 'teacher' ? 'You' : 'Keyword match'}</span>
              <input className="inp qz-fb" value={notes[key] ?? ''} onChange={e => setNotes(n => ({ ...n, [key]: e.target.value }))} placeholder="Comment for the student (optional)" maxLength={400} />
            </div>
          </div>
        );
      })}
    </article>
  );
}
