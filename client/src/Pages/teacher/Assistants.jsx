import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Ban, Eye, History, Key, ListChecks, Pencil, PauseCircle, PlayCircle, Plus, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { Accordion, Empty, ErrorNote, Ic, Loading, PageHead, Seg, fmtDateTime, initials } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { DEFAULT_PERMISSIONS, GROUPS, LEVELS, levelLabel } from '../assistant/access';
import { dueInfo, sortTasks } from '../assistant/dashboardLogic';
import { FEATURE_ICONS, GROUP_ICONS } from '../assistant/featureIcons';
import { FormDialog, Fld, apiError } from './modals/form';
import { useTeacher } from './TeacherPortal';
import './assistants.css';

const BASE = '/api/teacher/assistants';
const TABS = ['people', 'tasks', 'activity'];
const LEVEL_ICON = { none: Ban, view: Eye, edit: Pencil };
const RANK = { none: 0, view: 1, edit: 2 };
const SHORT = { none: 'None', view: 'View', edit: 'Edit' };

/** None / View / Edit as three buttons. `value` may be '' (nothing selected), used by the "set all" control. */
function LevelControl({ value, onChange, disabled, label, small = false }) {
  return (
    <div className={`as-lv ${small ? 'sm' : ''}`} role="radiogroup" aria-label={label}>
      {LEVELS.map(l => (
        <button key={l} type="button" role="radio" aria-checked={value === l} aria-label={levelLabel(l)} title={levelLabel(l)} className={`${l} ${value === l ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(l)}>
          <Ic as={LEVEL_ICON[l]} /><span>{SHORT[l]}</span>
        </button>
      ))}
    </div>
  );
}

/** Every portal section with an icon, a "set all" control, and one none / view / edit control per feature. */
export function PermissionGrid({ value, onChange, disabled }) {
  const setAll = (group, level) => onChange({ ...value, ...Object.fromEntries(group.features.map(f => [f.id, level])) });
  return (
    <div className="as-grid">
      {GROUPS.map(g => {
        const GroupIcon = GROUP_ICONS[g.id];
        const levels = g.features.map(f => value[f.id] || 'none');
        const same = levels.every(l => l === levels[0]) ? levels[0] : '';
        return (
          <div className="as-group" key={g.id}>
            <div className="as-gh">
              <span className="as-ic"><Ic as={GroupIcon} /></span>
              <div className="as-t"><b>{g.label}</b><small>{g.blurb}</small></div>
              <div className="as-all"><span>All</span><LevelControl small value={same} disabled={disabled} label={`Set all ${g.label} access`} onChange={l => setAll(g, l)} /></div>
            </div>
            {g.features.map(f => {
              const FeatureIcon = FEATURE_ICONS[f.id];
              const level = value[f.id] || 'none';
              return (
                <div className={`as-row ${level}`} key={f.id}>
                  <span className="as-ic"><Ic as={FeatureIcon} /></span>
                  <div className="as-t"><b>{f.label}</b><small>{f.blurb}</small></div>
                  <LevelControl value={level} disabled={disabled} label={`${f.label} access`} onChange={l => onChange({ ...value, [f.id]: l })} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** One chip per section: its icon, name and the highest level the assistant has in it. */
function AccessSummary({ permissions }) {
  return (
    <div className="as-sum" aria-label="Access summary">
      {GROUPS.map(g => {
        const top = g.features.reduce((best, f) => (RANK[permissions[f.id]] > RANK[best] ? permissions[f.id] : best), 'none');
        const on = g.features.filter(f => permissions[f.id] && permissions[f.id] !== 'none').length;
        const Icon = GROUP_ICONS[g.id];
        return (
          <span key={g.id} className={`chip ${top === 'edit' ? 'c-pr' : top === 'view' ? 'c-am' : 'c-gy'}`}>
            <Icon aria-hidden="true" />{g.label}{top === 'none' ? ' · none' : ` · ${on}/${g.features.length}`}
          </span>
        );
      })}
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
    <FormDialog open={open} onClose={onClose} icon={UserCog} title="New assistant" sub="They sign in on the normal sign-in page" size="wide" submitLabel="Create assistant" busy={busy} error={error} onSubmit={submit}
      disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || form.password.length < 6}>
      <Fld label="First name"><input className="inp" value={form.firstName} onChange={set('firstName')} autoComplete="off" /></Fld>
      <Fld label="Last name"><input className="inp" value={form.lastName} onChange={set('lastName')} autoComplete="off" /></Fld>
      <Fld label="Email"><input className="inp" type="email" value={form.email} onChange={set('email')} autoComplete="off" /></Fld>
      <Fld label="Temporary password (6+ characters)"><input className="inp" type="text" value={form.password} onChange={set('password')} autoComplete="new-password" /></Fld>
      <h4 style={{ margin: '14px 0 8px' }}>What can they do?</h4>
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
  const name = `${a.firstName} ${a.lastName}`;

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
    <section className="card as-card" aria-label={name}>
      <div className="as-top">
        <span className="av" aria-hidden="true">{initials(name)}</span>
        <div className="as-t">
          <b>{name} {!a.isActive && <span className="chip c-gy">Suspended</span>}</b>
          <small>{a.email} · {a.lastLogin ? `last signed in ${fmtDateTime(a.lastLogin)}` : 'has not signed in yet'}</small>
        </div>
        <div className="as-acts">
          <button type="button" className="btn o sm" disabled={busy} onClick={() => run(() => api.put(`${BASE}/${a._id}`, { isActive: !a.isActive }), a.isActive ? 'Assistant suspended' : 'Assistant reactivated')}>
            <Ic as={a.isActive ? PauseCircle : PlayCircle} />{a.isActive ? 'Suspend' : 'Reactivate'}
          </button>
          <button type="button" className="btn o sm" disabled={busy} onClick={() => onReset(a)}><Ic as={Key} />Reset password</button>
          <button type="button" className="btn o sm dng" disabled={busy} onClick={remove}><Ic as={Trash2} />Delete</button>
        </div>
      </div>
      <AccessSummary permissions={a.permissions} />
      <Accordion head={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ic as={ShieldCheck} />Edit access</span>} defaultOpen={false}>
        <PermissionGrid value={perms} onChange={setPerms} disabled={busy} />
        <div className="as-acts" style={{ marginTop: 12 }}>
          <button type="button" className="btn p sm" disabled={busy || !dirty} onClick={() => run(() => api.put(`${BASE}/${a._id}`, { permissions: perms }), 'Access saved')}>Save access</button>
          {dirty && <button type="button" className="btn o sm" disabled={busy} onClick={() => setPerms(a.permissions)}>Undo changes</button>}
        </div>
      </Accordion>
    </section>
  );
}

function PeopleTab({ list, onNew, onReset }) {
  return (
    <>
      {list.loading && !list.data && <Loading label="Loading assistants…" />}
      {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
      {list.data && !list.data.length && (
        <div className="card">
          <Empty icon={UserCog}>No assistants yet. Add one and choose exactly what they can see or change.</Empty>
          <button type="button" className="btn p" onClick={onNew}><Ic as={Plus} />New assistant</button>
        </div>
      )}
      <div className="col-stack">
        {(list.data || []).map(a => <AssistantCard key={`${a._id}-${JSON.stringify(a.permissions)}-${a.isActive}`} a={a} onChanged={list.reload} onReset={onReset} />)}
      </div>
    </>
  );
}

/** To-dos for assistants: shown on their dashboard, ticked off by them. */
function TasksTab({ assistants }) {
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
      <form onSubmit={add} className="as-task-form">
        <input className="inp" placeholder="What needs doing?" aria-label="Task title" value={form.title} onChange={set('title')} maxLength={140} />
        <input className="inp" placeholder="Note (optional)" aria-label="Task note" value={form.note} onChange={set('note')} maxLength={1000} />
        <input className="inp" type="date" aria-label="Due date" value={form.dueDate} onChange={set('dueDate')} />
        <select className="inp" aria-label="Assign to" value={form.assignee} onChange={set('assignee')}>
          <option value="">Any assistant</option>
          {assistants.map(a => <option key={a._id} value={a._id}>{a.firstName} {a.lastName}</option>)}
        </select>
        <button className="btn p" disabled={busy || !form.title.trim()}><Ic as={Plus} />Add task</button>
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

function ActivityTab() {
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
            <div className="lmain"><b>{e.assistant}</b><small className="mono">{e.method} {e.path}</small></div>
            <span className={`chip ${e.allowed ? 'c-pr' : 'c-gy'}`}>{e.allowed ? 'Done' : 'Blocked'}</span>
            <small>{fmtDateTime(e.createdAt)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Teacher-only page: create assistants, choose what each may see or change, hand out tasks, review activity. */
export default function Assistants() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base } = useTeacher();
  const list = useApi(BASE, b => b.data?.assistants || []);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(null);
  if (!TABS.includes(tab)) return <Navigate to={`${base}/assistants/people`} replace />;

  return (
    <>
      <PageHead title="Assistants" actions={<button type="button" className="btn p" onClick={() => setCreating(true)}><Ic as={Plus} />New assistant</button>}>
        <p className="sub">Staff who help you run the portal. They never see payments, contact details, registrations, leads or settings. Chat replies go out under your name.</p>
      </PageHead>
      <Seg
        tabs={[
          { id: 'people', label: 'People', icon: Users, count: list.data?.length || '' },
          { id: 'tasks', label: 'Tasks', icon: ListChecks },
          { id: 'activity', label: 'Activity', icon: History }
        ]}
        value={tab}
        onChange={id => navigate(`${base}/assistants/${id}`)}
        label="Assistant sections"
      />
      {tab === 'people' && <PeopleTab list={list} onNew={() => setCreating(true)} onReset={setResetting} />}
      {tab === 'tasks' && <TasksTab assistants={list.data || []} />}
      {tab === 'activity' && <ActivityTab />}
      <CreateDialog open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); }} />
      <ResetDialog assistant={resetting} onClose={() => setResetting(null)} onDone={() => { setResetting(null); list.reload(); }} />
    </>
  );
}
