import React, { useEffect, useState } from 'react';
import { GraduationCap, Megaphone, Play, Library, Upload } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { useToast } from '../../../components/portal/PortalUI';
import { PHASES, PROGRAMS } from '../curriculum';
import { FormDialog, Fld, apiError, announceChange, toLocalInput } from './form';
import StudentChecklist from './StudentChecklist';

// Shared form state helper: values + per-field errors + reset when opened.
function useForm(open, initial) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setV(initial); setErrors({}); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setV(x => ({ ...x, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  return { v, setV, set, errors, setErrors, busy, setBusy };
}

async function save(f, request, { toast, okMsg, kind, onClose, onSaved }) {
  f.setBusy(true);
  try {
    const res = await request();
    toast(okMsg);
    announceChange(kind);
    onSaved?.(res);
    onClose();
  } catch (err) {
    f.setErrors({ form: apiError(err) });
  } finally {
    f.setBusy(false);
  }
}

/** Create quiz: timed quiz for students. */
export function QuizModal({ open, onClose }) {
  const toast = useToast();
  const f = useForm(open, { title: '', duration: 10, maxScore: 30, section: 'theory', date: '', time: '', difficulty: 'medium', instructions: '', assignTo: 'all', chosen: new Set() });
  const { v, set } = f;
  const submit = () => {
    const e = {};
    if (v.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!v.date) e.date = 'Choose a date';
    if (!v.time) e.time = 'Choose a start time';
    if (!(Number(v.duration) >= 1)) e.duration = 'At least 1 minute';
    if (!(Number(v.maxScore) >= 1)) e.maxScore = 'At least 1';
    if (v.assignTo === 'selected' && !v.chosen.size) e.students = 'Choose at least one student';
    f.setErrors(e);
    if (Object.keys(e).length) return;
    save(f, () => api.post(API_ENDPOINTS.QUIZZES, {
      title: v.title.trim(), type: v.section, section: v.section, startDate: new Date(`${v.date}T00:00`).toISOString(), startTime: v.time,
      duration: Number(v.duration), maxScore: Number(v.maxScore), difficulty: v.difficulty, instructions: v.instructions.trim() || undefined,
      assignToAll: v.assignTo === 'all', ...(v.assignTo === 'selected' && { selectedStudents: [...v.chosen] })
    }), { toast, okMsg: 'Quiz created', kind: 'quiz', onClose });
  };
  return (
    <FormDialog open={open} onClose={onClose} icon={GraduationCap} title="Create quiz" sub="Timed quiz for your students" submitLabel="Create quiz" busy={f.busy} error={f.errors.form} onSubmit={submit}>
      <Fld label="Title *" error={f.errors.title}><input className="inp" value={v.title} onChange={set('title')} placeholder="e.g. Networks quiz" /></Fld>
      <div className="r2">
        <Fld label="Duration (min)" error={f.errors.duration}><input className="inp" type="number" min="1" value={v.duration} onChange={set('duration')} /></Fld>
        <Fld label="Max score" error={f.errors.maxScore}><input className="inp" type="number" min="1" value={v.maxScore} onChange={set('maxScore')} /></Fld>
      </div>
      <div className="r2">
        <Fld label="Date *" error={f.errors.date}><input className="inp" type="date" value={v.date} onChange={set('date')} /></Fld>
        <Fld label="Opens at *" error={f.errors.time}><input className="inp" type="time" value={v.time} onChange={set('time')} /></Fld>
      </div>
      <div className="r2">
        <Fld label="Type"><select className="inp" value={v.section} onChange={set('section')}><option value="theory">Theory</option><option value="practical">Practical</option></select></Fld>
        <Fld label="Difficulty"><select className="inp" value={v.difficulty} onChange={set('difficulty')}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></Fld>
      </div>
      <Fld label="Assign to"><select className="inp" value={v.assignTo} onChange={set('assignTo')}><option value="all">All students</option><option value="selected">Selected students</option></select></Fld>
      {v.assignTo === 'selected' && <StudentChecklist chosen={v.chosen} onChange={c => f.setV(x => ({ ...x, chosen: c }))} error={f.errors.students} />}
      <Fld label="Instructions (optional)"><textarea className="inp" rows={3} value={v.instructions} onChange={set('instructions')} /></Fld>
    </FormDialog>
  );
}

export const ANN_TYPES = ['general', 'assignment', 'exam', 'holiday', 'deadline', 'meeting', 'important'];

/** Create / edit announcement. */
export function AnnouncementModal({ open, onClose, announcement }) {
  const toast = useToast();
  const a = announcement;
  const f = useForm(open, {
    title: a?.title || '', content: a?.content || '', type: a?.type || 'general', priority: a?.priority || 'medium',
    targetAudience: a?.targetAudience || 'all', scheduledFor: toLocalInput(a?.scheduledFor), expiresAt: toLocalInput(a?.expiresAt), isPinned: !!a?.isPinned
  });
  const { v, set } = f;
  const submit = () => {
    const e = {};
    if (v.title.trim().length < 5) e.title = 'Title must be 5–200 characters';
    if (v.content.trim().length < 10) e.content = 'Content must be at least 10 characters';
    f.setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: v.title.trim(), content: v.content.trim(), type: v.type, priority: v.priority, targetAudience: v.targetAudience, isPinned: v.isPinned, isPublished: true,
      scheduledFor: v.scheduledFor ? new Date(v.scheduledFor).toISOString() : undefined,
      expiresAt: v.expiresAt ? new Date(v.expiresAt).toISOString() : undefined
    };
    save(f, () => (a ? api.put(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${a._id}`, body) : api.post(API_ENDPOINTS.ANNOUNCEMENTS.BASE, body)),
      { toast, okMsg: a ? 'Announcement saved' : 'Announcement published', kind: 'announcement', onClose });
  };
  return (
    <FormDialog open={open} onClose={onClose} icon={Megaphone} title={a ? 'Edit announcement' : 'Create new announcement'} submitLabel={a ? 'Save' : 'Create announcement'} busy={f.busy} error={f.errors.form} onSubmit={submit}>
      <Fld label="Title (5–200 characters)" error={f.errors.title}><input className="inp" value={v.title} onChange={set('title')} maxLength={200} /></Fld>
      <Fld label="Content (min. 10 characters)" error={f.errors.content}><textarea className="inp" rows={4} value={v.content} onChange={set('content')} /></Fld>
      <div className="r2">
        <Fld label="Category"><select className="inp" value={v.type} onChange={set('type')}>{ANN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="Priority"><select className="inp" value={v.priority} onChange={set('priority')}>{['low', 'medium', 'high', 'urgent'].map(t => <option key={t} value={t}>{t}</option>)}</select></Fld>
      </div>
      <Fld label="Target audience"><select className="inp" value={v.targetAudience} onChange={set('targetAudience')}><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option></select></Fld>
      <div className="r2">
        <Fld label="Publish date (optional)"><input className="inp" type="datetime-local" value={v.scheduledFor} onChange={set('scheduledFor')} /></Fld>
        <Fld label="Expiry date (optional)"><input className="inp" type="datetime-local" value={v.expiresAt} onChange={set('expiresAt')} /></Fld>
      </div>
      <label className="cbx"><input type="checkbox" checked={v.isPinned} onChange={set('isPinned')} /> Pin this announcement</label>
    </FormDialog>
  );
}

// Chapters per phase allowed by the Video model (lesson slots, not chapter numbers).
const VIDEO_CHAPTERS = { 1: 4, 2: 3, 3: 6 };
const ACCESS = [['all', 'All students'], ['year10', 'Year 10 only'], ['year11', 'Year 11 only'], ['year12', 'Year 12 only']];

/** Add / edit video. Theory → phase + chapter; practical → program + guide/task; other → revisions. */
export function VideoModal({ open, onClose, video }) {
  const toast = useToast();
  const x = video;
  const f = useForm(open, {
    title: x?.title || '', type: x?.type || 'theory', description: x?.description || '', videoUrl: x?.videoUrl || '',
    phase: x?.phase || 1, chapter: x?.chapter || 1, program: x?.program || 'word', contentType: x?.contentType || 'guide',
    order: x?.order ?? '', accessLevel: x?.accessLevel || 'all'
  });
  const { v, set } = f;
  const submit = () => {
    const e = {};
    if (!v.title.trim()) e.title = 'Enter a title';
    if (!v.videoUrl.includes('drive.google.com')) e.videoUrl = 'Paste a Google Drive video link'; // same rule as the API
    f.setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: v.title.trim(), type: v.type, description: v.description.trim(), videoUrl: v.videoUrl.trim(), accessLevel: v.accessLevel,
      ...(v.order !== '' && { order: Number(v.order) }),
      ...(v.type === 'theory' && { phase: Number(v.phase), chapter: Number(v.chapter) }),
      ...(v.type === 'practical' && { program: v.program, contentType: v.contentType })
    };
    save(f, () => (x ? api.put(`${API_ENDPOINTS.TEACHER.VIDEOS}/${x._id}`, body) : api.post(API_ENDPOINTS.TEACHER.VIDEOS, body)),
      { toast, okMsg: 'Video saved', kind: 'video', onClose });
  };
  return (
    <FormDialog open={open} onClose={onClose} icon={Play} title={x ? 'Edit video' : 'Add new video'} submitLabel={x ? 'Save' : 'Create video'} busy={f.busy} error={f.errors.form} onSubmit={submit}>
      <div className="r2">
        <Fld label="Title *" error={f.errors.title}><input className="inp" value={v.title} onChange={set('title')} placeholder="Enter video title" /></Fld>
        <Fld label="Type"><select className="inp" value={v.type} onChange={set('type')}><option value="theory">Theory</option><option value="practical">Practical</option><option value="other">Other (revision)</option></select></Fld>
      </div>
      <Fld label="Description (optional)"><textarea className="inp" rows={2} value={v.description} onChange={set('description')} /></Fld>
      <Fld label="Video URL (Google Drive) *" error={f.errors.videoUrl}><input className="inp" type="url" value={v.videoUrl} onChange={set('videoUrl')} placeholder="https://drive.google.com/file/d/…" /></Fld>
      {v.type === 'theory' && (
        <div className="r2">
          <Fld label="Phase"><select className="inp" value={v.phase} onChange={e => f.setV(s => ({ ...s, phase: Number(e.target.value), chapter: 1 }))}>{PHASES.map(p => <option key={p.phase} value={p.phase}>{p.label}</option>)}</select></Fld>
          <Fld label="Chapter in phase"><select className="inp" value={v.chapter} onChange={set('chapter')}>{Array.from({ length: VIDEO_CHAPTERS[v.phase] || 4 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></Fld>
        </div>
      )}
      {v.type === 'practical' && (
        <div className="r2">
          <Fld label="Program"><select className="inp" value={v.program} onChange={set('program')}>{PROGRAMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></Fld>
          <Fld label="Content"><select className="inp" value={v.contentType} onChange={set('contentType')}><option value="guide">Guide</option><option value="task">Task</option></select></Fld>
        </div>
      )}
      <div className="r2">
        <Fld label="Order (optional)"><input className="inp" type="number" min="0" value={v.order} onChange={set('order')} placeholder="Auto" /></Fld>
        <Fld label="Access level"><select className="inp" value={v.accessLevel} onChange={set('accessLevel')}>{ACCESS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Fld>
      </div>
    </FormDialog>
  );
}

/** Add / edit interactive note (Prezi link optional → "No link yet"). */
export function NoteModal({ open, onClose, note }) {
  const toast = useToast();
  const n = note;
  const f = useForm(open, { title: n?.title || '', phase: n?.phase || 1, chapter: n?.chapter || '', linkUrl: n?.linkUrl || '', order: n?.order ?? 0 });
  const { v, set } = f;
  const submit = () => {
    const e = {};
    if (!v.title.trim()) e.title = 'Enter a title';
    if (v.linkUrl && !/^https?:\/\//.test(v.linkUrl.trim())) e.linkUrl = 'Enter a full link starting with https://';
    f.setErrors(e);
    if (Object.keys(e).length) return;
    const body = { title: v.title.trim(), phase: Number(v.phase), linkUrl: v.linkUrl.trim(), order: Number(v.order) || 0, ...(v.chapter !== '' && { chapter: Number(v.chapter) }) };
    save(f, () => (n ? api.put(`${API_ENDPOINTS.TEACHER.NOTES}/${n._id}`, body) : api.post(API_ENDPOINTS.TEACHER.NOTES, body)),
      { toast, okMsg: 'Note saved', kind: 'note', onClose });
  };
  return (
    <FormDialog open={open} onClose={onClose} icon={Library} title={n ? 'Edit note' : 'Add new note'} sub="Prezi notes by chapter and phase" submitLabel={n ? 'Save' : 'Create note'} busy={f.busy} error={f.errors.form} onSubmit={submit}>
      <div className="r2">
        <Fld label="Title *" error={f.errors.title}><input className="inp" value={v.title} onChange={set('title')} placeholder="e.g. CH 7 Malware Attacks" /></Fld>
        <Fld label="Phase"><select className="inp" value={v.phase} onChange={set('phase')}>{PHASES.map(p => <option key={p.phase} value={p.phase}>{p.label}</option>)}</select></Fld>
      </div>
      <div className="r2">
        <Fld label="Chapter number (optional)"><input className="inp" type="number" min="1" value={v.chapter} onChange={set('chapter')} placeholder="Read from the title" /></Fld>
        <Fld label="Order (optional)"><input className="inp" type="number" min="0" value={v.order} onChange={set('order')} /></Fld>
      </div>
      <Fld label="Prezi link (leave empty if not ready)" error={f.errors.linkUrl}><input className="inp" type="url" value={v.linkUrl} onChange={set('linkUrl')} placeholder="https://prezi.com/…" /></Fld>
    </FormDialog>
  );
}

/** Upload / edit material: a file or an external link. */
export function MaterialModal({ open, onClose, material }) {
  const toast = useToast();
  const m = material;
  const f = useForm(open, { title: m?.title || '', description: m?.description || '', type: m?.type || 'theory', externalUrl: m?.externalUrl || '', file: null });
  const { v, set } = f;
  const isLinkOnly = !!m && !m.fileName; // materials made from a link can have their link edited
  const submit = () => {
    const e = {};
    if (!v.title.trim()) e.title = 'Enter a title';
    if ((!m && !v.file && !v.externalUrl.trim()) || (isLinkOnly && !v.externalUrl.trim())) e.file = m ? 'Paste the link' : 'Choose a file or paste a link';
    f.setErrors(e);
    if (Object.keys(e).length) return;
    if (m) {
      const body = { title: v.title.trim(), description: v.description.trim(), type: v.type };
      if (isLinkOnly) body.externalUrl = v.externalUrl.trim();
      save(f, () => api.put(`${API_ENDPOINTS.TEACHER.MATERIALS}/${m._id}`, body), { toast, okMsg: 'Material saved', kind: 'material', onClose });
      return;
    }
    const fd = new FormData();
    fd.append('title', v.title.trim());
    fd.append('type', v.type);
    if (v.description.trim()) fd.append('description', v.description.trim());
    if (v.file) fd.append('material', v.file);
    else fd.append('externalUrl', v.externalUrl.trim());
    save(f, () => api.post(API_ENDPOINTS.TEACHER.MATERIALS, fd), { toast, okMsg: 'Material uploaded', kind: 'material', onClose });
  };
  return (
    <FormDialog open={open} onClose={onClose} icon={Upload} title={m ? 'Edit material' : 'Upload new material'} submitLabel={m ? 'Save' : 'Upload material'} busy={f.busy} error={f.errors.form} onSubmit={submit}>
      <Fld label="Title *" error={f.errors.title}><input className="inp" value={v.title} onChange={set('title')} placeholder="e.g. Classified" /></Fld>
      <Fld label="Description (optional)"><textarea className="inp" rows={2} value={v.description} onChange={set('description')} /></Fld>
      <Fld label="Type"><select className="inp" value={v.type} onChange={set('type')}><option value="theory">Theory</option><option value="practical">Practical</option><option value="other">Other</option></select></Fld>
      {isLinkOnly && (
        <Fld label="Link" error={f.errors.file}><input className="inp" type="url" value={v.externalUrl} onChange={set('externalUrl')} placeholder="https://drive.google.com/…" /></Fld>
      )}
      {!m && (
        <>
          <label className="drop">
            <Upload className="i" aria-hidden="true" />
            <b>{v.file ? v.file.name : 'Click to select a file'}</b>
            <small>PDF, Word, PowerPoint, Excel, ZIP · Max 100MB</small>
            <input type="file" className="sr-only" onChange={e => f.setV(s => ({ ...s, file: e.target.files[0] || null }))} />
          </label>
          <Fld label="…or external link" error={f.errors.file}><input className="inp" type="url" value={v.externalUrl} onChange={set('externalUrl')} placeholder="https://" disabled={!!v.file} /></Fld>
        </>
      )}
    </FormDialog>
  );
}
