import React, { useEffect, useState } from 'react';
import { BellRing, Plus, Trash2 } from 'lucide-react';
import { Ic } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { UNITS, splitMinutes, toMinutes } from './notificationUnits';

const ZONES = ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Amman', 'Asia/Kuwait', 'Europe/London', 'UTC'];
const MAX_REMINDERS = 4;

/** Teacher settings card: what gets sent, when reminders go out, the daily digest and quiet hours. */
export default function NotificationSettings({ settings, save, reload }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const n = settings?.notifications;
    if (!n) return;
    setForm({
      studentsCanChoose: n.studentsCanChoose,
      categories: { ...n.categories },
      reminders: n.homeworkReminders.map(m => ({ ...splitMinutes(m), key: m })),
      classReminderMinutes: String(n.classReminderMinutes),
      digest: { ...n.digest },
      quietHours: { ...n.quietHours },
      timezone: n.timezone
    });
  }, [settings?.notifications]);

  if (!form) return null;
  const types = settings.notificationTypes || [];
  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const setReminder = (i, patch) => setForm(f => ({ ...f, reminders: f.reminders.map((r, k) => (k === i ? { ...r, ...patch } : r)) }));

  const submit = async () => {
    const homeworkReminders = form.reminders.map(toMinutes);
    const classMin = Number(form.classReminderMinutes);
    const msg = homeworkReminders.some(Number.isNaN) ? 'Every homework reminder needs a whole number, e.g. 2 hours.'
      : !Number.isInteger(classMin) ? 'Class reminders need a whole number of minutes.' : '';
    setProblem(msg);
    if (msg) return;
    setSaving(true);
    const res = await save({
      notifications: {
        studentsCanChoose: form.studentsCanChoose,
        categories: form.categories,
        homeworkReminders,
        classReminderMinutes: classMin,
        digest: form.digest,
        quietHours: form.quietHours,
        timezone: form.timezone.trim()
      }
    });
    setSaving(false);
    if (res.ok) { toast('Notification settings saved'); reload(); } else setProblem(res.errors?.[0]?.msg || res.message || "Couldn't save the notification settings.");
  };

  const sendTest = async () => {
    try { await api.post(API_ENDPOINTS.NOTIFICATIONS.TEST); toast('Test sent to your devices.'); } catch { toast("Couldn't send a test notification."); }
  };

  const group = (audience, title) => (
    <fieldset className="set-nt-group">
      <legend>{title}</legend>
      {types.filter(t => t.audience === audience).map(t => (
        <label key={t.id} className="cbx"><input type="checkbox" checked={form.categories[t.id] !== false} onChange={e => set({ categories: { ...form.categories, [t.id]: e.target.checked } })} />{t.label}</label>
      ))}
    </fieldset>
  );

  return (
    <section className="card set-card" aria-labelledby="set-notify">
      <h3 id="set-notify"><Ic as={BellRing} />Notifications</h3>
      <p className="sub set-note">Push notifications on phones and computers, plus the bell in the portal. People turn them on from the bell; this page decides what is sent and when. Times use the time zone below.</p>

      <label className="cbx set-nt-main"><input type="checkbox" checked={form.studentsCanChoose} onChange={e => set({ studentsCanChoose: e.target.checked })} />Students can choose which notifications they get<small className="sub">If off, every type that is switched on below is sent to all students.</small></label>

      <div className="set-nt-groups">
        {group('student', 'Students receive')}
        {group('teacher', 'You receive')}
      </div>

      <h4 className="set-sub">Homework reminders</h4>
      <p className="sub set-note">Sent before the deadline to students who haven't handed in. The nearest time that applies is used, so nobody gets two at once.</p>
      {form.reminders.map((r, i) => (
        <div className="set-nt-row" key={r.key + String(i)}>
          <input className="inp" type="number" min="1" value={r.value} aria-label={`Reminder ${i + 1} amount`} onChange={e => setReminder(i, { value: e.target.value })} />
          <select className="inp" value={r.unit} aria-label={`Reminder ${i + 1} unit`} onChange={e => setReminder(i, { unit: e.target.value })}>
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
          <span className="sub">before the deadline</span>
          <button type="button" className="ib sm dng" aria-label={`Remove reminder ${i + 1}`} onClick={() => set({ reminders: form.reminders.filter((_, k) => k !== i) })}><Ic as={Trash2} /></button>
        </div>
      ))}
      {form.reminders.length < MAX_REMINDERS && (
        <button type="button" className="btn o sm" onClick={() => set({ reminders: [...form.reminders, { value: '1', unit: 'hours', key: `new${form.reminders.length}` }] })}><Ic as={Plus} />Add reminder</button>
      )}

      <h4 className="set-sub">Class reminder</h4>
      <div className="set-nt-row">
        <input className="inp" type="number" min="5" max="240" value={form.classReminderMinutes} aria-label="Minutes before class" onChange={e => set({ classReminderMinutes: e.target.value })} />
        <span className="sub">minutes before a class starts</span>
      </div>

      <h4 className="set-sub">Your daily digest</h4>
      <div className="set-nt-row">
        <label className="cbx"><input type="checkbox" checked={form.digest.enabled} onChange={e => set({ digest: { ...form.digest, enabled: e.target.checked } })} />Send it at</label>
        <input className="inp" type="time" value={form.digest.time} disabled={!form.digest.enabled} aria-label="Digest time" onChange={e => set({ digest: { ...form.digest, time: e.target.value } })} />
        <span className="sub">Pending registrations and submissions to grade (skipped on days with nothing).</span>
      </div>

      <h4 className="set-sub">Quiet hours</h4>
      <div className="set-nt-row">
        <label className="cbx"><input type="checkbox" checked={form.quietHours.enabled} onChange={e => set({ quietHours: { ...form.quietHours, enabled: e.target.checked } })} />No pushes from</label>
        <input className="inp" type="time" value={form.quietHours.start} disabled={!form.quietHours.enabled} aria-label="Quiet hours start" onChange={e => set({ quietHours: { ...form.quietHours, start: e.target.value } })} />
        <span className="sub">to</span>
        <input className="inp" type="time" value={form.quietHours.end} disabled={!form.quietHours.enabled} aria-label="Quiet hours end" onChange={e => set({ quietHours: { ...form.quietHours, end: e.target.value } })} />
        <span className="sub">Held-back notifications are sent when quiet hours end.</span>
      </div>

      <h4 className="set-sub">Time zone</h4>
      <div className="set-nt-row">
        <input className="inp" list="nt-zones" value={form.timezone} aria-label="Time zone" onChange={e => set({ timezone: e.target.value })} />
        <datalist id="nt-zones">{ZONES.map(z => <option key={z} value={z} />)}</datalist>
        <span className="sub">Class times, the digest and quiet hours use this zone.</span>
      </div>

      {problem && <p className="fld-err" role="alert">{problem}</p>}
      <div className="mfoot" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="btn p" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save notification settings'}</button>
        <button type="button" className="btn o" onClick={sendTest}>Send me a test</button>
      </div>
    </section>
  );
}
