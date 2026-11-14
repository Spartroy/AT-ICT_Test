import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Award, Check, Clock, ListChecks, Maximize, Send, ShieldCheck, Timer, X } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Ic } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import QuestionInput from './QuestionInputs';
import DisciplineOverlay, { PENALTY, levelFor } from './Discipline';
import { PledgeScroll, StartCountdown } from './QuizCeremony';
import { unlockAudio } from './quizSound';
import { formatClock, isAnswered } from './quizLogic';
import '../../styles/quizgen.css';

const S = API_ENDPOINTS.THEORY_QUIZ.STUDENT;
const studentName = () => { try { const u = JSON.parse(localStorage.getItem('user')) || {}; return [u.firstName, u.lastName].filter(Boolean).join(' '); } catch { return ''; } };

/**
 * The full-screen exam. Answers autosave to the server; the clock comes from the server; what the student does
 * around the quiz (leaving the tab, pasting, leaving full screen) is recorded as events for the teacher's report.
 * `onFinish(attemptId)` is called when the quiz is submitted, `onExit` if the student leaves before starting.
 */
export default function QuizPlayer({ quiz, onFinish, onExit }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [phase, setPhase] = useState('intro'); // intro | pledge | countdown | running
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [ruling, setRuling] = useState(null); // the reminder / card currently on screen
  const [yellows, setYellows] = useState(0);
  const [fsLost, setFsLost] = useState(false);
  const [saved, setSaved] = useState('');
  const integrity = quiz.integrity || {};

  const answersRef = useRef({});
  const dirty = useRef(false);
  const events = useRef([]);
  const offset = useRef(0);
  const startedAt = useRef(0);
  const finishing = useRef(false);
  const violations = useRef(0);
  const lastViolation = useRef(0);
  const ruled = useRef(false);
  const pledged = useRef(false);
  const submitting = useRef(null);
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
    violations.current = data.discipline?.violations || 0;
    setYellows(data.discipline?.yellows || 0);
    setSession(data);
    setLeft(new Date(data.endsAt).getTime() - now());
    setPhase('running');
  };

  // Starting: a tap (so sound and full screen are allowed), then pledge, then the 3-2-1, then the server clock starts
  const press = async () => {
    unlockAudio();
    if (integrity.fullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen is a request, not a requirement */ }
    }
    if (quiz.state === 'in_progress') { goLive(); return; }
    setPhase(integrity.pledge ? 'pledge' : 'countdown');
  };

  const goLive = async () => {
    setBusy(true);
    try {
      const r = await api.post(`${S}/quizzes/${quiz._id}/start`, { pledge: pledged.current || !integrity.pledge });
      begin(r.data);
    } catch (err) {
      if (err.status === 409 && err.body?.data?.attemptId) { finishRef.current(err.body.data.attemptId); return; }
      setPhase('intro');
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

  // An illegal action: reminder, then yellow card + pause, then yellow card + marks off, then red card
  const raise = useCallback((reason) => {
    if (finishing.current || ruled.current) return;
    const t = Date.now();
    if (t - lastViolation.current < 1500) return;
    lastViolation.current = t;
    violations.current += 1;
    const n = violations.current;
    const level = levelFor(n);
    log('violation', { q: reason, n });
    if (level !== 'reminder') log('card', { q: level });
    if (level === 'yellow1' || level === 'yellow2') setYellows(y => y + 1);
    ruled.current = true;
    setRuling({ n, level, reason });
    if (level === 'red') {
      finishing.current = true;
      const cur = sessionRef.current;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      submitting.current = api.post(`${S}/attempts/${cur.attemptId}/submit`, { answers: answersRef.current, events: events.current.splice(0), auto: true });
    } else flush();
  }, [log, flush]);

  const closeRuling = () => { ruled.current = false; setRuling(null); };
  const sentOff = async () => {
    const cur = sessionRef.current;
    try { await submitting.current; } catch { /* the server also ends it when you come back */ }
    finishRef.current(cur.attemptId);
  };

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
      if (document.hidden) { log('hidden'); flush(); } else { log('visible'); if (integrity.warnOnLeave) raise('leave'); }
    };
    const onBlur = () => { if (!document.hidden) log('blur'); };
    const onFocus = () => { if (!document.hidden) log('focus'); };
    const onFs = () => { if (!document.fullscreenElement && integrity.fullscreen && !finishing.current) { log('fs_exit'); setFsLost(true); raise('fullscreen'); } else if (document.fullscreenElement) { log('fs_enter'); setFsLost(false); } };
    const onPaste = (e) => {
      const len = (e.clipboardData?.getData('text') || '').length;
      log('paste', { len });
      if (integrity.blockPaste) { e.preventDefault(); raise('paste'); }
    };
    const onCopy = (e) => {
      log(e.type);
      const tag = document.activeElement?.tagName;
      if (integrity.warnOnLeave && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); raise('copy'); }
    };
    const onMenu = () => log('contextmenu');
    const onPrint = () => { log('print'); if (integrity.warnOnLeave) raise('print'); };
    const onOff = () => log('offline');
    const onOn = () => log('online');
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) { log('print'); if (integrity.warnOnLeave) raise('print'); }
      if (e.key === 'F12') { log('devtools'); if (integrity.warnOnLeave) { e.preventDefault(); raise('devtools'); } }
    };
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
  }, [phase, integrity.warnOnLeave, integrity.blockPaste, integrity.fullscreen, log, flush, raise]);

  const items = useMemo(() => session?.items || [], [session]);
  const done = useMemo(() => items.filter(it => isAnswered(it, answers[it.uid])).length, [items, answers]);

  const askSubmit = async () => {
    await flush();
    const missing = items.length - done;
    const ok = await confirm({ title: 'Hand in your quiz?', body: missing ? `You have ${missing} question${missing === 1 ? '' : 's'} with no answer yet. You can’t change anything after handing in.` : 'You can’t change anything after handing in.', confirmLabel: 'Hand in' });
    if (ok) submit(false);
  };

  const askExit = () => { if (phase === 'intro') onExit(); };

  if (phase !== 'running') {
    return (
      <div className="sg-screen qz-screen qz-player" role="dialog" aria-modal="true" aria-label={quiz.title}>
        <div className="sg-screen-top">
          <button type="button" className="btn o sm" onClick={askExit} disabled={phase !== 'intro'}><Ic as={X} />Back</button>
          <h2 className="sg-screen-title">{quiz.title}</h2>
          <div className="sg-screen-acts" />
        </div>
        <div className="sg-screen-body">
          <div className="sg-screen-inner qz-intro">
            <div className="card">
              <h2>{quiz.title}</h2>
              {quiz.description && <p className="qz-desc">{quiz.description}</p>}
              <div className="qz-facts">
                <div><span className="qz-fi"><ListChecks size={22} /></span><b>{quiz.questions}</b><small>questions</small></div>
                <div><span className="qz-fi"><Award size={22} /></span><b>{quiz.totalMarks}</b><small>marks</small></div>
                <div><span className="qz-fi"><Timer size={22} /></span><b>{quiz.durationMin}</b><small>minutes</small></div>
              </div>
              <ul className="qz-rules">
                <li><Clock size={16} /> The clock starts after the countdown and keeps running if you close the page.</li>
                <li><Check size={16} /> You get one attempt. Your answers save as you go.</li>
                {quiz.state === 'in_progress' && <li><AlertTriangle size={16} /> You already started this quiz, so you’ll carry on where you left off.</li>}
                {integrity.warnOnLeave && <li><ShieldCheck size={16} /> Leaving the page, copying or printing is an illegal action. The first is a warning, the second a yellow card and a 30 second pause, the third a second yellow card and {PENALTY} marks off, the fourth a red card and you are sent off.</li>}
                {integrity.blockPaste && <li><ShieldCheck size={16} /> Pasting into answers is not allowed. Type in your own words.</li>}
                {integrity.fullscreen && <li><Maximize size={16} /> The quiz will ask to go full screen. Leaving it counts as an illegal action.</li>}
                {integrity.pledge && quiz.state !== 'in_progress' && <li><ShieldCheck size={16} /> You will sign a short honesty pledge first.</li>}
              </ul>
              <button type="button" className="btn p qz-go" disabled={busy || phase !== 'intro'} onClick={press}>{busy ? 'Starting…' : quiz.state === 'in_progress' ? 'Continue the quiz' : 'Start the quiz'}</button>
            </div>
          </div>
        </div>
        {phase === 'pledge' && <PledgeScroll name={studentName()} onCancel={() => setPhase('intro')} onSigned={() => { pledged.current = true; setPhase('countdown'); }} />}
        {phase === 'countdown' && <StartCountdown onGo={goLive} />}
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
          {yellows > 0 && <span className="qz-cards-chip" title={`${yellows} yellow card${yellows === 1 ? '' : 's'}`}>{Array.from({ length: yellows }, (_, i) => <i key={i} />)}{yellows > 1 && <b>−{PENALTY}</b>}</span>}
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

      {ruling && <DisciplineOverlay key={ruling.n} event={ruling} onClose={closeRuling} onSentOff={sentOff} />}
      {fsLost && (
        <div className="qz-fsbar" role="alert">
          You left full screen. <button type="button" className="btn p sm" onClick={() => document.documentElement.requestFullscreen?.().catch(() => setFsLost(false))}><Ic as={Maximize} />Return to full screen</button>
        </div>
      )}
    </div>
  );
}
