import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Users } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Accordion } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { WEEK, toMinutes } from '../../student/scheduleUtils';
import { FormDialog, Fld, apiError, announceChange } from './form';
import StudentChecklist from './StudentChecklist';

const TYPES = ['theory', 'practical', 'revision', 'quiz'];
const blankSession = () => ({ startTime: '19:00', endTime: '20:30', type: 'theory', topic: '', isActive: true });

/** "7:00 PM" → "19:00" for <input type="time">. */
const to24 = (t) => {
  const m = toMinutes(t);
  return m === null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Schedule builder: 7 day accordions, each with sessions (start, end, type, topic). */
export function ScheduleModal({ open, onClose, schedule }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState({});
  const [openDays, setOpenDays] = useState(() => new Set());
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const map = Object.fromEntries(WEEK.map(d => [d, []]));
    (schedule?.schedule || []).forEach(d => {
      map[d.day] = (d.sessions || []).map(s => ({ ...s, startTime: to24(s.startTime), endTime: to24(s.endTime) }));
    });
    setTitle(schedule?.title || 'New schedule');
    setNotes(schedule?.notes || '');
    setDays(map);
    setOpenDays(new Set(WEEK.filter(d => map[d].length)));
    setErrors({});
  }, [open, schedule]);

  const update = (day, i, patch) => setDays(d => ({ ...d, [day]: d[day].map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  const add = (day) => {
    setDays(d => ({ ...d, [day]: [...d[day], blankSession()] }));
    setOpenDays(o => new Set(o).add(day));
  };
  const remove = (day, i) => setDays(d => ({ ...d, [day]: d[day].filter((_, k) => k !== i) }));
  const toggleDay = (day, isOpen) => setOpenDays(o => { const n = new Set(o); isOpen ? n.add(day) : n.delete(day); return n; });

  const submit = async () => {
    const all = WEEK.flatMap(d => days[d].map(s => ({ ...s, day: d })));
    const e = {};
    if (!title.trim()) e.title = 'Give the schedule a name';
    if (all.some(s => !s.startTime || !s.endTime)) e.form = 'Every session needs a start and end time';
    else if (all.some(s => toMinutes(s.endTime) <= toMinutes(s.startTime))) e.form = 'A session ends before it starts';
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: title.trim(),
      notes: notes.trim(),
      schedule: WEEK.map(day => ({
        day,
        sessions: days[day].map(s => ({ startTime: s.startTime, endTime: s.endTime, type: s.type, topic: s.topic.trim() || `${s.type[0].toUpperCase()}${s.type.slice(1)} session`, isActive: s.isActive !== false }))
      }))
    };
    setBusy(true);
    try {
      if (schedule) await api.put(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${schedule._id}`, body);
      else await api.post(API_ENDPOINTS.SCHEDULE.SCHEDULES, body);
      toast('Schedule saved');
      announceChange('schedule');
      onClose();
    } catch (err) {
      setErrors({ form: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={CalendarDays} title={schedule ? 'Edit schedule' : 'Create schedule'} size="wide" submitLabel={schedule ? 'Save schedule' : 'Create schedule'} busy={busy} error={errors.form} onSubmit={submit}>
      <div className="r2">
        <Fld label="Schedule name *" error={errors.title}><input className="inp" value={title} onChange={e => setTitle(e.target.value)} /></Fld>
        <Fld label="Notes (optional)"><input className="inp" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes" /></Fld>
      </div>
      {WEEK.map(day => {
        const list = days[day] || [];
        return (
          <Accordion
            key={day}
            open={openDays.has(day)}
            onToggle={o => toggleDay(day, o)}
            head={
              <>
                <span className="n day-n">{day.slice(0, 3)}</span>
                <span><h4>{day}</h4><small>{list.length ? `${list.length} session${list.length > 1 ? 's' : ''}` : 'No sessions'}</small></span>
              </>
            }
          >
            {list.map((s, i) => (
              <div className="ses" key={i}>
                <Fld label="Start"><input className="inp" type="time" value={s.startTime} onChange={e => update(day, i, { startTime: e.target.value })} /></Fld>
                <Fld label="End"><input className="inp" type="time" value={s.endTime} onChange={e => update(day, i, { endTime: e.target.value })} /></Fld>
                <Fld label="Type"><select className="inp" value={s.type} onChange={e => update(day, i, { type: e.target.value })}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Fld>
                <Fld label="Topic"><input className="inp" value={s.topic} onChange={e => update(day, i, { topic: e.target.value })} placeholder="e.g. Chapter 4" /></Fld>
                <button type="button" className="btn o sm dng" onClick={() => remove(day, i)} aria-label={`Remove ${day} session ${i + 1}`}>Remove</button>
              </div>
            ))}
            <div className="ses-add"><button type="button" className="btn g sm" onClick={() => add(day)}><Plus className="i" aria-hidden="true" />Add session</button></div>
          </Accordion>
        );
      })}
    </FormDialog>
  );
}

/** Assign students to a schedule: search, select all, live count. */
export function AssignStudentsModal({ open, onClose, schedule }) {
  const toast = useToast();
  const [chosen, setChosen] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setChosen(new Set((schedule?.assignedStudents || []).map(a => String(a.student?._id || a.student))));
      setError('');
    }
  }, [open, schedule]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`${API_ENDPOINTS.SCHEDULE.SCHEDULES}/${schedule._id}/assign-students`, { studentIds: [...chosen] });
      toast(`Assigned ${chosen.size} student${chosen.size === 1 ? '' : 's'}`);
      announceChange('schedule');
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={Users} title="Assign students" sub={schedule ? `Schedule: ${schedule.title}` : ''} submitLabel={`Assign ${chosen.size} student${chosen.size === 1 ? '' : 's'}`} busy={busy} error={error} onSubmit={submit}>
      <StudentChecklist chosen={chosen} onChange={setChosen} height={340} />
    </FormDialog>
  );
}
