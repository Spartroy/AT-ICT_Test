import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Library, User, Users, ChevronLeft, ClipboardCheck, Paperclip, Download, Archive, CheckCircle2, FileText } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { api, downloadFile } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Chips, Empty, ErrorNote, Ic, Loading, SearchBox, fmtDateTime, initials } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import Picker, { PickerRow } from '../../../components/portal/Picker';
import { PHASES, PROGRAMS } from '../curriculum';
import { useTeacher } from '../TeacherPortal';
import { useTeacherChange } from '../modals/form';
import { nextToGrade, lessonPickerLabel } from './submissionLogic';

const STATUS = [
  { id: 'needs', label: 'Needs grading' },
  { id: 'late', label: 'Late' },
  { id: 'graded', label: 'Graded' },
  { id: 'all', label: 'All' }
];
const LESSON_KEYS = ['section', 'phase', 'chapter', 'program'];
const fmtSize = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Work › Submissions: the homework inbox. Filters live in the URL so links can deep-link a submission. */
export default function Submissions() {
  const [params, setParams] = useSearchParams();
  const { refreshBadges } = useTeacher();
  const toast = useToast();
  const status = params.get('status') || 'needs';
  const lesson = Object.fromEntries(LESSON_KEYS.map(k => [k, params.get(k) || '']));
  const student = params.get('student') || '';
  const assignment = params.get('assignment') || '';
  const selId = params.get('sel') || '';
  const [q, setQ] = useState('');
  const [picker, setPicker] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [zipping, setZipping] = useState(false);

  const query = new URLSearchParams({ status, limit: '200', ...Object.fromEntries(Object.entries({ ...lesson, student, assignment }).filter(([, v]) => v)) }).toString();
  const list = useApi(`/api/teacher/submissions?${query}`, b => b.data || {});
  useTeacherChange('assignment', list.reload);
  const rows = useMemo(() => (list.data?.submissions || []).filter(r => !q || `${r.student.name} ${r.assignment.title}`.toLowerCase().includes(q.toLowerCase())), [list.data, q]);

  const setParam = useCallback((patch, { keepSel = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!keepSel && !('sel' in patch)) next.delete('sel');
    setParams(next, { replace: true });
  }, [params, setParams]);

  // Desktop: keep a submission selected (first row) so the pane is never empty.
  const wide = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1181px)').matches;
  useEffect(() => {
    if (!list.data || !wide) return;
    if (!selId && rows[0]) setParam({ sel: rows[0].id }, { keepSel: true });
  }, [list.data, rows, selId, wide, setParam]);

  const selected = rows.find(r => r.id === selId) || (list.data?.submissions || []).find(r => r.id === selId);
  const counts = list.data?.counts || {};

  const pickLesson = (key, value) => {
    const next = { ...lesson };
    if (key === 'section') Object.assign(next, { section: value, phase: '', chapter: '', program: '' });
    else if (key === 'phase') Object.assign(next, { phase: value, chapter: '' });
    else next[key] = value;
    setParam(next);
    if ((key === 'chapter' || key === 'program') && value) setPicker(null); // a leaf closes the picker
  };

  const toggleCheck = (id) => setChecked(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = rows.length > 0 && rows.every(r => checked.has(r.id));

  const zip = async () => {
    setZipping(true);
    try {
      const url = checked.size ? `/api/teacher/submissions/zip?ids=${encodeURIComponent([...checked].join(','))}` : `/api/teacher/submissions/zip?${query}`;
      toast(`Preparing ${checked.size || rows.length} submission${(checked.size || rows.length) === 1 ? '' : 's'} as a .zip…`);
      await downloadFile(url, `submissions-${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err) {
      toast(err.message || "Couldn't build the zip");
    } finally {
      setZipping(false);
    }
  };

  const onGraded = (row, next) => {
    list.setData(d => ({ ...d, submissions: (d?.submissions || []).map(r => (r.id === row.id ? { ...r, ...next } : r)) }));
    refreshBadges();
  };

  const goNext = (fromRow) => {
    const target = nextToGrade(list.data?.submissions || [], fromRow.id);
    if (target) setParam({ sel: target.id }, { keepSel: true });
    else {
      toast('All caught up — nothing left to grade here');
      if (status === 'needs') setParam({ sel: '' });
    }
    if (status === 'needs') list.reload();
  };

  const phase = PHASES.find(p => String(p.phase) === lesson.phase);
  const studentOptions = list.data?.students || [];

  return (
    <>
      <div className="sub-bar">
        <Chips items={STATUS.map(s => ({ ...s, count: counts[s.id] ?? 0 }))} value={status} onChange={id => setParam({ status: id })} label="Submission status" style={{ margin: 0 }} />
        <Picker icon={Library} label="Lesson" value={lessonPickerLabel(lesson)} open={picker === 'lesson'} onOpenChange={o => setPicker(o ? 'lesson' : null)}>
          <PickerRow title="Section" options={[{ value: '', label: 'All' }, { value: 'theory', label: 'Theory' }, { value: 'practical', label: 'Practical' }]} value={lesson.section} onPick={v => pickLesson('section', v)} />
          {lesson.section === 'theory' && (
            <PickerRow title="Phase" options={[{ value: '', label: 'All phases' }, ...PHASES.map(p => ({ value: String(p.phase), label: p.label }))]} value={lesson.phase} onPick={v => pickLesson('phase', v)} />
          )}
          {lesson.section === 'theory' && phase && (
            <PickerRow title="Chapter" options={[{ value: '', label: 'All chapters' }, ...phase.chapters.map(c => ({ value: c, label: c }))]} value={lesson.chapter} onPick={v => pickLesson('chapter', v)} />
          )}
          {lesson.section === 'practical' && (
            <PickerRow title="Program" options={[{ value: '', label: 'All programs' }, ...PROGRAMS.map(p => ({ value: p.key, label: p.label }))]} value={lesson.program} onPick={v => pickLesson('program', v)} />
          )}
          <div className="pkf">
            <button type="button" className="btn o sm" onClick={() => setParam({ section: '', phase: '', chapter: '', program: '' })}>Clear</button>
            <button type="button" className="btn p sm" onClick={() => setPicker(null)}>Done</button>
          </div>
        </Picker>
        <Picker icon={User} label="Student" value={student ? (studentOptions.find(s => s.id === student)?.name || 'Student') : 'All students'} open={picker === 'student'} onOpenChange={o => setPicker(o ? 'student' : null)}>
          <StudentPick options={studentOptions} value={student} onPick={id => { setParam({ student: id }); setPicker(null); }} />
        </Picker>
        {assignment && (
          <button type="button" className="ch on" onClick={() => setParam({ assignment: '' })} aria-label="Clear assignment filter">
            One assignment ✕
          </button>
        )}
      </div>

      <div className={`sub-grid ${selected ? 'open' : ''}`}>
        <div className="sub-list card">
          <div className="sl-h">
            <label className="cb">
              <input type="checkbox" checked={allChecked} onChange={() => setChecked(allChecked ? new Set() : new Set(rows.map(r => r.id)))} />
              <span />Select all
            </label>
            <button type="button" className="btn o sm" onClick={zip} disabled={zipping || !rows.length}>
              <Ic as={Archive} />{zipping ? 'Preparing…' : `Download ${checked.size ? `${checked.size} selected` : 'all'} (zip)`}
            </button>
          </div>
          <div className="sl-search"><SearchBox value={q} onChange={setQ} placeholder="Search this list…" style={{ margin: 0 }} /></div>
          <div className="sl-b" role="list" aria-label="Submissions">
            {list.loading && !list.data && <Loading label="Loading submissions…" />}
            {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
            {list.data && !rows.length && <Empty icon={CheckCircle2}>No submissions match these filters.</Empty>}
            {rows.map(r => (
              <div className={`sl-r ${r.id === selId ? 'on' : ''}`} role="listitem" key={r.id}>
                <label className="cb" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={checked.has(r.id)} onChange={() => toggleCheck(r.id)} aria-label={`Select ${r.student.name}, ${r.assignment.title}`} />
                  <span />
                </label>
                <button type="button" className="sl-open" aria-current={r.id === selId} onClick={() => setParam({ sel: r.id }, { keepSel: true })}>
                  <span className="av" aria-hidden="true">{initials(r.student.name)}</span>
                  <span className="sl-m"><b>{r.student.name}</b><small>{r.assignment.title} · {fmtDateTime(r.submittedAt)}</small></span>
                  <span className="sl-t">
                    {r.late && <span className="chip c-rd">Late</span>}
                    {r.status === 'graded' ? <span className="chip c-pr">{r.score}/{r.assignment.maxScore}</span> : <span className="chip c-am">Ungraded</span>}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="sub-pane card" aria-live="polite">
          {selected
            ? <SubmissionPane key={selected.id} row={selected} onBack={() => setParam({ sel: '' })} onGraded={onGraded} onNext={goNext} />
            : <Empty icon={ClipboardCheck}>Select a submission to download and grade it.</Empty>}
        </div>
      </div>
    </>
  );
}

function StudentPick({ options, value, onPick }) {
  const [q, setQ] = useState('');
  const shown = options.filter(o => o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Search students…" style={{ margin: '0 0 8px' }} />
      <div className="pkl" role="listbox" aria-label="Students">
        {!q && (
          <button type="button" role="option" aria-selected={!value} className={`pko ${!value ? 'on' : ''}`} onClick={() => onPick('')}>
            <Ic as={Users} />All students
          </button>
        )}
        {shown.map(o => (
          <button type="button" role="option" aria-selected={value === o.id} className={`pko ${value === o.id ? 'on' : ''}`} key={o.id} onClick={() => onPick(o.id)}>
            <span className="av" style={{ width: 30, height: 30, fontSize: '.7rem' }} aria-hidden="true">{initials(o.name)}</span>
            {o.name}<small>{o.count}</small>
          </button>
        ))}
        {!shown.length && <p className="sub" style={{ padding: 10 }}>No student found.</p>}
      </div>
    </>
  );
}

function SubmissionPane({ row, onBack, onGraded, onNext }) {
  const toast = useToast();
  const max = row.assignment.maxScore;
  const [score, setScore] = useState(row.score ?? '');
  const [feedback, setFeedback] = useState(row.feedback || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scoreRef = useRef(null);
  const pct = row.status === 'graded' && max ? Math.round((row.score / max) * 100) : null;
  const ext = (row.files[0]?.originalName || '').split('.').pop()?.toUpperCase();

  const download = (f) => downloadFile(`${API_ENDPOINTS.ASSIGNMENTS}/${row.assignmentId}/submissions/${row.studentId}/download/${encodeURIComponent(f.filename)}`, f.originalName)
    .catch(err => toast(err.message || "Couldn't download the file"));

  const save = async () => {
    const value = Number(score);
    if (score === '' || Number.isNaN(value) || value < 0 || value > max) {
      setError(`Enter a score between 0 and ${max}`);
      scoreRef.current?.focus();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/teacher/assignments/${row.assignmentId}/students/${row.studentId}`, { score: value, feedback: feedback.trim() });
      toast(`Saved ${row.student.name}: ${value}/${max}`);
      const wasNeeds = row.status === 'needs';
      onGraded(row, { status: 'graded', score: value, feedback: feedback.trim() });
      if (wasNeeds) onNext(row);
    } catch (err) {
      setError(err.message || "Couldn't save the grade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="btn o sm back-m" onClick={onBack}><Ic as={ChevronLeft} />Back</button>
      <div className="sp-h">
        <span className="av" style={{ width: 44, height: 44 }} aria-hidden="true">{initials(row.student.name)}</span>
        <div className="lmain">
          <h3 style={{ margin: 0 }}>{row.student.name}</h3>
          <p className="sub sp-chips">
            {row.assignment.title}
            <span className={`chip ${row.assignment.section === 'theory' ? 'c-th' : 'c-pr'}`}>{row.assignment.section}</span>
            <span className="chip c-gy">{row.assignment.type}</span>
          </p>
        </div>
        <div className="sp-d"><span>Submitted <b>{fmtDateTime(row.submittedAt)}</b></span>{row.late && <span className="chip c-rd">Late</span>}</div>
      </div>
      <div className="sp-body">
        <div className="prev">
          <Ic as={FileText} />
          <p>{row.files.length ? `${ext || 'File'} submission` : row.text ? 'Text submission' : 'No files attached'}</p>
          <small>{row.files.length ? 'Download the file to review it.' : row.text || ''}</small>
          {row.files[0] && <button type="button" className="btn o sm" style={{ marginTop: 10 }} onClick={() => download(row.files[0])}><Ic as={Download} />Download {row.files.length > 1 ? 'first file' : 'file'}</button>}
        </div>
        <div className="sp-side">
          <div className="files">
            {row.files.map(f => (
              <div className="file" key={f.filename}>
                <Ic as={Paperclip} />
                <span><b>{f.originalName}</b><small>{fmtSize(f.size)}</small></span>
                <button type="button" className="btn o sm" onClick={() => download(f)} aria-label={`Download ${f.originalName}`}><Ic as={Download} /></button>
              </div>
            ))}
          </div>
          <form className="grade" onSubmit={e => { e.preventDefault(); save(); }}>
            <div className="gr-h"><b>Grade</b>{pct !== null && <span className="chip c-pr">{pct}%</span>}</div>
            <div className="gr-i">
              <input ref={scoreRef} className="inp" type="number" min="0" max={max} step="1" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} aria-label={`Score out of ${max}`} aria-invalid={!!error} />
              <span className="gmax">/ {max}</span>
            </div>
            <div className="gq" role="group" aria-label="Quick scores">
              {[100, 75, 50].map(p => {
                const v = Math.round((max * p) / 100);
                return <button key={p} type="button" className="ch" onClick={() => setScore(v)} aria-label={`${p}% (${v})`}>{v}</button>;
              })}
            </div>
            <textarea className="inp" rows={3} placeholder="Feedback for the student (optional)" value={feedback} onChange={e => setFeedback(e.target.value)} aria-label="Feedback" />
            {error && <p className="fld-err" role="alert">{error}</p>}
            <div className="gr-a">
              <button type="button" className="btn o" onClick={() => onNext(row)}>Skip</button>
              <button type="submit" className="btn p" disabled={saving}><Ic as={CheckCircle2} />{saving ? 'Saving…' : row.status === 'graded' ? 'Update grade' : 'Save & next'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
