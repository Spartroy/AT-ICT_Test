import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Download, ClipboardCheck, GraduationCap, FileBarChart, Plus, ChevronRight, Trash2, Trophy } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, Seg, fmtDate } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { useTeacherChange, apiError } from './modals/form';
import { lessonLabel } from './curriculum';
import Submissions from './work/Submissions';
import Reports from './work/Reports';
import PracticalSubmissions from './work/PracticalSubmissions';
import QuizLibrary from '../quiz/QuizLibrary';
import '../../components/reports/reports.css';

const TABS = ['submissions', 'assignments', 'quizzes', 'practicals', 'reports'];
const TAB_FEATURE = { submissions: 'submissions', assignments: 'homework', quizzes: 'quizzes', practicals: 'submissions', reports: 'submissions' };

export default function Work() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, counts, openModal, can } = useTeacher();
  // Each tab is its own feature for assistants
  const allowed = TABS.filter(t => can(TAB_FEATURE[t]));
  if (!allowed.includes(tab)) return <Navigate to={`${base}/work/${allowed[0] || 'submissions'}`} replace />;

  return (
    <>
      <PageHead
        title="Work"
        actions={(
          <>
            {can('quizzes', 'edit') && <button type="button" className="btn o" onClick={() => openModal('quiz')}><Ic as={GraduationCap} />Create quiz</button>}
            {can('homework', 'edit') && <button type="button" className="btn p" onClick={() => openModal('hw')}><Ic as={Plus} />Create H.W</button>}
          </>
        )}
      />
      <Seg
        tabs={[
          { id: 'submissions', label: 'Submissions', icon: Download, count: counts.needsGrading || '' },
          { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
          { id: 'quizzes', label: 'Quizzes', icon: GraduationCap },
          { id: 'practicals', label: 'Practicals', icon: Trophy },
          { id: 'reports', label: 'Weekly reports', icon: FileBarChart }
        ].filter(t => allowed.includes(t.id))}
        value={tab}
        onChange={id => navigate(`${base}/work/${id}`)}
        label="Work sections"
      />
      {tab === 'submissions' && <Submissions />}
      {tab === 'practicals' && <PracticalSubmissions />}
      {tab === 'assignments' && <AssignmentTable />}
      {tab === 'quizzes' && <QuizLibrary canEdit={can('quizzes', 'edit')} />}
      {tab === 'reports' && <Reports />}
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
                <span className="tchips">
                  <span className={`chip ${a.section === 'theory' ? 'c-th' : 'c-pr'}`}>{a.section}</span>
                  <span className="chip c-gy hide-sm">{a.type}</span>
                  <span className="tcount"><b>{handed.length}</b> submitted</span>
                  {toGrade ? <span className="chip c-am">{toGrade} to grade</span> : <span className="chip c-gy">—</span>}
                </span>
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
