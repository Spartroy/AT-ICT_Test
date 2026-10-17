import React, { useEffect, useMemo, useState } from 'react';
import { Video, ClipboardCheck, Check, X } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Dialog, DialogHeader, useToast } from '../../../components/portal/PortalUI';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../../components/portal/kit';
import { WEEK, shortTime, toMinutes } from '../../student/scheduleUtils';
import { ChoiceRow, FormDialog, Fld, announceChange, apiError, toLocalInput } from './form';

const TYPES = ['theory', 'practical', 'revision', 'quiz'].map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

/** The next date this weekday + clock time happens (today counts while it is still ahead). */
function nextOccurrence(day, startTime) {
  const mins = toMinutes(startTime);
  const idx = WEEK.indexOf(day);
  if (mins === null || idx < 0) return null;
  const now = new Date();
  const d = new Date(now);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  const today = (now.getDay() + 6) % 7;
  let ahead = (idx - today + 7) % 7;
  if (ahead === 0 && d <= now) ahead = 7;
  d.setDate(d.getDate() + ahead);
  return d;
}

const blank = () => ({ title: '', topic: '', type: 'theory', notes: '', meetingUrl: '', when: 'now', startsAt: '', durationMin: 90, slotKey: '', onlyAssigned: true });

/** Start a class now or schedule one; optionally tie it to a slot of the weekly timetable. */
export function LiveSessionModal({ open, onClose, session }) {
  const toast = useToast();
  const schedules = useApi(open ? API_ENDPOINTS.SCHEDULE.SCHEDULES : null, b => b.data?.schedules || []);
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const slots = useMemo(() => (schedules.data || []).flatMap(s => (s.schedule || []).flatMap(d => (d.sessions || [])
    .filter(x => x.isActive !== false)
    .map((x, i) => ({ key: `${s._id}|${d.day}|${x.startTime}|${i}`, scheduleId: s._id, scheduleTitle: s.title, day: d.day, startTime: x.startTime, topic: x.topic, type: x.type })))), [schedules.data]);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (!session) { setF(blank()); return; }
    setF({
      title: session.title, topic: session.topic || '', type: session.type, notes: session.notes || '', meetingUrl: session.meetingUrl || '',
      when: 'later', startsAt: toLocalInput(session.startsAt), durationMin: session.durationMin || 90,
      slotKey: '', onlyAssigned: true
    });
  }, [open, session]);

  const set = (patch) => setF(x => ({ ...x, ...patch }));
  const pickSlot = (key) => {
    const slot = slots.find(s => s.key === key);
    if (!slot) { set({ slotKey: '' }); return; }
    const at = nextOccurrence(slot.day, slot.startTime);
    set({
      slotKey: key,
      type: slot.type || f.type,
      topic: f.topic || slot.topic || '',
      title: f.title || slot.topic || `${slot.day} class`,
      ...(at ? { when: 'later', startsAt: toLocalInput(at) } : {})
    });
  };

  const submit = async () => {
    if (!f.title.trim()) { setError('Give the session a title'); return; }
    if (!/^https?:\/\//i.test(f.meetingUrl.trim())) { setError('Paste the meeting link (Zoom, Google Meet…) starting with https://'); return; }
    if (f.when === 'later' && !f.startsAt) { setError('Pick when the session starts'); return; }
    const slot = slots.find(s => s.key === f.slotKey);
    const body = {
      title: f.title.trim(), topic: f.topic.trim(), type: f.type, notes: f.notes.trim(), meetingUrl: f.meetingUrl.trim(), durationMin: Number(f.durationMin) || 90,
      startsAt: f.when === 'later' ? new Date(f.startsAt).toISOString() : undefined,
      ...(slot ? { scheduleId: slot.scheduleId, day: slot.day, startTime: slot.startTime, slotTopic: slot.topic, onlyAssigned: f.onlyAssigned } : {})
    };
    setBusy(true);
    try {
      if (session) await api.put(`${API_ENDPOINTS.TEACHER_LIVE}/${session.id}`, body);
      else await api.post(API_ENDPOINTS.TEACHER_LIVE, { ...body, startNow: f.when === 'now' });
      toast(session ? 'Session saved' : f.when === 'now' ? 'Session is live: students were notified' : 'Session scheduled');
      announceChange('live');
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={Video} title={session ? 'Edit live session' : 'New live session'} sub="Students join through their portal, so entry is recorded automatically" size="wide" submitLabel={session ? 'Save' : f.when === 'now' ? 'Go live' : 'Schedule'} busy={busy} error={error} onSubmit={submit}>
      <div className="lv-grid">
        {!session && (
          <ChoiceRow title="When" value={f.when} onChange={when => set({ when })} options={[{ value: 'now', label: 'Start now' }, { value: 'later', label: 'Schedule for later' }]} />
        )}
        <Fld label="From my timetable (optional)" className="lv-wide">
          <select value={f.slotKey} onChange={e => pickSlot(e.target.value)} disabled={schedules.loading && !schedules.data}>
            <option value="">Not linked to a timetable slot</option>
            {slots.map(s => <option key={s.key} value={s.key}>{s.day} {shortTime(s.startTime)} · {s.topic || s.type} ({s.scheduleTitle})</option>)}
          </select>
        </Fld>
        {f.slotKey && (
          <label className="cb lv-wide"><input type="checkbox" checked={f.onlyAssigned} onChange={e => set({ onlyAssigned: e.target.checked })} /><span /> Only students assigned to this schedule</label>
        )}
        <Fld label="Title"><input value={f.title} maxLength={140} onChange={e => set({ title: e.target.value })} placeholder="e.g. Databases: revision class" /></Fld>
        <Fld label="Topic"><input value={f.topic} maxLength={200} onChange={e => set({ topic: e.target.value })} placeholder="What the class covers" /></Fld>
        <ChoiceRow title="Type" value={f.type} onChange={type => set({ type })} options={TYPES} />
        <Fld label="Meeting link" className="lv-wide"><input type="url" inputMode="url" value={f.meetingUrl} onChange={e => set({ meetingUrl: e.target.value })} placeholder="https://zoom.us/j/… or https://meet.google.com/…" /></Fld>
        {f.when === 'later' && (
          <>
            <Fld label="Starts"><input type="datetime-local" value={f.startsAt} onChange={e => set({ startsAt: e.target.value })} /></Fld>
            <Fld label="Length (minutes)"><input type="number" min="10" max="480" step="5" value={f.durationMin} onChange={e => set({ durationMin: e.target.value })} /></Fld>
          </>
        )}
        <Fld label="Lesson content shown to students (optional)" className="lv-wide"><textarea rows={3} maxLength={2000} value={f.notes} onChange={e => set({ notes: e.target.value })} placeholder="Agenda, what to bring, which notes to open first…" /></Fld>
      </div>
    </FormDialog>
  );
}

/** Who entered the session, and when; students who haven't are listed below. */
export function AttendanceModal({ open, onClose, session }) {
  const url = open && session ? `${API_ENDPOINTS.TEACHER_LIVE}/${session.id}/attendance` : null;
  const att = useApi(url, b => b.data);
  // Refresh while the class is running so the teacher sees people arrive.
  useEffect(() => {
    if (!open || session?.status !== 'live') return undefined;
    const t = setInterval(att.reload, 15000);
    return () => clearInterval(t);
  }, [open, session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const d = att.data;
  const joined = (d?.students || []).filter(s => s.joined);
  const missing = (d?.students || []).filter(s => !s.joined);
  return (
    <Dialog open={open} onClose={onClose} labelledBy="att-title">
      <DialogHeader id="att-title" icon={ClipboardCheck} title="Attendance" sub={session ? `${session.title} · ${fmtDateTime(session.startedAt || session.startsAt)}` : ''} onClose={onClose} />
      <div className="mbody">
        {att.loading && !d && <Loading label="Loading attendance…" />}
        {att.error && <ErrorNote error={att.error} onRetry={att.reload} />}
        {d && (
          <>
            <p className="lv-sum"><b>{d.joined}</b> of {d.total} students entered{session?.status === 'live' ? ' · updating live' : ''}</p>
            {d.total === 0 && <Empty icon={ClipboardCheck}>No students to track yet.</Empty>}
            <ul className="lv-att">
              {joined.map(s => (
                <li key={s.id}><span className="lv-ok"><Ic as={Check} /></span><div><b>{s.name}</b><small>Entered {fmtDateTime(s.firstJoinedAt)}{s.joins > 1 ? ` · rejoined ${s.joins - 1}×` : ''}</small></div></li>
              ))}
              {missing.map(s => (
                <li className="no" key={s.id}><span className="lv-no"><Ic as={X} /></span><div><b>{s.name}</b><small>Did not enter</small></div></li>
              ))}
            </ul>
          </>
        )}
        <div className="mfoot"><button type="button" className="btn o" onClick={onClose}>Close</button></div>
      </div>
    </Dialog>
  );
}
