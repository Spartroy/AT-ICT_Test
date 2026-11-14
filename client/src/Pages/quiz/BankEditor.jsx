import React, { useEffect, useState } from 'react';
import { EyeOff, ImagePlus, Library, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import useApi from '../../hooks/useApi';
import { Empty, ErrorNote, Ic, Loading } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { FormDialog, Fld, apiError } from '../teacher/modals/form';
import { DIFFICULTY, questionTitle } from './quizLogic';
import '../../styles/quizgen.css';

const T = API_ENDPOINTS.THEORY_QUIZ.TEACHER;
const TYPES = [
  ['written', 'Written answer (describe, explain, state…)'],
  ['tf', 'True / False table'],
  ['tick', 'Tick table (one tick per row)'],
  ['fill', 'Complete / name (short answers)'],
  ['pick', 'Tick N from a list'],
  ['match', 'Match / connect'],
  ['multi', 'Structured (a)(b)(c)']
];
const WRITTEN = [['define', 'Define'], ['state', 'State / give / list'], ['describe', 'Describe'], ['explain', 'Explain'], ['compare', 'Compare'], ['advdis', 'Advantages & disadvantages'], ['discuss', 'Discuss / evaluate']];
const lines = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const commas = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

/** The question bank: browse, search, edit, hide, retag, add your own, attach a picture to the ones that need one. */
export default function BankEditor({ onClose }) {
  const toast = useToast();
  const confirm = useConfirm();
  const meta = useApi(`${T}/meta`);
  const [f, setF] = useState({ chapter: '', topic: '', category: '', difficulty: '', show: 'all', search: '' });
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState('');
  const [edit, setEdit] = useState(null); // question | 'new'
  useEffect(() => { const t = setTimeout(() => { setF(x => ({ ...x, search: term })); setPage(1); }, 250); return () => clearTimeout(t); }, [term]);
  const qs = new URLSearchParams({ page, limit: 30, show: f.show, ...Object.fromEntries(Object.entries({ chapter: f.chapter, topic: f.topic, category: f.category, difficulty: f.difficulty, search: f.search }).filter(([, v]) => v)) });
  const list = useApi(`${T}/bank?${qs}`, b => b.data);
  const chapter = meta.data?.chapters.find(c => c.key === f.chapter);
  const set = (patch) => { setF(x => ({ ...x, ...patch })); setPage(1); };

  const remove = async (q) => {
    const mine = q.source === 'teacher';
    if (!(await confirm({ title: mine ? 'Delete your question?' : 'Hide this question?', body: mine ? 'It is removed from the bank. Quizzes that already use it keep their copy.' : 'It stays in the Classified but is left out of new quizzes. Show hidden ones to bring it back.', confirmLabel: mine ? 'Delete' : 'Hide' }))) return;
    try { await api.del(`${T}/bank/${q._id}`); toast(mine ? 'Question deleted' : 'Question hidden'); list.reload(); } catch (err) { toast(apiError(err)); }
  };
  const unhide = async (q) => {
    try { await api.put(`${T}/bank/${q._id}`, { ...q, hidden: false }); list.reload(); } catch (err) { toast(apiError(err)); }
  };

  return (
    <div className="sg-screen qz-screen" role="dialog" aria-modal="true" aria-label="Question bank">
      <div className="sg-screen-top">
        <button type="button" className="btn o sm" onClick={onClose}><Ic as={X} />Close</button>
        <h2 className="sg-screen-title">Question bank</h2>
        <div className="sg-screen-acts"><button type="button" className="btn p sm" onClick={() => setEdit('new')}><Ic as={Plus} />New question</button></div>
      </div>
      <div className="sg-screen-body">
        <div className="sg-screen-inner qz-inner">
          <div className="qz-bankbar">
            <label className="qz-search"><Search size={16} /><input className="inp" value={term} onChange={e => setTerm(e.target.value)} placeholder="Search questions and answers…" aria-label="Search" /></label>
            <select className="inp" value={f.chapter} onChange={e => set({ chapter: e.target.value, topic: '' })} aria-label="Chapter"><option value="">All chapters</option>{(meta.data?.chapters || []).map(c => <option key={c.key} value={c.key}>Ch {c.n} · {c.title}</option>)}</select>
            <select className="inp" value={f.topic} disabled={!chapter} onChange={e => set({ topic: e.target.value })} aria-label="Topic"><option value="">All topics</option>{(chapter?.topics || []).map(t => <option key={t.title} value={t.title}>{t.title}</option>)}</select>
            <select className="inp" value={f.category} onChange={e => set({ category: e.target.value })} aria-label="Type"><option value="">All types</option>{(meta.data?.categories || []).filter(c => c.id !== 'wordbank').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            <select className="inp" value={f.difficulty} onChange={e => set({ difficulty: e.target.value })} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
            <select className="inp" value={f.show} onChange={e => set({ show: e.target.value })} aria-label="Show"><option value="all">All questions</option><option value="issues">Need attention</option><option value="hidden">Hidden</option><option value="mine">Added by me</option></select>
          </div>
          {list.loading && !list.data && <Loading label="Loading questions…" />}
          {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
          {list.data && (
            <>
              <p className="qz-count">{list.data.total} question{list.data.total === 1 ? '' : 's'}</p>
              {!list.data.questions.length && <Empty icon={Library}>Nothing matches these filters.</Empty>}
              <div className="card qz-table"><div className="tbl" role="list">
                {list.data.questions.map(q => {
                  const need = q.needsContext && !q.imageUrl && !q.contextNote;
                  return (
                    <div className="trow qz-brow" role="listitem" key={q._id}>
                      <button type="button" className="trow-open" onClick={() => setEdit(q)}>
                        <span className="lmain"><b>{questionTitle(q).slice(0, 170)}</b><small>Ch {q.chapter} · {q.topic} · {q.source === 'teacher' ? 'Added by you' : q.qNo}{q.edited && q.source !== 'teacher' ? ' · edited' : ''}</small></span>
                        <span className="tchips">
                          <span className="chip c-gy">{q.category}</span>
                          <span className={`chip ${DIFFICULTY[q.difficulty]?.cls}`}>{DIFFICULTY[q.difficulty]?.label}</span>
                          <span className="chip c-th">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
                          {q.hidden && <span className="chip c-gy"><EyeOff size={11} /> hidden</span>}
                          {need && <span className="chip c-am">needs picture</span>}
                          {q.dupOf && <span className="chip c-am">duplicate</span>}
                        </span>
                      </button>
                      {q.hidden ? <button type="button" className="btn o sm" onClick={() => unhide(q)}>Show</button> : <button type="button" className="ib sm dng" aria-label="Hide or delete" onClick={() => remove(q)}><Ic as={Trash2} /></button>}
                    </div>
                  );
                })}
              </div></div>
              {list.data.pages > 1 && (
                <div className="qz-pager">
                  <button type="button" className="btn o sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                  <span>Page {page} of {list.data.pages}</span>
                  <button type="button" className="btn o sm" disabled={page >= list.data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {edit && meta.data && <QuestionEditor question={edit === 'new' ? null : edit} meta={meta.data} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} />}
    </div>
  );
}

const blank = () => ({ type: 'written', chapterKey: '', topic: '', difficulty: '', marks: 2, lead: '', context: '', contextNote: '', imageUrl: '', tip: '', hidden: false, command: 'state', model: '', points: '', items: [{ text: '', answer: true, answers: '' }], columns: '', options: '', pickAnswers: [], wordbank: '', parts: [{ label: 'a', text: '', marks: 2, model: '', points: '' }, { label: 'b', text: '', marks: 2, model: '', points: '' }] });

function toForm(q) {
  const d = { ...blank(), ...q, tip: q.tip || '', context: q.context || '', contextNote: q.contextNote || '', imageUrl: q.imageUrl || '', difficulty: q.difficulty };
  d.points = (q.points || []).join('\n');
  d.columns = (q.columns || []).join(', ');
  d.options = (q.options || []).join('\n');
  d.pickAnswers = q.answers || [];
  d.wordbank = (q.wordbank || []).join(', ');
  d.items = (q.items || []).map(i => ({ text: i.text, answer: i.answer, answers: (i.answers || []).join(', ') }));
  if (!d.items.length) d.items = [{ text: '', answer: true, answers: '' }];
  d.parts = (q.parts || blank().parts).map(p => ({ ...p, points: (p.points || []).join('\n') }));
  return d;
}

function fromForm(d) {
  const base = { type: d.type, chapterKey: d.chapterKey, topic: d.topic, difficulty: d.difficulty || undefined, marks: Number(d.marks), lead: d.lead, context: d.context, contextNote: d.contextNote, imageUrl: d.imageUrl, tip: d.tip, hidden: d.hidden, model: d.model, points: lines(d.points) };
  if (d.type === 'tf') base.items = d.items.map(i => ({ text: i.text, answer: !!i.answer }));
  if (d.type === 'tick') { base.columns = commas(d.columns); base.items = d.items.map(i => ({ text: i.text, answer: i.answer })); }
  if (d.type === 'fill') { base.items = d.items.map(i => ({ text: i.text, answers: commas(i.answers) })); base.wordbank = commas(d.wordbank); }
  if (d.type === 'pick') { base.options = lines(d.options); base.answers = d.pickAnswers; }
  if (d.type === 'match') base.items = d.items.map(i => ({ text: i.text, answer: i.answer }));
  if (d.type === 'written') base.command = d.command;
  if (d.type === 'multi') base.parts = d.parts.map(p => ({ label: p.label, text: p.text, marks: Number(p.marks), model: p.model, points: lines(p.points) }));
  return base;
}

function QuestionEditor({ question, meta, onClose, onSaved }) {
  const toast = useToast();
  const [d, setD] = useState(() => (question ? toForm(question) : { ...blank(), chapterKey: meta.chapters[0]?.key || '' }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setD(x => ({ ...x, ...patch }));
  const chapter = meta.chapters.find(c => c.key === d.chapterKey);
  const topics = chapter?.topics.map(t => t.title) || [];
  const editing = !!question;
  const rowSet = (i, patch) => set({ items: d.items.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const addRow = () => set({ items: [...d.items, { text: '', answer: d.type === 'tf' ? true : d.type === 'tick' ? commas(d.columns)[0] || '' : '', answers: '' }] });
  const delRow = (i) => set({ items: d.items.filter((_, k) => k !== i) });
  const partSet = (i, patch) => set({ parts: d.parts.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const optionList = lines(d.options);
  const partsTotal = d.parts.reduce((n, p) => n + (Number(p.marks) || 0), 0);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const body = fromForm(d);
      if (editing) await api.put(`${T}/bank/${question._id}`, body); else await api.post(`${T}/bank`, body);
      toast(editing ? 'Question saved' : 'Question added to the bank');
      onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (d.chapterKey && !topics.includes(d.topic) && !editing) set({ topic: topics[0] || '' }); }, [d.chapterKey]);

  return (
    <FormDialog open onClose={onClose} size="wide" icon={Pencil} title={editing ? 'Edit question' : 'New question'} sub={editing ? `${question.source === 'teacher' ? 'Added by you' : `Classified ${question.qNo}, chapter ${question.chapter}`}` : 'Added to the bank for any quiz'} submitLabel={editing ? 'Save question' : 'Add to bank'} busy={busy} error={error} onSubmit={submit}>
      <div className="qz-ed">
        {!editing && <Fld label="Type"><select className="inp" value={d.type} onChange={e => set({ type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Fld>}
        <div className="qz-ed-row">
          <Fld label="Chapter"><select className="inp" value={d.chapterKey} onChange={e => set({ chapterKey: e.target.value })}>{meta.chapters.map(c => <option key={c.key} value={c.key}>Ch {c.n} · {c.title}</option>)}</select></Fld>
          <Fld label="Topic"><select className="inp" value={d.topic} onChange={e => set({ topic: e.target.value })}>{[...new Set([d.topic, ...topics].filter(Boolean))].map(t => <option key={t} value={t}>{t}</option>)}</select></Fld>
          <Fld label="Difficulty"><select className="inp" value={d.difficulty} onChange={e => set({ difficulty: e.target.value })}><option value="">Automatic</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></Fld>
          <Fld label={d.type === 'multi' ? 'Marks (from parts)' : 'Marks'}><input className="inp" type="number" min="1" max="30" step="0.5" value={d.type === 'multi' ? partsTotal : d.marks} disabled={d.type === 'multi'} onChange={e => set({ marks: e.target.value })} /></Fld>
        </div>

        {d.type !== 'multi' && <Fld label={d.type === 'written' ? 'Question' : 'Instruction / question'}><textarea className="inp" rows={2} value={d.lead} onChange={e => set({ lead: e.target.value })} placeholder={d.type === 'tf' ? 'Tick true or false:' : d.type === 'fill' ? 'Complete the sentences:' : 'Write the question'} /></Fld>}
        {d.type === 'multi' && <Fld label="Scenario (optional)"><textarea className="inp" rows={2} value={d.context} onChange={e => set({ context: e.target.value })} placeholder="Shared text that introduces the parts" /></Fld>}

        {d.type === 'tf' && <RowEditor title="Statements" rows={d.items} add={addRow} del={delRow} render={(r, i) => (
          <>
            <input className="inp" value={r.text} onChange={e => rowSet(i, { text: e.target.value })} placeholder="A statement" aria-label="Statement" />
            <select className="inp qz-narrow" value={r.answer ? 'true' : 'false'} onChange={e => rowSet(i, { answer: e.target.value === 'true' })} aria-label="Correct answer"><option value="true">True</option><option value="false">False</option></select>
          </>
        )} />}
        {d.type === 'tick' && (
          <>
            <Fld label="Columns (comma separated)"><input className="inp" value={d.columns} onChange={e => set({ columns: e.target.value })} placeholder="Input, Output, Backing storage" /></Fld>
            <RowEditor title="Rows" rows={d.items} add={addRow} del={delRow} render={(r, i) => (
              <>
                <input className="inp" value={r.text} onChange={e => rowSet(i, { text: e.target.value })} placeholder="Row" aria-label="Row" />
                <select className="inp qz-narrow" value={r.answer} onChange={e => rowSet(i, { answer: e.target.value })} aria-label="Correct column"><option value="">Column…</option>{commas(d.columns).map(c => <option key={c} value={c}>{c}</option>)}</select>
              </>
            )} />
          </>
        )}
        {d.type === 'fill' && (
          <>
            <RowEditor title="Items (use … where the gap goes)" rows={d.items} add={addRow} del={delRow} render={(r, i) => (
              <>
                <input className="inp" value={r.text} onChange={e => rowSet(i, { text: e.target.value })} placeholder="The physical parts of a computer are called …" aria-label="Sentence" />
                <input className="inp qz-narrow" value={r.answers} onChange={e => rowSet(i, { answers: e.target.value })} placeholder="answer, other wording" aria-label="Accepted answers" />
              </>
            )} />
            <Fld label="Word bank (optional, comma separated)"><input className="inp" value={d.wordbank} onChange={e => set({ wordbank: e.target.value })} placeholder="Leave empty to let the generator build one" /></Fld>
          </>
        )}
        {d.type === 'pick' && (
          <>
            <Fld label="Options (one per line)"><textarea className="inp" rows={5} value={d.options} onChange={e => set({ options: e.target.value, pickAnswers: d.pickAnswers.filter(a => lines(e.target.value).includes(a)) })} /></Fld>
            <div className="qz-checks"><small>Correct options</small>{optionList.map(o => <label key={o}><input type="checkbox" checked={d.pickAnswers.includes(o)} onChange={e => set({ pickAnswers: e.target.checked ? [...d.pickAnswers, o] : d.pickAnswers.filter(a => a !== o) })} />{o}</label>)}</div>
          </>
        )}
        {d.type === 'match' && <RowEditor title="Pairs (statement → term)" rows={d.items} add={addRow} del={delRow} render={(r, i) => (
          <>
            <input className="inp" value={r.text} onChange={e => rowSet(i, { text: e.target.value })} placeholder="Statement" aria-label="Statement" />
            <input className="inp qz-narrow" value={r.answer || ''} onChange={e => rowSet(i, { answer: e.target.value })} placeholder="Term" aria-label="Term" />
          </>
        )} />}
        {d.type === 'written' && (
          <>
            <Fld label="Command word"><select className="inp" value={d.command} onChange={e => set({ command: e.target.value })}>{WRITTEN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Fld>
            <Fld label="Model answer (separate each point with ; or a new line)"><textarea className="inp" rows={4} value={d.model} onChange={e => set({ model: e.target.value })} /></Fld>
            <Fld label="Mark-scheme points (one per line, optional)"><textarea className="inp" rows={3} value={d.points} onChange={e => set({ points: e.target.value })} /></Fld>
          </>
        )}
        {d.type === 'multi' && (
          <div className="qz-parts">
            <small>Parts</small>
            {d.parts.map((p, i) => (
              <div key={i} className="qz-partcard">
                <div className="qz-ed-row"><Fld label="Part"><input className="inp" value={p.label} maxLength={4} onChange={e => partSet(i, { label: e.target.value })} /></Fld><Fld label="Marks"><input className="inp" type="number" min="1" max="20" value={p.marks} onChange={e => partSet(i, { marks: e.target.value })} /></Fld>
                  <button type="button" className="ib sm dng" aria-label="Remove part" disabled={d.parts.length <= 2} onClick={() => set({ parts: d.parts.filter((_, k) => k !== i) })}><Ic as={Trash2} /></button></div>
                <Fld label="Question"><textarea className="inp" rows={2} value={p.text} onChange={e => partSet(i, { text: e.target.value })} /></Fld>
                <Fld label="Model answer"><textarea className="inp" rows={3} value={p.model} onChange={e => partSet(i, { model: e.target.value })} /></Fld>
              </div>
            ))}
            <button type="button" className="btn o sm" onClick={() => set({ parts: [...d.parts, { label: String.fromCharCode(97 + d.parts.length), text: '', marks: 2, model: '', points: '' }] })}><Ic as={Plus} />Add a part</button>
          </div>
        )}

        <details className="qz-more" open={!!(question?.needsContext || d.imageUrl || d.contextNote)}>
          <summary><ImagePlus size={14} /> Picture or missing scenario{question?.needsContext && !d.imageUrl && !d.contextNote ? ' — this question needs one before it can be used' : ''}</summary>
          <Fld label="Picture link (https://…)"><input className="inp" value={d.imageUrl} onChange={e => set({ imageUrl: e.target.value })} placeholder="https://…/screenshot.png" /></Fld>
          <Fld label="Or describe the scenario in words"><textarea className="inp" rows={2} value={d.contextNote} onChange={e => set({ contextNote: e.target.value })} /></Fld>
        </details>
        <Fld label="Examiner tip (optional)"><input className="inp" value={d.tip} onChange={e => set({ tip: e.target.value })} /></Fld>
        <label className="qz-switch"><input type="checkbox" checked={d.hidden} onChange={e => set({ hidden: e.target.checked })} /><i /><span>Hide from new quizzes</span></label>
      </div>
    </FormDialog>
  );
}

function RowEditor({ title, rows, add, del, render }) {
  return (
    <div className="qz-rowed">
      <small>{title}</small>
      {rows.map((r, i) => (
        <div key={i} className="qz-rowed-r">{render(r, i)}<button type="button" className="ib sm dng" aria-label="Remove row" disabled={rows.length <= 1} onClick={() => del(i)}><Ic as={Trash2} /></button></div>
      ))}
      <button type="button" className="btn o sm" onClick={add}><Ic as={Plus} />Add row</button>
    </div>
  );
}
