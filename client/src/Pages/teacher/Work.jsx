import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Download, ClipboardCheck, GraduationCap, Plus, ChevronRight, Trash2, X, Paperclip, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api, downloadFile } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, Seg, fmtDate, fmtDateTime, initials } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { useTeacherChange, apiError } from './modals/form';
import { lessonLabel } from './curriculum';
import Submissions from './work/Submissions';

const TABS = ['submissions', 'assignments', 'quizzes'];

export default function Work() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, counts, openModal } = useTeacher();
  if (!TABS.includes(tab)) return <Navigate to={`${base}/work/submissions`} replace />;

  return (
    <>
      <PageHead
        title="Work"
        actions={
          <>
            <button type="button" className="btn o" onClick={() => openModal('quiz')}><Ic as={GraduationCap} />Create quiz</button>
            <button type="button" className="btn p" onClick={() => openModal('hw')}><Ic as={Plus} />Create H.W</button>
          </>
        }
      />
      <Seg
        tabs={[
          { id: 'submissions', label: 'Submissions', icon: Download, count: counts.needsGrading || '' },
          { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
          { id: 'quizzes', label: 'Quizzes', icon: GraduationCap }
        ]}
        value={tab}
        onChange={id => navigate(`${base}/work/${id}`)}
        label="Work sections"
      />
      {tab === 'submissions' && <Submissions />}
      {tab === 'assignments' && <AssignmentTable />}
      {tab === 'quizzes' && <QuizTable />}
    </>
  );
}

function AssignmentTable() {
  const { base } = useTeacher();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const list = useApi(`${API_ENDPOINTS.ASSIGNMENTS}?limit=200`, b => b.data?.assignments || []);
  useTeacherChange('assignment', list.reload);
  if (list.loading && !list.data) return <Loading label="Loading assignments…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];

  const remove = async (a) => {
    if (!(await confirm({ title: `Delete “${a.title}”?`, body: 'Students lose access to it and its submissions.', confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`${API_ENDPOINTS.ASSIGNMENTS}/${a._id}`);
      toast('Assignment deleted');
      list.reload();
    } catch (err) {
      toast(apiError(err));
    }
  };

  return (
    <div className="card">
      <h3><Ic as={ClipboardCheck} />Assignments<small className="sub tcount-h">{items.length} total</small></h3>
      {!items.length && <Empty icon={ClipboardCheck}>No assignments yet. Use “Create H.W”.</Empty>}
      <div className="tbl" role="list">
        {items.map(a => {
          const handed = (a.assignedTo || []).filter(e => ['submitted', 'graded'].includes(e.status));
          const toGrade = handed.filter(e => e.status === 'submitted').length;
          return (
            <div className="trow" role="listitem" key={a._id}>
              <button type="button" className="trow-open" onClick={() => navigate(`${base}/work/submissions?status=all&assignment=${a._id}`)}>
                <span className="lic"><Ic as={ClipboardCheck} /></span>
                <span className="lmain"><b>{a.title}</b><small>Due {fmtDate(a.dueDate, { day: 'numeric', month: 'numeric', year: 'numeric' })} · max {a.maxScore}{a.lesson?.section ? ` · ${lessonLabel(a.lesson)}` : ''}</small></span>
                <span className={`chip ${a.section === 'theory' ? 'c-th' : 'c-pr'}`}>{a.section}</span>
                <span className="chip c-gy hide-sm">{a.type}</span>
                <span className="tcount"><b>{handed.length}</b> submitted</span>
                {toGrade ? <span className="chip c-am">{toGrade} to grade</span> : <span className="chip c-gy">—</span>}
                <Ic as={ChevronRight} />
              </button>
              <button type="button" className="ib sm dng" aria-label={`Delete ${a.title}`} onClick={() => remove(a)}><Ic as={Trash2} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizTable() {
  const list = useApi(`${API_ENDPOINTS.QUIZZES}?limit=200`, b => b.data?.quizzes || []);
  const [open, setOpen] = useState(null);
  useTeacherChange('quiz', list.reload);
  if (list.loading && !list.data) return <Loading label="Loading quizzes…" />;
  if (list.error) return <ErrorNote error={list.error} onRetry={list.reload} />;
  const items = list.data || [];
  return (
    <div className="card">
      <h3><Ic as={GraduationCap} />Quizzes<small className="sub tcount-h">{items.length} total</small></h3>
      {!items.length && <Empty icon={GraduationCap}>No quizzes yet. Use “Create quiz”.</Empty>}
      <div className="tbl" role="list">
        {items.map(q => {
          const done = (q.assignedTo || []).filter(e => ['submitted', 'graded'].includes(e.status)).length;
          return (
            <div className="trow" role="listitem" key={q._id}>
              <button type="button" className="trow-open" onClick={() => setOpen(q)}>
                <span className="lic"><Ic as={GraduationCap} /></span>
                <span className="lmain"><b>{q.title}</b><small>{q.duration} min · max {q.maxScore} · {fmtDate(q.startDate)} {q.startTime}</small></span>
                <span className="chip c-th">{q.type}</span>
                <span className="tcount"><b>{done}</b> / {(q.assignedTo || []).length} completed</span>
                <Ic as={ChevronRight} />
              </button>
            </div>
          );
        })}
      </div>
      <QuizSubmissionsDialog quiz={open} onClose={() => { setOpen(null); list.reload(); }} />
    </div>
  );
}

/** Quiz submissions with download and inline grading (PUT /api/teacher/quizzes/:id/students/:sid). */
function QuizSubmissionsDialog({ quiz, onClose }) {
  const toast = useToast();
  const subs = useApi(quiz ? `${API_ENDPOINTS.QUIZZES}/${quiz._id}/submissions` : null, b => b.data?.submissions || b.data?.quiz?.assignedTo || []);
  const [scores, setScores] = useState({});
  if (!quiz) return null;
  const rows = (subs.data || []).filter(s => ['submitted', 'graded'].includes(s.status));

  const grade = async (s) => {
    const sid = String(s.student?._id || s.student);
    const value = Number(scores[sid] ?? s.score);
    if (Number.isNaN(value) || value < 0 || value > quiz.maxScore) return toast(`Enter a score between 0 and ${quiz.maxScore}`);
    try {
      await api.put(`/api/teacher/quizzes/${quiz._id}/students/${sid}`, { score: value });
      toast('Quiz graded');
      subs.reload();
    } catch (err) {
      toast(apiError(err));
    }
  };

  return (
    <Dialog open onClose={onClose} size="wide" labelledBy="qs-title">
      <DialogHeader id="qs-title" icon={GraduationCap} title={quiz.title} sub={`${rows.length} submission${rows.length === 1 ? '' : 's'} · max ${quiz.maxScore}`} onClose={onClose} />
      <div className="mbody">
        {subs.loading && !subs.data && <Loading />}
        {subs.data && !rows.length && <Empty icon={GraduationCap}>No one has submitted yet.</Empty>}
        {rows.map(s => {
          const sid = String(s.student?._id || s.student);
          const name = s.student?.firstName ? `${s.student.firstName} ${s.student.lastName}` : 'Student';
          return (
            <div className="trow qs-row" key={sid}>
              <span className="av" aria-hidden="true">{initials(name)}</span>
              <div className="lmain"><b>{name}</b><small>Submitted {fmtDateTime(s.submissionDate)}</small></div>
              {(s.submission?.attachments || []).map(f => (
                <button key={f.filename} type="button" className="btn o sm" onClick={() => downloadFile(`${API_ENDPOINTS.QUIZZES}/${quiz._id}/submissions/${sid}/download/${encodeURIComponent(f.filename)}`, f.originalName).catch(() => toast("Couldn't download"))}>
                  <Ic as={Paperclip} />{f.originalName}
                </button>
              ))}
              <input className="inp qs-score" type="number" min="0" max={quiz.maxScore} aria-label={`Score for ${name}`} value={scores[sid] ?? s.score ?? ''} onChange={e => setScores(x => ({ ...x, [sid]: e.target.value }))} />
              <button type="button" className="btn p sm" onClick={() => grade(s)}><Ic as={s.status === 'graded' ? CheckCircle2 : Download} />{s.status === 'graded' ? 'Update' : 'Grade'}</button>
            </div>
          );
        })}
        <div className="mfoot"><button type="button" className="btn o" onClick={onClose}><Ic as={X} />Close</button></div>
      </div>
    </Dialog>
  );
}
