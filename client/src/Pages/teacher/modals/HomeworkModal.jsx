import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, GraduationCap, Monitor } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { useToast } from '../../../components/portal/PortalUI';
import { PHASES, PROGRAMS, autoTitle } from '../curriculum';
import { FormDialog, Fld, ChoiceRow, apiError, announceChange } from './form';
import StudentChecklist from './StudentChecklist';

const SCORES = [10, 20, 30, 40, 50, 100];
const empty = { section: '', phase: null, chapter: '', program: '', kind: '', number: null };

/** Create H.W: pick the lesson, set the score, assign. */
export default function HomeworkModal({ open, onClose }) {
  const toast = useToast();
  const [lesson, setLesson] = useState(empty);
  const [title, setTitle] = useState('');
  const [max, setMax] = useState(30);
  const [due, setDue] = useState('');
  const [assignTo, setAssignTo] = useState('all');
  const [chosen, setChosen] = useState(() => new Set());
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLesson(empty); setTitle(''); setMax(30); setDue(''); setAssignTo('all'); setChosen(new Set());
    setInstructions(''); setDifficulty('medium'); setErrors({});
  }, [open]);

  const auto = autoTitle(lesson);
  const phase = PHASES.find(p => p.phase === lesson.phase);
  const program = PROGRAMS.find(p => p.key === lesson.program);
  const pick = (patch) => setLesson(l => ({ ...l, ...patch }));
  const numbers = useMemo(() => Array.from({ length: program?.count || 0 }, (_, i) => i + 1), [program]);

  const submit = async () => {
    const finalTitle = title.trim() || auto;
    const next = {};
    if (!lesson.section && !finalTitle) next.lesson = 'Pick a section or type a title';
    else if (!finalTitle) next.lesson = `Pick a ${lesson.section === 'theory' ? 'chapter' : 'guide or task'} or type a title`;
    else if (finalTitle.length < 3) next.title = 'Title must be at least 3 characters';
    if (!due) next.due = 'Choose a due date';
    if (!(Number(max) >= 1)) next.max = 'Max score must be at least 1';
    if (assignTo === 'selected' && !chosen.size) next.students = 'Choose at least one student';
    setErrors(next);
    if (Object.keys(next).length) return;

    const section = lesson.section || 'theory';
    const body = {
      title: finalTitle,
      type: section === 'practical' ? 'task' : 'classified',
      section,
      dueDate: new Date(due).toISOString(),
      maxScore: Number(max),
      difficulty,
      instructions: instructions.trim() || undefined,
      assignToAll: assignTo === 'all',
      ...(assignTo === 'selected' && { selectedStudents: [...chosen] }),
      ...(lesson.section && {
        lesson: lesson.section === 'theory'
          ? { section: 'theory', phase: lesson.phase, ...(lesson.chapter && { chapter: lesson.chapter }) }
          : { section: 'practical', program: lesson.program, ...(lesson.kind && { kind: lesson.kind, number: lesson.number }) }
      })
    };
    setBusy(true);
    try {
      await api.post(API_ENDPOINTS.ASSIGNMENTS, body);
      toast(`H.W created: ${finalTitle}`);
      announceChange('assignment');
      onClose();
    } catch (err) {
      setErrors({ form: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={ClipboardCheck} title="Create H.W" sub="Pick the lesson, set the score, assign" size="wide" submitLabel="Create H.W" busy={busy} error={errors.form} onSubmit={submit}>
      <div className="hwq">
        <small>Section</small>
        <div className="seg2" role="group" aria-label="Section">
          <button type="button" className={lesson.section === 'theory' ? 'on' : ''} aria-pressed={lesson.section === 'theory'} onClick={() => setLesson({ ...empty, section: 'theory' })}>
            <GraduationCap className="i" aria-hidden="true" />Theory
          </button>
          <button type="button" className={lesson.section === 'practical' ? 'on' : ''} aria-pressed={lesson.section === 'practical'} onClick={() => setLesson({ ...empty, section: 'practical' })}>
            <Monitor className="i" aria-hidden="true" />Practical
          </button>
        </div>
      </div>

      {!lesson.section && <p className="sub" style={{ margin: '0 0 14px' }}>Pick a section to choose the lesson.</p>}
      {lesson.section === 'theory' && (
        <>
          <ChoiceRow title="Phase" options={PHASES.map(p => ({ value: p.phase, label: p.label }))} value={lesson.phase} onChange={v => pick({ phase: v, chapter: '' })} />
          {phase && <ChoiceRow title="Chapter" options={phase.chapters.map(c => ({ value: c, label: c }))} value={lesson.chapter} onChange={v => pick({ chapter: v })} />}
        </>
      )}
      {lesson.section === 'practical' && (
        <>
          <ChoiceRow title="Program" options={PROGRAMS.map(p => ({ value: p.key, label: p.label }))} value={lesson.program} onChange={v => pick({ program: v, kind: '', number: null })} />
          {program && ['guide', 'task'].map(kind => (
            <ChoiceRow
              key={kind}
              title={kind === 'guide' ? 'Guides' : 'Tasks'}
              options={numbers.map(n => ({ value: `${kind}:${n}`, label: `${kind === 'guide' ? 'Guide' : 'Task'} ${n}` }))}
              value={lesson.kind ? `${lesson.kind}:${lesson.number}` : ''}
              onChange={v => { const [k, n] = v.split(':'); pick({ kind: k, number: Number(n) }); }}
            />
          ))}
        </>
      )}
      {errors.lesson && <p className="fld-err" style={{ margin: '-6px 0 12px' }}>{errors.lesson}</p>}

      <Fld label="Title (optional — auto-filled from your selection)" error={errors.title}>
        <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder={auto || 'Title (optional)'} />
      </Fld>

      <div className="hwq">
        <small>Max score</small>
        <div className="chips" role="group" aria-label="Max score">
          {SCORES.map(v => (
            <button key={v} type="button" className={`ch ${Number(max) === v ? 'on' : ''}`} aria-pressed={Number(max) === v} onClick={() => setMax(v)}>{v}</button>
          ))}
          <input className="inp hw-custom" type="number" min="1" value={max} onChange={e => setMax(e.target.value)} aria-label="Custom max score" placeholder="Custom" />
        </div>
        {errors.max && <span className="fld-err">{errors.max}</span>}
      </div>

      <div className="r2">
        <Fld label="Due date *" error={errors.due}>
          <input className="inp" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
        </Fld>
        <Fld label="Difficulty">
          <select className="inp" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </Fld>
      </div>
      <Fld label="Assign to">
        <select className="inp" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
          <option value="all">All students</option>
          <option value="selected">Selected students</option>
        </select>
      </Fld>
      {assignTo === 'selected' && <StudentChecklist chosen={chosen} onChange={setChosen} error={errors.students} />}
      <Fld label="Instructions (optional)">
        <textarea className="inp" rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} />
      </Fld>
    </FormDialog>
  );
}
