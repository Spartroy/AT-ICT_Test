import React, { useEffect, useId, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ClipboardCheck, GraduationCap, CheckCircle2, XCircle, RefreshCw, ChevronDown, Clock, Play, Upload, Paperclip, FileText, Pencil, RotateCcw, X } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, Seg, fmtDateTime } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { useStudent } from './StudentPortal';

const DONE = ['submitted', 'graded'];
const STATUS_LABEL = { assigned: 'Not submitted', in_progress: 'In progress', submitted: 'Submitted', graded: 'Graded', late: 'Late' };

/** Key/value tiles for the details panel; entries without a value are left out. */
function Facts({ items }) {
  const rows = items.filter(([, v]) => v !== undefined && v !== null && v !== '');
  return (
    <dl className="facts">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

/** Teacher-written instructions; the panel only exists when there is something to show. */
function Instructions({ text }) {
  const t = (text || '').trim();
  if (!t) return null;
  return (
    <div className="facts-note">
      <div className="lbl">Instructions</div>
      <div className="box">{t}</div>
    </div>
  );
}

const TABS = [
  { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
  { id: 'quizzes', label: 'Quizzes', icon: GraduationCap }
];

export default function Work() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, dashboard } = useStudent();
  if (!TABS.some(t => t.id === tab)) return <Navigate to={`${base}/work/assignments`} replace />;
  return (
    <>
      <PageHead title="Your work" />
      <Seg tabs={TABS} value={tab} onChange={id => navigate(`${base}/work/${id}`)} label="Work sections" slide />
      {tab === 'assignments' ? <AssignmentList onChange={dashboard.reload} /> : <QuizList onChange={dashboard.reload} />}
    </>
  );
}

function Summary({ done, pending, onRefresh, loading }) {
  return (
    <div className="card work-sum">
      <div className="sum">
        <span className="ok"><Ic as={CheckCircle2} />{done} completed</span>
        <span className="bad"><Ic as={XCircle} />{pending} pending</span>
      </div>
      <button type="button" className="btn p sm" onClick={onRefresh} disabled={loading}><Ic as={RefreshCw} />{loading ? 'Refreshing…' : 'Refresh'}</button>
    </div>
  );
}

function FilePicker({ files, onChange, label }) {
  const id = useId();
  return (
    <div className="upl">
      <label className="btn o sm" htmlFor={id}><Ic as={Paperclip} />{files.length ? 'Change files' : 'Choose files'}</label>
      <input id={id} type="file" multiple className="sr-only" aria-label={label} onChange={e => onChange([...e.target.files])} />
      {files.length > 0 && <ul className="upl-list">{files.map(f => <li key={f.name}>{f.name}</li>)}</ul>}
    </div>
  );
}

function ScoreBox({ score, max }) {
  const graded = score !== undefined && score !== null;
  return (
    <div>
      <small>Score</small>
      <b className={graded ? 'ok' : ''}>{graded ? score : '—'}/{max}</b>
      {graded && max ? <em>{Math.round((score / max) * 100)}%</em> : null}
    </div>
  );
}

const MAX_FILES = 10;
const sizeOf = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

/** A submitted (not yet graded) assignment: see the files, and swap, add or remove them until the teacher grades it. */
function SubmissionEditor({ assignment, data, onSaved }) {
  const toast = useToast();
  const id = useId();
  const current = data.submission?.attachments || [];
  const [editing, setEditing] = useState(false);
  const [keep, setKeep] = useState(() => new Set(current.map(f => f.filename)));
  const [added, setAdded] = useState([]);
  const [busy, setBusy] = useState(false);

  const begin = () => { setKeep(new Set(current.map(f => f.filename))); setAdded([]); setEditing(true); };
  const total = keep.size + added.length;
  const changed = added.length > 0 || keep.size !== current.length;
  const flip = (name) => setKeep(k => { const n = new Set(k); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const addFiles = (list) => setAdded(a => [...a, ...list.filter(f => !a.some(x => x.name === f.name && x.size === f.size))].slice(0, MAX_FILES));

  const save = async () => {
    if (!total) return toast('Keep or add at least one file');
    if (total > MAX_FILES) return toast(`You can submit up to ${MAX_FILES} files`);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('keep', JSON.stringify([...keep]));
      added.forEach(f => fd.append('files', f));
      await api.put(`${API_ENDPOINTS.STUDENT.ASSIGNMENTS}/${assignment._id}/submission`, fd);
      toast('Your submission was updated');
      setEditing(false);
      onSaved();
    } catch (err) {
      toast(err.message || "We couldn't save your changes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="box bl">
      <b><Ic as={Clock} /> Awaiting grade</b>
      <p className="sub" style={{ marginTop: 6 }}>
        Submitted {fmtDateTime(data.submissionDate)}{data.submission?.editedAt ? ` · changed ${fmtDateTime(data.submission.editedAt)}` : ''}
      </p>

      <ul className="sub-files" aria-label="Submitted files">
        {current.map(f => {
          const removed = editing && !keep.has(f.filename);
          return (
            <li key={f.filename} className={removed ? 'gone' : ''}>
              <Ic as={FileText} /><span>{f.originalName || f.filename}</span><small>{sizeOf(f.size)}</small>
              {editing && (
                <button type="button" className="ib sm" aria-label={removed ? `Keep ${f.originalName}` : `Remove ${f.originalName}`} onClick={() => flip(f.filename)}><Ic as={removed ? RotateCcw : X} /></button>
              )}
            </li>
          );
        })}
        {editing && added.map((f, i) => (
          <li key={`${f.name}-${i}`} className="new">
            <Ic as={Paperclip} /><span>{f.name}</span><small>{sizeOf(f.size)} · new</small>
            <button type="button" className="ib sm" aria-label={`Remove ${f.name}`} onClick={() => setAdded(a => a.filter((_, k) => k !== i))}><Ic as={X} /></button>
          </li>
        ))}
        {!current.length && !editing && <li><span>No files</span></li>}
      </ul>

      {editing ? (
        <div className="sub-acts">
          <label className="btn o sm" htmlFor={id}><Ic as={Paperclip} />Add files</label>
          <input id={id} type="file" multiple className="sr-only" aria-label={`Add files to ${assignment.title}`} onChange={e => { addFiles([...e.target.files]); e.target.value = ''; }} />
          <button type="button" className="btn p sm" disabled={busy || !changed || !total} onClick={save}><Ic as={Upload} />{busy ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="btn o sm" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="sub-acts"><button type="button" className="btn o sm" onClick={begin}><Ic as={Pencil} />Change files</button></div>
      )}
      {editing && <p className="sub" style={{ marginTop: 8 }}>You can change your files until your teacher grades this work.</p>}
    </div>
  );
}

function AssignmentList({ onChange }) {
  const list = useApi(API_ENDPOINTS.STUDENT.ASSIGNMENTS, b => b.data?.assignments || []);
  const [open, setOpen] = useState(() => new Set());
  const [files, setFiles] = useState({});
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  if (list.loading && !list.data) return <Loading label="Loading assignments…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];
  const done = items.filter(a => DONE.includes(a.studentData?.status)).length;

  const toggle = (id) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = async (a) => {
    const f = files[a._id] || [];
    if (!f.length) return toast('Choose at least one file to submit');
    setBusy(a._id);
    try {
      const fd = new FormData();
      f.forEach(file => fd.append('files', file));
      await api.post(`${API_ENDPOINTS.STUDENT.ASSIGNMENTS}/${a._id}/submit`, fd);
      toast(`"${a.title}" submitted`);
      setFiles(x => ({ ...x, [a._id]: [] }));
      list.reload();
      onChange?.();
    } catch (err) {
      toast(err.message || 'Submission failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Summary done={done} pending={items.length - done} onRefresh={list.reload} loading={list.loading} />
      {!items.length && <Empty icon={ClipboardCheck}>No assignments yet.</Empty>}
      {items.map(a => {
        const sd = a.studentData || {};
        const graded = sd.status === 'graded';
        const submitted = DONE.includes(sd.status);
        const overdue = !submitted && new Date(a.dueDate) < new Date();
        const isOpen = open.has(a._id);
        return (
          <div className={`row ${isOpen ? 'open' : ''}`} key={a._id}>
            <button type="button" className="hd" aria-expanded={isOpen} aria-controls={`asg-${a._id}`} onClick={() => toggle(a._id)}>
              <span className="ic"><Ic as={ClipboardCheck} /></span>
              <div>
                <h4>
                  {a.title}
                  <span className={`chip ${graded ? 'c-pr' : submitted ? 'c-th' : overdue ? 'c-rd' : 'c-gy'}`}>{overdue ? 'Overdue' : STATUS_LABEL[sd.status] || sd.status}</span>
                </h4>
                <div className="meta">
                  <span>Due <b className={overdue ? 'due' : ''}>{fmtDateTime(a.dueDate)}</b></span>
                </div>
              </div>
              <div className="sc">
                <ScoreBox score={graded ? sd.score : null} max={a.maxScore} />
                <span className="more" aria-hidden="true"><Ic as={ChevronDown} /></span>
              </div>
            </button>
            <div className="dt" id={`asg-${a._id}`}>
              <div inert={isOpen ? undefined : ''}>
                <div className="dtin">
                  <div>
                    <div className="lbl">Details</div>
                    <Facts items={[
                      ['Type', a.type],
                      ['Section', a.section],
                      ['Max score', a.maxScore],
                      ['Handed in', submitted ? `${fmtDateTime(sd.submissionDate)}${sd.isLate ? ' · late' : ''}` : '']
                    ]} />
                    <Instructions text={a.instructions || a.description} />
                  </div>
                  <div>
                    <div className="lbl">Submission</div>
                    {graded ? (
                      <div className="box gr">
                        <b><Ic as={CheckCircle2} /> Graded</b>
                        <p style={{ marginTop: 6 }}>Score: <b className="tx">{sd.score}/{a.maxScore}{a.maxScore ? ` (${Math.round((sd.score / a.maxScore) * 100)}%)` : ''}</b></p>
                        {sd.feedback && <p style={{ marginTop: 6 }}>{sd.feedback}</p>}
                      </div>
                    ) : submitted ? (
                      <SubmissionEditor assignment={a} data={sd} onSaved={() => { list.reload(); onChange?.(); }} />
                    ) : (
                      <div className="box">
                        <FilePicker files={files[a._id] || []} onChange={f => setFiles(x => ({ ...x, [a._id]: f }))} label={`Files for ${a.title}`} />
                        <button type="button" className="btn p sm" style={{ marginTop: 12 }} disabled={busy === a._id} onClick={() => submit(a)}>
                          <Ic as={Upload} />{busy === a._id ? 'Submitting…' : 'Submit'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** hh:mm:ss countdown to `end` (ms timestamp). */
function Countdown({ end }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.floor((end - now) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return <span className="chip c-am" role="timer" aria-live="off"><Ic as={Clock} /> {[h, m, s].map(n => String(n).padStart(2, '0')).join(':')}</span>;
}

function QuizList({ onChange }) {
  const list = useApi(API_ENDPOINTS.STUDENT.QUIZZES, b => b.data?.quizzes || []);
  const [open, setOpen] = useState(() => new Set());
  const [files, setFiles] = useState({});
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  if (list.loading && !list.data) return <Loading label="Loading quizzes…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];
  const done = items.filter(q => DONE.includes(q.studentData?.status)).length;
  const toggle = (id) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const start = async (q) => {
    setBusy(q._id);
    try {
      await api.post(`${API_ENDPOINTS.STUDENT.QUIZZES}/${q._id}/start`);
      toast('Quiz started. Good luck!');
      setOpen(s => new Set(s).add(q._id));
      list.reload();
    } catch (err) {
      toast(err.message || "Couldn't start the quiz");
    } finally {
      setBusy(null);
    }
  };

  const submit = async (q) => {
    const f = files[q._id] || [];
    if (!f.length) return toast('Choose your answer files first');
    setBusy(q._id);
    try {
      const fd = new FormData();
      f.forEach(file => fd.append('files', file));
      await api.post(`${API_ENDPOINTS.STUDENT.QUIZZES}/${q._id}/submit`, fd);
      toast('Quiz submitted');
      setFiles(x => ({ ...x, [q._id]: [] }));
      list.reload();
      onChange?.();
    } catch (err) {
      toast(err.message || 'Submission failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Summary done={done} pending={items.length - done} onRefresh={list.reload} loading={list.loading} />
      {!items.length && <Empty icon={GraduationCap}>No quizzes yet.</Empty>}
      {items.map(q => {
        const sd = q.studentData || {};
        const isOpen = open.has(q._id);
        const running = sd.status === 'in_progress';
        const end = running && sd.startTime ? new Date(sd.startTime).getTime() + (q.duration || 0) * 60000 : null;
        const graded = sd.status === 'graded';
        return (
          <div className={`row ${isOpen ? 'open' : ''}`} key={q._id}>
            <div className="hd" role="group" aria-label={q.title}>
              <button type="button" className="hd-toggle" aria-expanded={isOpen} aria-controls={`qz-${q._id}`} onClick={() => toggle(q._id)}>
                <span className="ic"><Ic as={GraduationCap} /></span>
                <div>
                  <h4>
                    {q.title}
                    <span className={`chip ${graded ? 'c-pr' : DONE.includes(sd.status) ? 'c-th' : running ? 'c-am' : 'c-rd'}`}>{running ? 'In progress' : sd.status === 'assigned' ? 'Not started' : STATUS_LABEL[sd.status]}</span>
                    {end && <Countdown end={end} />}
                  </h4>
                  <div className="meta">
                    <span>Date <b>{q.startDate ? new Date(q.startDate).toLocaleDateString('en-GB') : '—'}</b></span>
                    <span>Time <b>{q.startTime || '—'}</b></span>
                    <span>Duration <b>{q.duration} min</b></span>
                  </div>
                </div>
              </button>
              <div className="sc">
                <ScoreBox score={graded ? sd.score : null} max={q.maxScore} />
                {sd.status === 'assigned' && (
                  <button type="button" className="btn g sm" onClick={() => start(q)} disabled={busy === q._id}><Ic as={Play} />{busy === q._id ? 'Starting…' : 'Start quiz'}</button>
                )}
              </div>
            </div>
            <div className="dt" id={`qz-${q._id}`}>
              <div inert={isOpen ? undefined : ''}>
                <div className="dtin">
                  <div>
                    <div className="lbl">Details</div>
                    <Facts items={[['Section', q.section], ['Difficulty', q.difficulty], ['Duration', q.duration ? `${q.duration} min` : ''], ['Max score', q.maxScore]]} />
                    <Instructions text={q.instructions || q.description} />
                  </div>
                  <div>
                    <div className="lbl">Quiz status</div>
                    {graded ? (
                      <div className="box gr"><b><Ic as={CheckCircle2} /> Graded</b><p style={{ marginTop: 6 }}>Score: <b className="tx">{sd.score}/{q.maxScore}</b></p>{sd.feedback && <p style={{ marginTop: 6 }}>{sd.feedback}</p>}</div>
                    ) : DONE.includes(sd.status) ? (
                      <div className="box bl"><b><Ic as={Clock} /> Awaiting grade</b><p className="sub" style={{ marginTop: 6 }}>Submitted {fmtDateTime(sd.submissionDate)}</p></div>
                    ) : running ? (
                      <div className="box">
                        <FilePicker files={files[q._id] || []} onChange={f => setFiles(x => ({ ...x, [q._id]: f }))} label={`Answer files for ${q.title}`} />
                        <button type="button" className="btn p sm" style={{ marginTop: 12 }} disabled={busy === q._id} onClick={() => submit(q)}><Ic as={Upload} />{busy === q._id ? 'Submitting…' : 'Submit answers'}</button>
                      </div>
                    ) : (
                      <div className="box gr"><b><Ic as={CheckCircle2} /> Ready</b> — press “Start quiz” to begin</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
