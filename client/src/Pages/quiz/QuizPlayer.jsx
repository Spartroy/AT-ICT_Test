import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Clock, Maximize, Send, ShieldCheck, X } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Ic } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import QuestionInput from './QuestionInputs';
import { formatClock, isAnswered } from './quizLogic';
import '../../styles/quizgen.css';

const S = API_ENDPOINTS.THEORY_QUIZ.STUDENT;

/**
 * The full-screen exam. Answers autosave to the server; the clock comes from the server; what the student does
 * around the quiz (leaving the tab, pasting, leaving full screen) is recorded as events for the teacher's report.
 * `onFinish(attemptId)` is called when the quiz is submitted, `onExit` if the student leaves before starting.
 */
export default function QuizPlayer({ quiz, onFinish, onExit }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [phase, setPhase] = useState('intro'); // intro | running
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [pledge, setPledge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [warn, setWarn] = useState(0); // number of leaves shown in the "you left" notice
  const [fsLost, setFsLost] = useState(false);
  const [saved, setSaved] = useState('');
  const integrity = quiz.integrity || {};

  const answersRef = useRef({});
  const dirty = useRef(false);
  const events = useRef([]);
  const offset = useRef(0);
  const startedAt = useRef(0);
  const finishing = useRef(false);
  const leaves = useRef(0);
  const sessionRef = useRef(null);
  sessionRef.current = session;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const now = () => Date.now() + offset.current;
  const log = useCallback((type, extra = {}) => {
    if (!startedAt.current) return;
    events.current.push({ t: Math.max(0, now() - startedAt.current), type, ...extra });
  }, []);

  const begin = (data) => {
    offset.current = new Date(data.serverNow).getTime() - Date.now();
    startedAt.current = new Date(data.startedAt).getTime();
    answersRef.current = data.answers || {};
    setAnswers(answersRef.current);
    setSession(data);
    setLeft(new Date(data.endsAt).getTime() - now());
    setPhase('running');
  };

  const start = async () => {
    setBusy(true);
    try {
      if (integrity.fullscreen && document.documentElement.requestFullscreen) {
        try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen is a request, not a requirement */ }
      }
      const r = await api.post(`${S}/quizzes/${quiz._id}/start`, { pledge });
      begin(r.data);
    } catch (err) {
      if (err.status === 409 && err.body?.data?.attemptId) { finishRef.current(err.body.data.attemptId); return; }
      toast(err.message || "Couldn't start the quiz");
    } finally {
      setBusy(false);
    }
  };

  const flush = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || finishing.current) return;
    if (!dirty.current && !events.current.length) return;
    const sendEvents = events.current.splice(0);
    const sendAnswers = answersRef.current;
    dirty.current = false;
    try {
      const r = await api.put(`${S}/attempts/${s.attemptId}/save`, { answers: sendAnswers, events: sendEvents });
      if (r.data?.finished) { finishing.current = true; finishRef.current(s.attemptId); return; }
      setSaved(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      events.current.unshift(...sendEvents);
      dirty.current = true;
    }
  }, []);

  const submit = useCallback(async (auto = false) => {
    const s = sessionRef.current;
    if (!s || finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      await api.post(`${S}/attempts/${s.attemptId}/submit`, { answers: answersRef.current, events: events.current.splice(0), auto });
      finishRef.current(s.attemptId);
    } catch (err) {
      finishing.current = false;
      setBusy(false);
      toast(err.message || "Couldn't submit. Check your connection and try again.");
    }
  }, [toast]);

  const change = (uid, v) => {
    answersRef.current = { ...answersRef.current, [uid]: v };
    dirty.current = true;
    setAnswers(answersRef.current);
  };

  // Clock + autosave
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const clock = setInterval(() => {
      const ms = new Date(sessionRef.current.endsAt).getTime() - now();
      setLeft(ms);
      if (ms <= 0) { clearInterval(clock); submit(true); }
    }, 500);
    const save = setInterval(flush, 10000);
    return () => { clearInterval(clock); clearInterval(save); };
  }, [phase, flush, submit]);

  // What the student does around the quiz
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const onVis = () => {
      if (document.hidden) { log('hidden'); leaves.current += 1; flush(); } else { log('visible'); if (integrity.warnOnLeave) setWarn(leaves.current); }
    };
    const onBlur = () => { if (!document.hidden) log('blur'); };
    const onFocus = () => { if (!document.hidden) log('focus'); };
    const onFs = () => { if (!document.fullscreenElement && integrity.fullscreen && !finishing.current) { log('fs_exit'); setFsLost(true); } else if (document.fullscreenElement) { log('fs_enter'); setFsLost(false); } };
    const onPaste = (e) => {
      const len = (e.clipboardData?.getData('text') || '').length;
      log('paste', { len });
      if (integrity.blockPaste) { e.preventDefault(); toast('Pasting is turned off for this quiz. Type your answer.'); }
    };
    const onCopy = (e) => log(e.type);
    const onMenu = () => log('contextmenu');
    const onPrint = () => log('print');
    const onOff = () => log('offline');
    const onOn = () => log('online');
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) log('print'); if (e.key === 'F12') log('devtools'); };
    const onUnload = (e) => { if (!finishing.current) { e.preventDefault(); e.returnValue = ''; } };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('contextmenu', onMenu);
    window.addEventListener('beforeprint', onPrint);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('contextmenu', onMenu);
      window.removeEventListener('beforeprint', onPrint);
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [phase, integrity.warnOnLeave, integrity.blockPaste, integrity.fullscreen, log, flush, toast]);

  const items = useMemo(() => session?.items || [], [session]);
  const done = useMemo(() => items.filter(it => isAnswered(it, answers[it.uid])).length, [items, answers]);

  const askSubmit = async () => {
    await flush();
    const missing = items.length - done;
    const ok = await confirm({ title: 'Hand in your quiz?', body: missing ? `You have ${missing} question${missing === 1 ? '' : 's'} with no answer yet. You can’t change anything after handing in.` : 'You can’t change anything after handing in.', confirmLabel: 'Hand in' });
    if (ok) submit(false);
  };

  const askExit = () => { if (phase === 'intro') onExit(); };

  if (phase === 'intro') {
    return (
      <div className="sg-screen qz-screen qz-player" role="dialog" aria-modal="true" aria-label={quiz.title}>
        <div className="sg-screen-top">
          <button type="button" className="btn o sm" onClick={askExit}><Ic as={X} />Back</button>
          <h2 className="sg-screen-title">{quiz.title}</h2>
          <div className="sg-screen-acts" />
        </div>
        <div className="sg-screen-body">
          <div className="sg-screen-inner qz-intro">
            <div className="card">
              <h2>{quiz.title}</h2>
              {quiz.description && <p className="qz-desc">{quiz.description}</p>}
              <div className="qz-facts">
                <div><b>{quiz.questions}</b><small>questions</small></div>
                <div><b>{quiz.totalMarks}</b><small>marks</small></div>
                <div><b>{quiz.durationMin}</b><small>minutes</small></div>
              </div>
              <ul className="qz-rules">
                <li><Clock size={16} /> The clock starts when you press Start and keeps running if you close the page.</li>
                <li><Check size={16} /> You get one attempt. Your answers save as you go.</li>
                {quiz.state === 'in_progress' && <li><AlertTriangle size={16} /> You already started this quiz, so you’ll carry on where you left off.</li>}
                {integrity.warnOnLeave && <li><ShieldCheck size={16} /> Leaving this tab or window is recorded and your teacher can see it.</li>}
                {integrity.blockPaste && <li><ShieldCheck size={16} /> Pasting into answers is turned off. Type in your own words.</li>}
                {integrity.fullscreen && <li><Maximize size={16} /> The quiz will ask to go full screen.</li>}
              </ul>
              {integrity.pledge && quiz.state !== 'in_progress' && (
                <label className="qz-pledge"><input type="checkbox" checked={pledge} onChange={e => setPledge(e.target.checked)} /><span>I promise to do this quiz on my own, without notes, other people or other websites, unless my teacher says otherwise.</span></label>
              )}
              <button type="button" className="btn p qz-go" disabled={busy || (integrity.pledge && quiz.state !== 'in_progress' && !pledge)} onClick={start}>{busy ? 'Starting…' : quiz.state === 'in_progress' ? 'Continue the quiz' : 'Start the quiz'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const low = left < 300000;
  return (
    <div className="sg-screen qz-screen qz-player" role="dialog" aria-modal="true" aria-label={quiz.title}>
      <div className="sg-screen-top qz-ptop">
        <div className={`qz-clock ${low ? 'low' : ''}`} role="timer" aria-label="Time left"><Ic as={Clock} />{formatClock(left)}</div>
        <h2 className="sg-screen-title">{quiz.title}</h2>
        <div className="sg-screen-acts">
          <span className="sg-updated hide-sm">{saved ? `Saved ${saved}` : 'Autosaves'}</span>
          <button type="button" className="btn p sm" disabled={busy} onClick={askSubmit}><Ic as={Send} />Hand in</button>
        </div>
      </div>
      <div className="qz-prog" aria-hidden="true"><i style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} /></div>
      <div className="sg-screen-body">
        <div className="sg-screen-inner qz-play">
          <nav className="qz-rail" aria-label="Questions">
            <p>{done}/{items.length} answered</p>
            <div>{items.map((it, i) => <a key={it.uid} href={`#qz-${it.uid}`} className={isAnswered(it, answers[it.uid]) ? 'on' : ''} onClick={e => { e.preventDefault(); document.getElementById(`qz-${it.uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{i + 1}</a>)}</div>
          </nav>
          <div className="qz-sheet qz-live">
            {items.map((it, i) => (
              <article key={it.uid} id={`qz-${it.uid}`} className="qz-q">
                <header><span className="qz-no">Q{i + 1}</span><span className="qz-m">{it.marks} {it.marks === 1 ? 'mark' : 'marks'}</span></header>
                <QuestionInput item={it} index={i} value={answers[it.uid]} onChange={v => change(it.uid, v)} />
              </article>
            ))}
            <div className="qz-end"><button type="button" className="btn p" disabled={busy} onClick={askSubmit}><Ic as={Send} />Hand in my quiz</button></div>
          </div>
        </div>
      </div>

      {warn > 0 && (
        <Dialog open onClose={() => setWarn(0)} size="sm" labelledBy="qz-warn-t">
          <DialogHeader id="qz-warn-t" icon={AlertTriangle} title="You left the quiz" sub="This was recorded" onClose={() => setWarn(0)} />
          <div className="mbody">
            <p>Your teacher can see that you left this page {warn} time{warn === 1 ? '' : 's'}. Please stay on the quiz until you hand in.</p>
            <div className="mfoot"><button type="button" className="btn p" onClick={() => setWarn(0)}>Back to the quiz</button></div>
          </div>
        </Dialog>
      )}
      {fsLost && (
        <div className="qz-fsbar" role="alert">
          You left full screen. <button type="button" className="btn p sm" onClick={() => document.documentElement.requestFullscreen?.().catch(() => setFsLost(false))}><Ic as={Maximize} />Return to full screen</button>
        </div>
      )}
    </div>
  );
}
