import React, { useState } from 'react';
import { History, Key, ListChecks, Plus, Trash2, UserCog } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { DEFAULT_PERMISSIONS, GROUPS, LEVELS, levelLabel } from '../assistant/access';
import { dueInfo, sortTasks } from '../assistant/dashboardLogic';
import { FormDialog, Fld, apiError } from './modals/form';

const BASE = '/api/teacher/assistants';

const SELECT_STYLE = { flex: '0 0 160px', width: 160 };

/** Every portal section with one none / view / edit select per feature, and a "set all" select per section. */
function PermissionGrid({ value, onChange, disabled }) {
  const setAll = (group, level) => onChange({ ...value, ...Object.fromEntries(group.features.map(f => [f.id, level])) });
  return (
    <div className="tbl">
      {GROUPS.map(g => (
        <React.Fragment key={g.id}>
          <div className="trow" style={{ marginTop: 8, background: 'var(--s2)' }}>
            <div className="lmain" style={{ flex: '1 1 0', minWidth: 90 }}><b>{g.label}</b><small style={{ whiteSpace: 'normal' }}>{g.blurb}</small></div>
            <select className="inp sel-s" style={SELECT_STYLE} aria-label={`Set all ${g.label} access`} disabled={disabled} value="" onChange={e => e.target.value && setAll(g, e.target.value)}>
              <option value="">Set all…</option>
              {LEVELS.map(l => <option key={l} value={l}>{levelLabel(l)}</option>)}
            </select>
          </div>
          {g.features.map(f => (
            <div className="trow" key={f.id} style={{ paddingLeft: 20 }}>
              <div className="lmain" style={{ flex: '1 1 0', minWidth: 90 }}><b>{f.label}</b><small style={{ whiteSpace: 'normal' }}>{f.blurb}</small></div>
              <select className="inp sel-s" style={SELECT_STYLE} aria-label={`${f.label} access`} disabled={disabled} value={value[f.id] || 'none'} onChange={e => onChange({ ...value, [f.id]: e.target.value })}>
                {LEVELS.map(l => <option key={l} value={l}>{levelLabel(l)}</option>)}
              </select>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function CreateDialog({ open, onClose, onDone }) {
  const toast = useToast();
  const blank = { firstName: '', lastName: '', email: '', password: '', permissions: DEFAULT_PERMISSIONS };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(BASE, form);
      toast('Assistant created. Share the email and password with them.');
      setForm(blank);
      onDone();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={UserCog} title="New assistant" sub="They sign in on the normal sign-in page" submitLabel="Create assistant" busy={busy} error={error} onSubmit={submit}
      disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || form.password.length < 6}>
      <Fld label="First name"><input className="inp" value={form.firstName} onChange={set('firstName')} autoComplete="off" /></Fld>
      <Fld label="Last name"><input className="inp" value={form.lastName} onChange={set('lastName')} autoComplete="off" /></Fld>
      <Fld label="Email"><input className="inp" type="email" value={form.email} onChange={set('email')} autoComplete="off" /></Fld>
      <Fld label="Temporary password (6+ characters)"><input className="inp" type="text" value={form.password} onChange={set('password')} autoComplete="new-password" /></Fld>
      <PermissionGrid value={form.permissions} onChange={permissions => setForm(f => ({ ...f, permissions }))} />
    </FormDialog>
  );
}

function ResetDialog({ assistant, onClose, onDone }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`${BASE}/${assistant._id}/reset-password`, { password });
      toast('Password reset. They are signed out everywhere.');
      setPassword('');
      onDone();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormDialog open={!!assistant} onClose={onClose} icon={Key} title="Reset password" sub={assistant ? `${assistant.firstName} ${assistant.lastName}` : ''} submitLabel="Reset password" busy={busy} error={error} onSubmit={submit} disabled={password.length < 6}>
      <Fld label="New password (6+ characters)"><input className="inp" type="text" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></Fld>
    </FormDialog>
  );
}

function AssistantCard({ a, onChanged, onReset }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [perms, setPerms] = useState(a.permissions);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(perms) !== JSON.stringify(a.permissions);

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(ok);
      onChanged();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete ${a.firstName}?`, body: 'Their account is removed and they are signed out. Their past activity stays in the log.', confirmLabel: 'Delete' }))) return;
    run(() => api.del(`${BASE}/${a._id}`), 'Assistant deleted');
  };

  return (
    <section className="card set-card" aria-label={`${a.firstName} ${a.lastName}`}>
      <h3><Ic as={UserCog} />{a.firstName} {a.lastName} {!a.isActive && <span className="chip c-gy">Suspended</span>}</h3>
      <p className="sub set-note">{a.email} · {a.lastLogin ? `last signed in ${fmtDateTime(a.lastLogin)}` : 'has not signed in yet'}</p>
      <PermissionGrid value={perms} onChange={setPerms} disabled={busy} />
      <div className="inl" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn p sm" disabled={busy || !dirty} onClick={() => run(() => api.put(`${BASE}/${a._id}`, { permissions: perms }), 'Access saved')}>Save access</button>
        <button type="button" className="btn o sm" disabled={busy} onClick={() => run(() => api.put(`${BASE}/${a._id}`, { isActive: !a.isActive }), a.isActive ? 'Assistant suspended' : 'Assistant reactivated')}>{a.isActive ? 'Suspend' : 'Reactivate'}</button>
        <button type="button" className="btn o sm" disabled={busy} onClick={() => onReset(a)}><Ic as={Key} />Reset password</button>
        <button type="button" className="btn o sm dng" disabled={busy} onClick={remove}><Ic as={Trash2} />Delete</button>
      </div>
    </section>
  );
}

/** To-dos for assistants: shown on their dashboard, ticked off by them. */
function TasksPanel({ assistants }) {
  const toast = useToast();
  const tasks = useApi(`${BASE}/tasks`, b => b.data?.tasks || []);
  const blank = { title: '', note: '', dueDate: '', assignee: '' };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      tasks.reload();
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post(`${BASE}/tasks`, { ...form, dueDate: form.dueDate || null, assignee: form.assignee || null });
      setForm(blank);
    });
  };
  const status = (t) => (t.done ? `done${t.doneByName ? ` by ${t.doneByName}` : ''}` : dueInfo(t).label);

  return (
    <section className="card set-card" aria-labelledby="as-tasks">
      <h3 id="as-tasks"><Ic as={ListChecks} />Tasks for assistants</h3>
      <p className="sub set-note">Leave a to-do for everyone or one assistant. It shows on their dashboard and you can see who ticked it off.</p>
      <form onSubmit={add} className="inl" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <input className="inp" style={{ flex: '2 1 200px' }} placeholder="What needs doing?" aria-label="Task title" value={form.title} onChange={set('title')} maxLength={140} />
        <input className="inp" style={{ flex: '2 1 200px' }} placeholder="Note (optional)" aria-label="Task note" value={form.note} onChange={set('note')} maxLength={1000} />
        <input className="inp" style={{ flex: '0 1 150px' }} type="date" aria-label="Due date" value={form.dueDate} onChange={set('dueDate')} />
        <select className="inp" style={{ flex: '0 1 170px' }} aria-label="Assign to" value={form.assignee} onChange={set('assignee')}>
          <option value="">Any assistant</option>
          {assistants.map(a => <option key={a._id} value={a._id}>{a.firstName} {a.lastName}</option>)}
        </select>
        <button className="btn p sm" disabled={busy || !form.title.trim()}><Ic as={Plus} />Add task</button>
      </form>
      {tasks.data && !tasks.data.length && <Empty icon={ListChecks}>No tasks yet.</Empty>}
      <div className="tbl">
        {sortTasks(tasks.data || []).map(t => (
          <div className="trow" key={t._id}>
            <div className="lmain" style={{ flex: '1 1 0', minWidth: 90 }}>
              <b style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</b>
              <small style={{ whiteSpace: 'normal' }}>{t.assigneeName || 'Any assistant'} · {status(t)}</small>
            </div>
            <button type="button" className="btn o sm" disabled={busy} onClick={() => run(() => api.put(`${BASE}/tasks/${t._id}`, { done: !t.done }))}>{t.done ? 'Reopen' : 'Mark done'}</button>
            <button type="button" className="ib sm dng" disabled={busy} aria-label={`Delete ${t.title}`} onClick={() => run(() => api.del(`${BASE}/tasks/${t._id}`))}><Ic as={Trash2} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

const describe = (e) => `${e.method} ${e.path}`;

function ActivityLog() {
  const log = useApi(`${BASE}/audit?limit=50`, b => b.data?.entries || []);
  return (
    <section className="card set-card" aria-labelledby="as-log">
      <h3 id="as-log"><Ic as={History} />Assistant activity</h3>
      <p className="sub set-note">Every change an assistant makes, and every change they tried that was blocked. The newest 50 are shown.</p>
      {log.loading && !log.data && <Loading label="Loading activity…" />}
      {log.error && <ErrorNote error={log.error} onRetry={log.reload} />}
      {log.data && !log.data.length && <Empty icon={History}>Nothing yet.</Empty>}
      <div className="tbl">
        {(log.data || []).map(e => (
          <div className="trow" key={e._id}>
            <div className="lmain"><b>{e.assistant}</b><small className="mono">{describe(e)}</small></div>
            <span className={`chip ${e.allowed ? 'c-pr' : 'c-gy'}`}>{e.allowed ? 'Done' : 'Blocked'}</span>
            <small>{fmtDateTime(e.createdAt)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Settings → Assistants: create staff accounts, choose what each may see or change, suspend, reset, delete, review activity. */
export default function AssistantsSettings() {
  const list = useApi(BASE, b => b.data?.assistants || []);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(null);

  return (
    <>
      <section className="card set-card" aria-labelledby="as-head">
        <h3 id="as-head"><Ic as={UserCog} />Assistants</h3>
        <p className="sub set-note">Assistants help you run the portal. They never see payments, contact details, registrations, leads or settings, and each only gets the areas you choose. Chat replies go out under your name.</p>
        <button type="button" className="btn p sm" onClick={() => setCreating(true)}><Ic as={Plus} />New assistant</button>
      </section>
      {list.loading && !list.data && <Loading label="Loading assistants…" />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && !list.data.length && <Empty icon={UserCog}>No assistants yet.</Empty>}
      {(list.data || []).map(a => <AssistantCard key={`${a._id}-${JSON.stringify(a.permissions)}-${a.isActive}`} a={a} onChanged={list.reload} onReset={setResetting} />)}
      <TasksPanel assistants={list.data || []} />
      <ActivityLog />
      <CreateDialog open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); }} />
      <ResetDialog assistant={resetting} onClose={() => setResetting(null)} onDone={() => { setResetting(null); list.reload(); }} />
    </>
  );
}
