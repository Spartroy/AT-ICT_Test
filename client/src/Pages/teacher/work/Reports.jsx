import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Copy, Eye, FileBarChart, GraduationCap, Plus, RefreshCw, Send, Sparkles, Star, Trash2, Wand2 } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { Chips, Empty, ErrorNote, Ic, Loading, Seg, initials } from '../../../components/portal/kit';
import { useConfirm, useToast } from '../../../components/portal/PortalUI';
import ReportCard from '../../../components/reports/ReportCard';
import {
  DEFAULT_ATTITUDE, QUICK_COMMENTS, STATES, lessonPoints, mondayOf, shareText, weekRange, weekTotals
} from '../../../components/reports/reportLogic';
import { groupColor } from '../../../lib/groups';
import { apiError } from '../modals/form';

const BASE = '/api/teacher/reports';
const MAX_LESSONS = 6;
const blankRow = () => ({ title: '', refId: null, state: 'none', mark: null, max: null });
const blankLesson = (n) => ({ number: n, hw: blankRow(), quiz: blankRow(), contribution: 0 });

/** The form's starting values: the saved report, or what the site knows about the week. */
const initialForm = (data) => {
  const src = data.report || data.fromSite;
  const lessons = (src.lessons || []).map((l, i) => ({ ...blankLesson(i + 1), ...l, number: i + 1, hw: { ...blankRow(), ...l.hw }, quiz: { ...blankRow(), ...l.quiz } }));
  while (lessons.length < 3) lessons.push(blankLesson(lessons.length + 1));
  const attitude = (src.attitude && src.attitude.length ? src.attitude : DEFAULT_ATTITUDE.map(label => ({ label, rating: 0 }))).map(a => ({ label: a.label, rating: a.rating || 0 }));
  return { weekNumber: src.weekNumber || 1, session: src.session || '', lessons, attitude, comments: src.comments || '' };
};

const STATUS = {
  published: { label: 'Published', cls: 'c-pr' },
  draft: { label: 'Draft', cls: 'c-am' },
  none: { label: 'No report', cls: 'c-gy' }
};

/** Work → Reports: pick a week, auto-fill every student from the site, review, publish. */
export default function Reports() {
  const toast = useToast();
  const confirm = useConfirm();
  const [week, setWeek] = useState(() => mondayOf());
  const [group, setGroup] = useState('all');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const roster = useApi(`${BASE}?weekStart=${week}`, b => b.data || {});

  const all = useMemo(() => roster.data?.students || [], [roster.data]);
  const groups = useMemo(() => [...new Set(all.map(s => s.group).filter(Boolean))].sort(), [all]);
  const shown = useMemo(() => all.filter(s => group === 'all' || (group === 'none' ? !s.group : s.group === group)), [all, group]);
  const counts = useMemo(() => ({
    published: shown.filter(s => s.report?.status === 'published').length,
    draft: shown.filter(s => s.report?.status === 'draft').length,
    none: shown.filter(s => !s.report).length
  }), [shown]);

  // A different week means different reports
  useEffect(() => { setSelected(null); }, [week]);

  const shift = (n) => setWeek(w => mondayOf(new Date(`${w}T12:00:00`), n));

  const autofill = async () => {
    setBusy(true);
    try {
      const res = await api.post(`${BASE}/autofill`, { weekStart: week, group: group === 'all' ? undefined : group, studentIds: group === 'all' ? undefined : shown.map(s => s._id) });
      const n = res.data?.created || 0;
      toast(n ? `Filled ${n} report${n === 1 ? '' : 's'} from homework and quizzes` : 'Everyone already has a report this week');
      await roster.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const publishAll = async () => {
    const ids = shown.filter(s => s.report?.status === 'draft').map(s => s._id);
    if (!ids.length) return toast('No drafts to publish');
    if (!(await confirm({ title: `Publish ${ids.length} draft${ids.length === 1 ? '' : 's'}?`, body: 'Students and parents will be notified and can see the reports straight away.', confirmLabel: 'Publish' }))) return undefined;
    setBusy(true);
    try {
      await api.post(`${BASE}/publish`, { weekStart: week, studentIds: ids });
      toast('Reports published');
      await roster.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  /** Next student in the list who still needs attention (no report, then drafts) after `id`. */
  const nextAfter = useCallback((id) => {
    const i = shown.findIndex(s => s._id === id);
    const rest = [...shown.slice(i + 1), ...shown.slice(0, i)];
    return (rest.find(s => !s.report) || rest.find(s => s.report?.status === 'draft') || {})._id || null;
  }, [shown]);

  const total = shown.length;
  const pct = total ? Math.round((counts.published / total) * 100) : 0;

  return (
    <div className={`rp-admin ${selected ? 'has-editor' : ''}`}>
      <div className="card rp-list">
        <div className="rp-weekbar">
          <button type="button" className="ib sm" aria-label="Previous week" onClick={() => shift(-1)}><Ic as={ChevronLeft} /></button>
          <label className="rp-weekpick">
            <Ic as={CalendarDays} />
            <span><b>{roster.data ? `Week ${roster.data.weekNumber}` : 'Week'}</b><small>{weekRange(week)}</small></span>
            <input type="date" value={week} aria-label="Pick any day of the week" onChange={e => e.target.value && setWeek(mondayOf(new Date(`${e.target.value}T12:00:00`)))} />
          </label>
          <button type="button" className="ib sm" aria-label="Next week" onClick={() => shift(1)}><Ic as={ChevronRight} /></button>
        </div>

        <div className="rp-meter" aria-label={`${counts.published} of ${total} published`}>
          <div className="rp-meter-bar"><i style={{ width: `${pct}%` }} /></div>
          <small><b>{counts.published}</b> published · <b>{counts.draft}</b> drafts · <b>{counts.none}</b> to do</small>
        </div>

        <div className="rp-actions">
          <button type="button" className="btn p sm" disabled={busy || !counts.none} onClick={autofill}><Ic as={Wand2} />Auto-fill {counts.none ? counts.none : ''} from site</button>
          <button type="button" className="btn o sm" disabled={busy || !counts.draft} onClick={publishAll}><Ic as={Send} />Publish {counts.draft || ''} drafts</button>
        </div>

        {groups.length > 0 && (
          <Chips
            label="Group"
            value={group}
            onChange={setGroup}
            items={[{ id: 'all', label: 'All' }, ...groups.map(g => ({ id: g, label: `GRP ${g}` })), ...(all.some(s => !s.group) ? [{ id: 'none', label: 'No group' }] : [])]}
          />
        )}

        {roster.loading && !roster.data && <Loading label="Loading students…" />}
        {roster.error && <ErrorNote error={roster.error} onRetry={roster.reload} />}
        {roster.data && !shown.length && <Empty icon={FileBarChart}>No students to report on.</Empty>}
        <ul className="rp-roster">
          {shown.map(s => {
            const st = STATUS[s.report?.status || 'none'];
            return (
              <li key={s._id}>
                <button type="button" className={`rp-student ${selected === s._id ? 'on' : ''}`} aria-current={selected === s._id ? 'true' : undefined} onClick={() => setSelected(s._id)}>
                  <span className="av" aria-hidden="true" style={s.group ? { '--g': groupColor(s.group) } : undefined}>{initials(s.name)}</span>
                  <span className="rp-student-main"><b>{s.name}</b><small>{s.studentId || '—'}{s.group ? ` · GRP ${s.group}` : ''}</small></span>
                  {s.report?.possible > 0 && <span className="rp-student-pts">{s.report.gained}<small>/{s.report.possible}</small></span>}
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rp-editor-wrap">
        {selected
          ? <ReportEditor key={`${selected}:${week}`} studentId={selected} week={week} onBack={() => setSelected(null)} onSaved={roster.reload} next={nextAfter(selected)} onNext={setSelected} />
          : <div className="card rp-hint"><Empty icon={Sparkles}>Pick a student to write their report. “Auto-fill from site” first pulls every homework and quiz mark for the week, so you only add the communication ratings and a comment.</Empty></div>}
      </div>
    </div>
  );
}

function StarInput({ value, onChange, label }) {
  return (
    <span className="rp-starin" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5`} className={n <= value ? 'on' : ''} onClick={() => onChange(value === n ? 0 : n)}>
          <Star className="i" aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}

function MarkInput({ kind, row, onChange }) {
  const Icon = kind === 'quiz' ? GraduationCap : ClipboardCheck;
  const set = (patch) => onChange({ ...row, ...patch });
  const over = row.mark !== null && row.max !== null && row.mark > row.max;
  const num = (v) => (v === '' ? null : Number(v));
  return (
    <div className={`rp-row st-${row.state}`}>
      <div className="rp-row-head">
        <span className="rp-row-ic"><Ic as={Icon} /></span>
        <input className="inp rp-title" aria-label={kind === 'quiz' ? 'Quiz title' : 'Homework title'} placeholder={kind === 'quiz' ? 'Quiz' : 'Homework'} value={row.title} onChange={e => set({ title: e.target.value })} />
        {row.refId && <span className="chip c-th rp-auto" title="Filled from the website">Auto</span>}
      </div>
      <div className="rp-row-body">
        <div className="rp-seg" role="radiogroup" aria-label={`${kind === 'quiz' ? 'Quiz' : 'Homework'} status`}>
          {STATES.map(s => (
            <button key={s.id} type="button" role="radio" aria-checked={row.state === s.id} className={`s-${s.id} ${row.state === s.id ? 'on' : ''}`} onClick={() => set({ state: s.id, ...(s.id === 'missed' ? { mark: null } : {}) })}>{s.label}</button>
          ))}
        </div>
        <div className={`rp-score ${over ? 'over' : ''}`}>
          <input className="inp" type="number" inputMode="decimal" min="0" aria-label="Mark" placeholder="Mark" value={row.mark ?? ''} onChange={e => set({ mark: num(e.target.value), ...(e.target.value !== '' && ['none', 'missed'].includes(row.state) ? { state: 'done' } : {}) })} />
          <span>/</span>
          <input className="inp" type="number" inputMode="decimal" min="0" aria-label="Out of" placeholder="Max" value={row.max ?? ''} onChange={e => set({ max: num(e.target.value) })} />
        </div>
      </div>
      {over && <small className="rp-warn">Mark is higher than the maximum.</small>}
    </div>
  );
}

function ReportEditor({ studentId, week, onBack, onSaved, next, onNext }) {
  const toast = useToast();
  const detail = useApi(`${BASE}/${studentId}?weekStart=${week}`, b => b.data || {});
  const [form, setForm] = useState(null);
  const [view, setView] = useState('edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detail.data) setForm(initialForm(detail.data));
  }, [detail.data]);

  const patch = (p) => setForm(f => ({ ...f, ...p }));
  const setLesson = (i, p) => patch({ lessons: form.lessons.map((l, k) => (k === i ? { ...l, ...p } : l)) });
  const totals = useMemo(() => weekTotals(form?.lessons), [form]);

  if (detail.loading && !detail.data) return <div className="card"><Loading label="Opening report…" /></div>;
  if (detail.error) return <div className="card"><ErrorNote error={detail.error} onRetry={detail.reload} /></div>;
  if (!form) return null;

  const { student, report } = detail.data;
  const status = report?.status || 'none';
  const link = `${window.location.origin}/parent-dashboard/reports`;

  const refill = () => {
    const site = detail.data.fromSite.lessons;
    patch({ lessons: form.lessons.map((l, i) => (site[i] ? { ...l, hw: { ...site[i].hw }, quiz: { ...site[i].quiz } } : l)).concat(site.slice(form.lessons.length).map((l, i) => ({ ...blankLesson(form.lessons.length + i + 1), ...l }))) });
    toast('Homework and quiz marks reloaded from the site');
  };

  const save = async ({ publish, goNext } = {}) => {
    setSaving(true);
    try {
      await api.put(`${BASE}/${studentId}`, { weekStart: week, ...form, publish });
      toast(publish ? 'Report published' : 'Draft saved');
      await onSaved();
      if (goNext && next) onNext(next);
      else if (!goNext) detail.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    const text = shareText({ name: student.name, weekNumber: form.weekNumber, ...totals, comments: form.comments }, link);
    try {
      await navigator.clipboard.writeText(text);
      toast('Message copied. Paste it into WhatsApp.');
    } catch {
      toast('Couldn’t copy. Select the comment and copy it by hand.');
    }
  };

  const preview = { ...form, _id: 'preview', weekStart: week, status: 'draft' };

  return (
    <div className="card rp-editor">
      <div className="rp-ed-head">
        <button type="button" className="ib sm rp-back" aria-label="Back to students" onClick={onBack}><Ic as={ArrowLeft} /></button>
        <span className="av" aria-hidden="true">{initials(student.name)}</span>
        <div className="rp-ed-id">
          <h3>{student.name}</h3>
          <small>{student.studentId || '—'}{student.group ? ` · GRP ${student.group}` : ''}</small>
        </div>
        <span className={`chip ${STATUS[status].cls}`}>{STATUS[status].label}</span>
      </div>

      <div className="rp-meta">
        <label>Week no.<input className="inp" type="number" min="1" max="60" value={form.weekNumber} onChange={e => patch({ weekNumber: Number(e.target.value) || 1 })} /></label>
        <label>Session<input className="inp" value={form.session} maxLength={40} placeholder="e.g. JUN 27" onChange={e => patch({ session: e.target.value })} /></label>
        <label className="rp-meta-range">Dates<span className="inp ro">{weekRange(week)}</span></label>
      </div>

      <Seg tabs={[{ id: 'edit', label: 'Fill in', icon: ClipboardCheck }, { id: 'preview', label: 'Preview', icon: Eye }]} value={view} onChange={setView} label="Report view" />

      {view === 'preview' ? <ReportCard report={preview} reports={[]} name={student.name} /> : (
        <>
          <section className="rp-block">
            <div className="rp-block-head">
              <h4>Academic performance</h4>
              <button type="button" className="btn o sm" onClick={refill}><Ic as={RefreshCw} />Reload from site</button>
            </div>
            {form.lessons.map((l, i) => {
              const p = lessonPoints(l);
              return (
                <div className="rp-lesson-edit" key={l.number}>
                  <div className="rp-lesson-top">
                    <span className="rp-num">{l.number}</span><b>Lesson {l.number}</b>
                    <span className="rp-gain">{p.possible ? `${p.gained} / ${p.possible}` : '—'}<small>gained</small></span>
                    {form.lessons.length > 1 && <button type="button" className="ib sm dng" aria-label={`Remove lesson ${l.number}`} onClick={() => patch({ lessons: form.lessons.filter((_, k) => k !== i).map((x, k) => ({ ...x, number: k + 1 })) })}><Ic as={Trash2} /></button>}
                  </div>
                  <MarkInput kind="hw" row={l.hw} onChange={hw => setLesson(i, { hw })} />
                  <MarkInput kind="quiz" row={l.quiz} onChange={quiz => setLesson(i, { quiz })} />
                  <div className="rp-contrib"><span>Session contribution</span><StarInput value={l.contribution} label={`Lesson ${l.number} contribution`} onChange={contribution => setLesson(i, { contribution })} /></div>
                </div>
              );
            })}
            {form.lessons.length < MAX_LESSONS && <button type="button" className="btn o sm" onClick={() => patch({ lessons: [...form.lessons, blankLesson(form.lessons.length + 1)] })}><Ic as={Plus} />Add lesson</button>}
          </section>

          <section className="rp-block">
            <h4>Attitude</h4>
            {form.attitude.map((a, i) => (
              <div className="rp-attitude" key={i}>
                <input className="inp" aria-label={`Attitude ${i + 1} name`} value={a.label} maxLength={60} onChange={e => patch({ attitude: form.attitude.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                <StarInput value={a.rating} label={`${a.label} rating`} onChange={rating => patch({ attitude: form.attitude.map((x, k) => (k === i ? { ...x, rating } : x)) })} />
              </div>
            ))}
          </section>

          <section className="rp-block">
            <h4>Comments</h4>
            <div className="rp-quick" aria-label="Quick comments">
              {QUICK_COMMENTS.map(q => (
                <button key={q} type="button" className="ch" onClick={() => patch({ comments: form.comments ? `${form.comments.trim()} ${q}` : q })}>{q}</button>
              ))}
            </div>
            <textarea className="inp" rows={4} maxLength={1500} placeholder="Anything the parent should know…" value={form.comments} onChange={e => patch({ comments: e.target.value })} />
          </section>
        </>
      )}

      <div className="rp-foot">
        <div className="rp-total" aria-live="polite">
          <b>{totals.gained}</b><span>/ {totals.possible} points</span>{totals.percent !== null && <em>{totals.percent}%</em>}
        </div>
        <div className="rp-foot-btns">
          <button type="button" className="btn o sm" onClick={copy}><Ic as={Copy} />Copy message</button>
          <button type="button" className="btn o" disabled={saving} onClick={() => save({ publish: status === 'published' ? undefined : false, goNext: !!next })}><Ic as={Check} />{next ? 'Save & next' : 'Save'}</button>
          <button type="button" className="btn p" disabled={saving} onClick={() => save({ publish: true, goNext: !!next })}><Ic as={Send} />{status === 'published' ? 'Update' : 'Publish'}</button>
        </div>
      </div>
    </div>
  );
}
