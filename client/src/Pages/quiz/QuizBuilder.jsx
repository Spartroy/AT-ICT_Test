import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Eye, EyeOff, FileText, GripVertical, Layers, Minus, Plus, Printer, Save, Search, Send, Shuffle, Sparkles, Trash2, X
} from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import useApi from '../../hooks/useApi';
import { Empty, Ic, Loading } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import AudiencePicker, { emptyAudience } from '../teacher/modals/AudiencePicker';
import { announceChange, apiError, Fld, toLocalInput } from '../teacher/modals/form';
import { beginDrag, sortAttrs } from '../guide/sortable';
import QuestionBody from './QuestionBody';
import { openPaper } from './paperPrint';
import { DIFFICULTY, PRESETS, questionTitle, suggestedMinutes, totalMarks } from './quizLogic';
import '../../styles/quizgen.css';

const T = API_ENDPOINTS.THEORY_QUIZ.TEACHER;
const STEPS = ['Scope', 'Mix', 'Arrange', 'Publish'];
const LIST = ['qz-items'];

const specOf = (i) => ({ uid: i.uid, bankId: i.bankId, marks: Number(i.marks), presentation: i.presentation, wordbank: i.presentation === 'wordbank' ? i.wordbank : undefined });

/** Full-screen quiz generator: choose the scope, set the mix, arrange the paper, publish. */
export default function QuizBuilder({ open, onClose, quizId = null }) {
  if (!open) return null;
  return <Builder onClose={onClose} quizId={quizId} />;
}

function Builder({ onClose, quizId }) {
  const toast = useToast();
  const confirm = useConfirm();
  const meta = useApi(`${T}/meta`);
  const existing = useApi(quizId ? `${T}/quizzes/${quizId}` : null, b => b.data?.quiz);

  const [step, setStep] = useState(quizId ? 2 : 0);
  const [chapters, setChapters] = useState(() => new Set());
  const [topics, setTopics] = useState(() => new Set());
  const [counts, setCounts] = useState({});
  const [difficulty, setDifficulty] = useState('mixed');
  const [items, setItems] = useState([]);
  const [avail, setAvail] = useState(null);
  const [busy, setBusy] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [picker, setPicker] = useState(false);
  const [savedId, setSavedId] = useState(quizId);
  const [locked, setLocked] = useState(false);
  const [audience, setAudience] = useState(emptyAudience);
  const [form, setForm] = useState({ title: '', description: '', mode: 'online', durationMin: 30, opensAt: '', closesAt: '', shuffleQuestions: false, fullscreen: false, warnOnLeave: true, blockPaste: true, pledge: true, passMark: 50 });
  const [durationTouched, setDurationTouched] = useState(false);
  const bodyRef = useRef(null);

  const scope = useMemo(() => ({ chapters: [...chapters], topics: [...topics] }), [chapters, topics]);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  // Load a saved quiz for editing
  useEffect(() => {
    const q = existing.data;
    if (!q) return;
    setItems(q.items || []);
    setForm({
      title: q.title, description: q.description || '', mode: q.mode, durationMin: q.settings.durationMin,
      opensAt: toLocalInput(q.settings.opensAt), closesAt: toLocalInput(q.settings.closesAt), shuffleQuestions: !!q.settings.shuffleQuestions, fullscreen: !!q.settings.fullscreen,
      warnOnLeave: q.settings.warnOnLeave !== false, blockPaste: q.settings.blockPaste !== false, pledge: q.settings.pledge !== false, passMark: q.settings.passMark ?? 50
    });
    setDurationTouched(true);
    setChapters(new Set(q.scope?.chapters || []));
    setTopics(new Set(q.scope?.topics || []));
    const a = q.audience || { all: true };
    setAudience(a.all ? emptyAudience() : { mode: a.groups?.length ? 'groups' : 'selected', groups: new Set(a.groups || []), students: new Set((a.students || []).map(String)) });
    setLocked((q.stats?.started || 0) > 0);
  }, [existing.data]);

  // How many questions the scope offers per type
  useEffect(() => {
    if (!chapters.size && !quizId) { setAvail(null); return undefined; }
    const t = setTimeout(async () => {
      try {
        const r = await api.post(`${T}/scope`, { scope });
        setAvail(r.data);
      } catch { setAvail(null); }
    }, 220);
    return () => clearTimeout(t);
  }, [scope, chapters.size, quizId]);

  // Suggested duration follows the paper until the teacher types their own
  useEffect(() => {
    if (!durationTouched && items.length) setForm(f => ({ ...f, durationMin: suggestedMinutes(items) }));
  }, [items, durationTouched]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };
  const go = (n) => { setStep(n); scrollTop(); };

  const askClose = async () => {
    if (items.length && !savedId && !(await confirm({ title: 'Leave without saving?', body: 'This quiz has not been saved to your library yet.', confirmLabel: 'Leave' }))) return;
    onClose();
  };

  const generate = async () => {
    setBusy('generate');
    try {
      const r = await api.post(`${T}/generate`, { scope, counts, difficulty });
      setItems(r.data.items);
      setSavedId(s => s);
      if (r.data.shortages?.length) toast(`Not enough questions for ${r.data.shortages.map(s => `${s.category} (${s.got}/${s.wanted})`).join(', ')}`);
      go(2);
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy('');
    }
  };

  const move = useCallback((_, from, to) => {
    setItems(list => {
      const next = [...list];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }, []);

  const swap = async (i) => {
    const it = items[i];
    try {
      const r = await api.post(`${T}/swap`, { scope: chapters.size ? scope : { chapters: [it.chapterKey] }, category: it.category, exclude: items.map(x => x.bankId), difficulty });
      setItems(list => list.map((x, k) => (k === i ? r.data.item : x)));
    } catch (err) {
      toast(apiError(err));
    }
  };

  const addFromBank = async (bankId) => {
    try {
      const r = await api.post(`${T}/item`, { bankId });
      setItems(list => [...list, r.data.item]);
      toast('Question added to the end');
    } catch (err) {
      toast(apiError(err));
    }
  };

  const payload = () => ({
    title: form.title.trim(),
    description: form.description,
    mode: form.mode,
    items: items.map(specOf),
    scope: { chapters: [...chapters], topics: [...topics], counts, difficulty },
    settings: { durationMin: Number(form.durationMin), opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : undefined, closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined, shuffleQuestions: form.shuffleQuestions, fullscreen: form.fullscreen, warnOnLeave: form.warnOnLeave, blockPaste: form.blockPaste, pledge: form.pledge, passMark: Number(form.passMark) },
    audience: audience.mode === 'groups' ? { mode: 'groups', groups: [...audience.groups] } : audience.mode === 'selected' ? { mode: 'selected', students: [...audience.students] } : { mode: 'all' }
  });

  const problem = () => {
    if (!items.length) return 'Add at least one question';
    if (!form.title.trim()) return 'Give the quiz a title';
    if (items.some(i => !(Number(i.marks) > 0))) return 'Every question needs marks';
    if (audience.mode === 'groups' && !audience.groups.size) return 'Choose at least one group';
    if (audience.mode === 'selected' && !audience.students.size) return 'Choose at least one student';
    return '';
  };

  const save = async (publish) => {
    const p = problem();
    if (p) { if (step !== 3) go(3); return toast(p); }
    setBusy(publish ? 'publish' : 'save');
    try {
      const body = payload();
      if (locked) delete body.items;
      const r = savedId ? await api.put(`${T}/quizzes/${savedId}`, body) : await api.post(`${T}/quizzes`, body);
      const id = r.data.quiz._id;
      setSavedId(id);
      if (publish) await api.post(`${T}/quizzes/${id}/publish`, { publish: true });
      announceChange('quiz');
      toast(publish ? 'Quiz published to students' : 'Saved to your quiz library');
      if (publish) onClose();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy('');
    }
  };

  const paper = (answerKey) => {
    if (!items.length) return toast('Add questions first');
    if (!openPaper({ quiz: { title: form.title, settings: { durationMin: form.durationMin } }, items, answerKey })) toast('Allow pop-ups to open the paper');
    return undefined;
  };

  const total = totalMarks(items);

  return (
    <div className="sg-screen qz-screen" role="dialog" aria-modal="true" aria-label="Quiz generator">
      <div className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={askClose}><Ic as={X} />Close</button>
        <h2 className="sg-screen-title">{quizId ? 'Edit quiz' : 'New theory quiz'}</h2>
        <div className="sg-screen-acts">
          {items.length > 0 && <span className="sg-updated hide-sm">{items.length} questions · {total} marks</span>}
          {step >= 2 && <button type="button" className="btn o sm" onClick={() => save(false)} disabled={!!busy}><Ic as={Save} />{busy === 'save' ? 'Saving…' : 'Save draft'}</button>}
        </div>
      </div>

      <nav className="qz-steps" aria-label="Steps">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`${step === i ? 'on' : ''} ${step > i ? 'done' : ''}`} disabled={(i >= 2 && !items.length) || (i === 1 && locked)} onClick={() => go(i)} aria-current={step === i ? 'step' : undefined}>
            <b>{step > i ? <Check size={13} /> : i + 1}</b><span>{s}</span>
          </button>
        ))}
      </nav>

      <div className="sg-screen-body" ref={bodyRef}>
        <div className="sg-screen-inner qz-inner">
          {meta.loading && !meta.data && <Loading label="Loading the question bank…" />}
          {meta.error && <Empty icon={X}>Couldn’t load the question bank. {meta.error.message}</Empty>}
          {meta.data && step === 0 && <ScopeStep meta={meta.data} chapters={chapters} setChapters={setChapters} topics={topics} setTopics={setTopics} />}
          {meta.data && step === 1 && <MixStep meta={meta.data} avail={avail} counts={counts} setCounts={setCounts} difficulty={difficulty} setDifficulty={setDifficulty} />}
          {step === 2 && (
            <ArrangeStep
              items={items} setItems={setItems} form={form} set={set} locked={locked} showAnswers={showAnswers} setShowAnswers={setShowAnswers}
              move={move} swap={swap} openBank={() => setPicker(true)} regenerate={() => go(1)} loading={existing.loading && !existing.data}
            />
          )}
          {step === 3 && (
            <PublishStep form={form} set={set} setDurationTouched={setDurationTouched} audience={audience} setAudience={setAudience} items={items} savedId={savedId} paper={paper} locked={locked} />
          )}
        </div>
      </div>

      <div className="qz-foot">
        {step === 0 && (
          <>
            <span className="qz-foot-info">{chapters.size ? <><b>{chapters.size}</b> chapter{chapters.size === 1 ? '' : 's'} · <b>{avail?.questions ?? '…'}</b> questions available</> : 'Choose a phase or some chapters to begin'}</span>
            <button type="button" className="btn p" disabled={!chapters.size || !avail?.questions} onClick={() => go(1)}>Choose the mix<Ic as={ArrowRight} /></button>
          </>
        )}
        {step === 1 && (
          <>
            <button type="button" className="btn o" onClick={() => go(0)}><Ic as={ArrowLeft} />Scope</button>
            <MixSummary avail={avail} counts={counts} />
            <button type="button" className="btn p" disabled={!Object.values(counts).some(n => n > 0) || busy === 'generate'} onClick={generate}><Ic as={Sparkles} />{busy === 'generate' ? 'Generating…' : items.length ? 'Generate again' : 'Generate quiz'}</button>
          </>
        )}
        {step === 2 && (
          <>
            {!locked && <button type="button" className="btn o" onClick={() => go(1)}><Ic as={ArrowLeft} />Mix</button>}
            <span className="qz-foot-info"><b>{items.length}</b> questions · <b>{total}</b> marks · about <b>{suggestedMinutes(items)}</b> min</span>
            <button type="button" className="btn p" disabled={!items.length} onClick={() => go(3)}>Publish options<Ic as={ArrowRight} /></button>
          </>
        )}
        {step === 3 && (
          <>
            <button type="button" className="btn o" onClick={() => go(2)}><Ic as={ArrowLeft} />Arrange</button>
            <span className="qz-foot-info">{form.mode === 'paper' ? 'Paper quiz: print it, then key in the marks' : 'Students answer in their portal'}</span>
            <button type="button" className="btn o" disabled={!!busy} onClick={() => save(false)}><Ic as={Save} />Save to library</button>
            <button type="button" className="btn p" disabled={!!busy} onClick={() => save(true)}><Ic as={Send} />{busy === 'publish' ? 'Publishing…' : 'Publish'}</button>
          </>
        )}
      </div>

      {picker && <BankPicker onClose={() => setPicker(false)} onAdd={addFromBank} chosen={new Set(items.map(i => i.bankId))} />}
    </div>
  );
}

// ---- step 1: scope --------------------------------------------------------------------------------------------------

function ScopeStep({ meta, chapters, setChapters, topics, setTopics }) {
  const [open, setOpen] = useState(null);
  const byPhase = meta.phases.map(p => ({ ...p, list: meta.chapters.filter(c => c.phase === p.phase && c.total > 0) }));
  const toggleChapter = (key) => setChapters(s => {
    const n = new Set(s);
    if (n.has(key)) { n.delete(key); setTopics(t => new Set([...t].filter(x => !x.startsWith(`${key}|`)))); } else n.add(key);
    return n;
  });
  const togglePhase = (p) => {
    const keys = p.list.map(c => c.key);
    const all = keys.every(k => chapters.has(k));
    setChapters(s => { const n = new Set(s); keys.forEach(k => (all ? n.delete(k) : n.add(k))); return n; });
    if (all) setTopics(t => new Set([...t].filter(x => !keys.some(k => x.startsWith(`${k}|`)))));
  };
  const toggleTopic = (key, title) => {
    setChapters(s => new Set(s).add(key));
    setTopics(t => { const n = new Set(t); const id = `${key}|${title}`; n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  return (
    <div className="qz-step">
      <header className="qz-h"><h2>What should the quiz cover?</h2><p>Pick a whole phase, a few chapters from across the syllabus, or narrow a chapter down to the topics you taught.</p></header>
      <div className="qz-phases">
        {byPhase.map(p => {
          const on = p.list.length > 0 && p.list.every(c => chapters.has(c.key));
          const part = !on && p.list.some(c => chapters.has(c.key));
          const q = p.list.reduce((n, c) => n + c.usable, 0);
          return (
            <button key={p.phase} type="button" className={`qz-phase ${on ? 'on' : ''} ${part ? 'part' : ''}`} aria-pressed={on} onClick={() => togglePhase(p)}>
              <span className="qz-phase-n">{p.phase}</span>
              <b>{p.label}</b>
              <small>{p.list.length} chapters · {q} questions</small>
              <i className="qz-tick">{on && <Check size={14} />}</i>
            </button>
          );
        })}
      </div>
      {byPhase.map(p => (
        <section key={p.phase} className="qz-chgroup">
          <h3>{p.label}</h3>
          <div className="qz-chapters">
            {p.list.map(c => {
              const on = chapters.has(c.key);
              const picked = [...topics].filter(t => t.startsWith(`${c.key}|`));
              const isOpen = open === c.key;
              return (
                <div key={c.key} className={`qz-ch ${on ? 'on' : ''}`}>
                  <button type="button" className="qz-ch-main" aria-pressed={on} onClick={() => toggleChapter(c.key)}>
                    <i className="qz-tick">{on && <Check size={13} />}</i>
                    <span><b>{c.n === 6 ? `Ch 6 · ${c.title.replace('Networks ', '')}` : `Ch ${c.n}`}</b><em>{c.title}</em></span>
                    <small>{c.usable} q · {c.marks} marks</small>
                  </button>
                  <button type="button" className={`qz-ch-topics ${isOpen ? 'open' : ''}`} onClick={() => setOpen(isOpen ? null : c.key)} aria-expanded={isOpen}>
                    {picked.length ? `${picked.length} topic${picked.length === 1 ? '' : 's'}` : 'All topics'}<ChevronDown size={14} />
                  </button>
                  {isOpen && (
                    <div className="qz-topics">
                      {c.topics.map(t => (
                        <button key={t.title} type="button" disabled={!t.usable} className={picked.includes(`${c.key}|${t.title}`) ? 'on' : ''} onClick={() => toggleTopic(c.key, t.title)}>
                          {t.title}<small>{t.usable}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---- step 2: mix ------------------------------------------------------------------------------------------------------

function estimate(avail, counts) {
  let q = 0;
  let marks = 0;
  Object.entries(counts).forEach(([c, n]) => {
    const a = avail?.availability?.[c];
    if (!n || !a?.total) return;
    const k = Math.min(n, a.total);
    q += k;
    marks += k * (a.marks / a.total);
  });
  return { q, marks: Math.round(marks) };
}

function MixSummary({ avail, counts }) {
  const e = estimate(avail, counts);
  return <span className="qz-foot-info"><b>{e.q}</b> questions · about <b>{e.marks}</b> marks · about <b>{Math.max(5, Math.round(e.marks * 1 / 5) * 5)}</b> min</span>;
}

function MixStep({ meta, avail, counts, setCounts, difficulty, setDifficulty }) {
  const a = avail?.availability || {};
  const setCount = (id, n) => setCounts(c => ({ ...c, [id]: Math.max(0, Math.min(a[id]?.total ?? 0, n)) }));
  const row = (c) => {
    const x = a[c.id] || { total: 0, easy: 0, medium: 0, hard: 0 };
    const n = counts[c.id] || 0;
    return (
      <div key={c.id} className={`qz-mix ${n ? 'on' : ''} ${!x.total ? 'none' : ''}`}>
        <div className="qz-mix-t"><b>{c.label}</b><small>{c.hint}</small></div>
        <div className="qz-mix-a">
          {x.total ? <><span>{x.total} available</span><i className="qz-dots" title={`${x.easy} easy, ${x.medium} medium, ${x.hard} hard`}><u style={{ flex: x.easy }} className="e" /><u style={{ flex: x.medium }} className="m" /><u style={{ flex: x.hard }} className="h" /></i></> : <span>None in scope</span>}
        </div>
        <div className="qz-step-num" role="group" aria-label={`${c.label} count`}>
          <button type="button" aria-label="Fewer" disabled={!n} onClick={() => setCount(c.id, n - 1)}><Minus size={15} /></button>
          <input type="number" min="0" max={x.total} value={n} onChange={e => setCount(c.id, Number(e.target.value) || 0)} aria-label={`${c.label} count`} />
          <button type="button" aria-label="More" disabled={n >= x.total} onClick={() => setCount(c.id, n + 1)}><Plus size={15} /></button>
        </div>
      </div>
    );
  };
  return (
    <div className="qz-step">
      <header className="qz-h"><h2>Choose the question mix</h2><p>Start from a preset or set how many of each type you want. Marks come from the Classified; you can change any of them on the next step.</p></header>
      <div className="qz-presets">
        {PRESETS.map(p => <button key={p.id} type="button" onClick={() => setCounts(Object.fromEntries(Object.entries(p.counts).map(([k, v]) => [k, Math.min(v, a[k]?.total ?? v)])))}><Layers size={16} /><b>{p.label}</b><small>{p.note}</small></button>)}
        <button type="button" className="clear" onClick={() => setCounts({})}>Clear</button>
      </div>
      <div className="qz-diff" role="group" aria-label="Difficulty">
        <span>Difficulty</span>
        {[['easier', 'Easier'], ['mixed', 'Mixed'], ['harder', 'Harder']].map(([v, l]) => <button key={v} type="button" className={difficulty === v ? 'on' : ''} aria-pressed={difficulty === v} onClick={() => setDifficulty(v)}>{l}</button>)}
      </div>
      {['objective', 'written'].map(g => (
        <section key={g} className="qz-mixgroup">
          <h3>{g === 'objective' ? 'Tick, fill and match' : 'Written answers'}<small>{g === 'objective' ? 'Marked instantly' : 'Suggested marks, you confirm'}</small></h3>
          {meta.categories.filter(c => c.group === g).map(row)}
        </section>
      ))}
    </div>
  );
}

// ---- step 3: arrange ------------------------------------------------------------------------------------------------------

function ArrangeStep({ items, setItems, form, set, locked, showAnswers, setShowAnswers, move, swap, openBank, regenerate, loading }) {
  const confirm = useConfirm();
  const setMarks = (i, v) => setItems(list => list.map((x, k) => (k === i ? { ...x, marks: v === '' ? '' : Math.max(0, Math.round(Number(v) * 2) / 2) } : x)));
  const remove = async (i) => {
    if (!(await confirm({ title: 'Remove this question?', body: 'It stays in the bank; it just leaves this quiz.', confirmLabel: 'Remove' }))) return;
    setItems(list => list.filter((_, k) => k !== i));
  };
  const by = { easy: 0, medium: 0, hard: 0 };
  items.forEach(i => { by[i.difficulty] = (by[i.difficulty] || 0) + 1; });
  if (loading) return <Loading label="Loading the quiz…" />;
  return (
    <div className="qz-step">
      <header className="qz-h">
        <h2>Arrange the paper</h2>
        <p>Drag the grip to reorder. Change any mark, swap a question for another of the same type, or add one from the bank.</p>
      </header>
      <div className="qz-bar">
        <input className="inp qz-title" value={form.title} onChange={e => set({ title: e.target.value })} placeholder="Quiz title, e.g. Networks · Phase 2 test" aria-label="Quiz title" maxLength={200} />
        <div className="qz-bar-acts">
          <button type="button" className="btn o sm" onClick={() => setShowAnswers(v => !v)}><Ic as={showAnswers ? EyeOff : Eye} />{showAnswers ? 'Hide answers' : 'Show answers'}</button>
          {!locked && <button type="button" className="btn o sm" onClick={openBank}><Ic as={Plus} />Add from bank</button>}
          {!locked && <button type="button" className="btn o sm" onClick={regenerate}><Ic as={Sparkles} />Change mix</button>}
        </div>
      </div>
      {locked && <p className="qz-lock">Students have already started this quiz, so its questions are locked. You can still change its settings.</p>}
      <div className="qz-mini">
        <span><b>{items.length}</b> questions</span>
        <span><b>{totalMarks(items)}</b> marks</span>
        <span className="qz-split" title="Easy / medium / hard"><i className="e" style={{ flex: by.easy }} /><i className="m" style={{ flex: by.medium }} /><i className="h" style={{ flex: by.hard }} /></span>
        <span>{by.easy} easy · {by.medium} medium · {by.hard} hard</span>
      </div>
      {!items.length && <Empty icon={FileText}>No questions yet. Add some from the bank or change the mix.</Empty>}
      <div className="qz-sheet">
        {items.map((it, i) => (
          <article key={it.uid} className="qz-q" {...sortAttrs(LIST, i)}>
            <header>
              {!locked && <button type="button" className="qz-grip" aria-label={`Drag question ${i + 1}`} onPointerDown={e => beginDrag(e, LIST, i, move)}><GripVertical size={18} /></button>}
              <span className="qz-no">Q{i + 1}</span>
              <span className="chip c-gy">{it.presentation === 'wordbank' ? 'Word bank' : it.category}</span>
              <span className={`chip ${DIFFICULTY[it.difficulty]?.cls || 'c-gy'}`}>{DIFFICULTY[it.difficulty]?.label}</span>
              <span className="qz-topic hide-sm">{it.topic}</span>
              <label className="qz-marks"><input type="number" min="0.5" step="0.5" value={it.marks} onChange={e => setMarks(i, e.target.value)} aria-label={`Marks for question ${i + 1}`} />{it.marks === 1 ? 'mark' : 'marks'}{it.marks !== it.baseMarks && <button type="button" title="Back to the Classified mark" onClick={() => setMarks(i, it.baseMarks)}>↺ {it.baseMarks}</button>}</label>
              {!locked && <button type="button" className="ib sm" aria-label="Swap for another question" title="Swap for another question of this type" onClick={() => swap(i)}><Ic as={Shuffle} /></button>}
              {!locked && <button type="button" className="ib sm dng" aria-label="Remove question" onClick={() => remove(i)}><Ic as={Trash2} /></button>}
            </header>
            <QuestionBody item={it} showAnswer={showAnswers} />
            {it.tip && showAnswers && <p className="qz-tip"><b>Examiner tip</b> {it.tip}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

// ---- step 4: publish -------------------------------------------------------------------------------------------------------

function PublishStep({ form, set, setDurationTouched, audience, setAudience, items, savedId, paper, locked }) {
  const online = form.mode === 'online';
  return (
    <div className="qz-step qz-publish">
      <header className="qz-h"><h2>How will students take it?</h2><p>Online quizzes are marked automatically; paper quizzes are printed and you key the marks in afterwards.</p></header>
      <div className="qz-modes">
        <button type="button" disabled={locked} className={online ? 'on' : ''} aria-pressed={online} onClick={() => set({ mode: 'online' })}><b>In the portal</b><small>Students answer on the website. Ticks, drag and drop and typing. Auto-marked, with a report at the end.</small></button>
        <button type="button" disabled={locked} className={!online ? 'on' : ''} aria-pressed={!online} onClick={() => set({ mode: 'paper' })}><b>On paper / iPad</b><small>Export a PDF to print or annotate with a pencil. You enter each student’s marks in the portal.</small></button>
      </div>
      <div className="qz-export">
        <button type="button" className="btn o" onClick={() => paper(false)}><Ic as={Printer} />Student paper (PDF)</button>
        <button type="button" className="btn o" onClick={() => paper(true)}><Ic as={FileText} />Mark scheme (PDF)</button>
        <small>Opens a print-ready page. Choose “Save as PDF” in the print dialog.</small>
      </div>
      <div className="qz-grid2">
        <Fld label="Description (optional)"><textarea className="inp" rows={3} value={form.description} onChange={e => set({ description: e.target.value })} placeholder="What this quiz covers, shown to students" maxLength={1000} /></Fld>
        <div className="qz-pubcol">
          <Fld label="Time allowed (minutes)"><input className="inp" type="number" min="1" max="300" value={form.durationMin} onChange={e => { setDurationTouched(true); set({ durationMin: e.target.value }); }} /></Fld>
          <Fld label="Pass mark (%)"><input className="inp" type="number" min="0" max="100" value={form.passMark} onChange={e => set({ passMark: e.target.value })} /></Fld>
        </div>
      </div>
      <div className="qz-grid2">
        <Fld label="Opens (optional)"><input className="inp" type="datetime-local" value={form.opensAt} onChange={e => set({ opensAt: e.target.value })} /></Fld>
        <Fld label="Closes (optional)"><input className="inp" type="datetime-local" value={form.closesAt} onChange={e => set({ closesAt: e.target.value })} /></Fld>
      </div>
      <AudiencePicker value={audience} onChange={setAudience} label="Who is it for?" />
      {online && (
        <fieldset className="qz-guard">
          <legend>Integrity settings</legend>
          <p>Browsers can’t prove cheating, so these record what happened and flag it for you. Nothing is punished automatically.</p>
          {[
            ['warnOnLeave', 'Warn and record when a student leaves the quiz tab'],
            ['blockPaste', 'Block pasting into answers (and record the attempt)'],
            ['fullscreen', 'Ask students to take it full screen'],
            ['pledge', 'Ask students to accept an honesty pledge first'],
            ['shuffleQuestions', 'Shuffle the question order for each student']
          ].map(([k, l]) => (
            <label key={k} className="qz-switch"><input type="checkbox" checked={!!form[k]} onChange={e => set({ [k]: e.target.checked })} /><i /><span>{l}</span></label>
          ))}
          <p className="qz-fixed"><Check size={14} /> Always on: one attempt per student, a server-side timer, a different order of options and word banks for each student, and a similarity check across answers.</p>
        </fieldset>
      )}
      {savedId && <p className="qz-saved"><Check size={14} /> Saved in your quiz library{items.length ? ` · ${items.length} questions` : ''}</p>}
    </div>
  );
}

// ---- add from bank -------------------------------------------------------------------------------------------------------

function BankPicker({ onClose, onAdd, chosen }) {
  const [q, setQ] = useState('');
  const [chapter, setChapter] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const list = useApi(`${T}/bank?limit=30${chapter ? `&chapter=${chapter}` : ''}${debounced ? `&search=${encodeURIComponent(debounced)}` : ''}`, b => b.data);
  const meta = useApi(`${T}/meta`);
  const rows = (list.data?.questions || []).filter(x => !x.hidden);
  return (
    <Dialog open onClose={onClose} size="wide" labelledBy="qz-bank-t">
      <DialogHeader id="qz-bank-t" icon={Search} title="Add a question from the bank" sub="Pick any question and it goes to the end of the paper" onClose={onClose} />
      <div className="mbody">
        <div className="qz-pick-filter">
          <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Search the questions…" aria-label="Search" />
          <select className="inp" value={chapter} onChange={e => setChapter(e.target.value)} aria-label="Chapter">
            <option value="">All chapters</option>
            {(meta.data?.chapters || []).map(c => <option key={c.key} value={c.key}>Ch {c.n} · {c.title}</option>)}
          </select>
        </div>
        {list.loading && !list.data && <Loading />}
        <div className="qz-pick-list">
          {rows.map(r => (
            <div key={r._id} className="qz-pick-row">
              <div><b>{questionTitle(r).slice(0, 140)}</b><small>Ch {r.chapter} · {r.topic} · {r.category} · {r.marks} marks{r.needsContext && !r.imageUrl && !r.contextNote ? ' · needs a picture' : ''}</small></div>
              <button type="button" className="btn o sm" disabled={chosen.has(String(r._id))} onClick={() => onAdd(r._id)}>{chosen.has(String(r._id)) ? 'In quiz' : 'Add'}</button>
            </div>
          ))}
          {list.data && !rows.length && <Empty icon={Search}>No questions match.</Empty>}
        </div>
        <div className="mfoot"><button type="button" className="btn p" onClick={onClose}><Ic as={Clock} />Done</button></div>
      </div>
    </Dialog>
  );
}
