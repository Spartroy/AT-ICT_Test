import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { List, CalendarDays, Plus, Pencil, Trash2, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, Seg } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { WEEK, weekFromSchedule, shortTime } from '../student/scheduleUtils';
import { useTeacher } from './TeacherPortal';
import { apiError, useTeacherChange } from './modals/form';

export default function Schedule() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, openModal } = useTeacher();
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi(API_ENDPOINTS.SCHEDULE.SCHEDULES, b => b.data?.schedules || []);
  useTeacherChange('schedule', list.reload);

  const schedules = useMemo(() => list.data || [], [list.data]);
  // Weekly view merges every schedule's sessions per day.
  const week = useMemo(() => WEEK.map((_, i) => schedules.flatMap(s => weekFromSchedule(s)[i].map(x => ({ ...x, schedule: s.title })))), [schedules]);
  if (!['list', 'week'].includes(tab)) return <Navigate to={`${base}/schedule/list`} replace />;
  const todayIdx = (new Date().getDay() + 6) % 7;

  const remove = async (s) => {
    if (!(await confirm({ title: `Delete “${s.title}”?`, body: 'Students assigned to it lose their timetable.', confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${s._id}`);
      toast('Schedule deleted');
      list.reload();
    } catch (err) { toast(apiError(err)); }
  };


  return (
    <>
      <PageHead eyebrow="Class timetable" title="Schedule" actions={<button type="button" className="btn p" onClick={() => openModal('schedule')}><Ic as={Plus} />New schedule</button>} />
      <Seg tabs={[{ id: 'list', label: 'Schedules', icon: List, count: schedules.length }, { id: 'week', label: 'Weekly view', icon: CalendarDays }]} value={tab} onChange={id => navigate(`${base}/schedule/${id}`)} label="Schedule views" />
      {list.loading && !list.data && <Loading label="Loading schedules…" />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && tab === 'list' && (
        schedules.length ? (
          <div className="sch-g2">
            {schedules.map(s => {
              const sessions = (s.schedule || []).flatMap(d => (d.sessions || []).map(x => ({ ...x, day: d.day })));
              const days = WEEK.filter(d => sessions.some(x => x.day === d));
              const students = (s.assignedStudents || []).map(a => a.student).filter(Boolean);
              return (
                <div className="card" key={s._id}>
                  <div className="sch-head">
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{s.title}</h3>
                    <span className="lact">
                      <button type="button" className="ib sm" aria-label={`Edit ${s.title}`} onClick={() => openModal('schedule', { schedule: s })}><Ic as={Pencil} /></button>
                      <button type="button" className="ib sm dng" aria-label={`Delete ${s.title}`} onClick={() => remove(s)}><Ic as={Trash2} /></button>
                    </span>
                  </div>
                  <div className="tags2">
                    <span className="chip c-gy">{sessions.length} sessions</span>
                    <span className="chip c-gy">{students.length} students</span>
                    {days.map(d => <span className="chip c-rd" key={d}>{d.slice(0, 3)}</span>)}
                  </div>
                  <div className="tags2">
                    {students.slice(0, 8).map(st => <span className="chip c-th" key={st._id || st}>{st.firstName ? `${st.firstName} ${st.lastName}` : 'Student'}</span>)}
                    {students.length > 8 && <span className="chip c-gy">+{students.length - 8} more</span>}
                  </div>
                  <div className="mfoot" style={{ marginTop: 14, justifyContent: 'stretch' }}>
                    <button type="button" className="btn o" style={{ flex: 1 }} onClick={() => openModal('assign', { schedule: s })}><Ic as={Users} />Assign students</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="card"><Empty icon={CalendarDays}>No schedules yet. Create the first one.</Empty></div>
      )}
      {list.data && tab === 'week' && (
        <div className="card">
          <div className="week" id="wk2">
            {WEEK.map((d, i) => (
              <div className={`wd ${i === todayIdx ? 'today' : ''}`} key={d}>
                <small>{d.slice(0, 3)}</small>
                {week[i].length ? week[i].map((x, k) => (
                  <div className={`ev ${x.type === 'practical' ? 'pr' : 'th'}`} key={k} title={x.schedule}>
                    <b>{x.type}</b>{shortTime(x.startTime)}{x.topic ? <span className="ev-topic">{x.topic}</span> : null}
                  </div>
                )) : <span className="no" aria-label="No sessions">—</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
