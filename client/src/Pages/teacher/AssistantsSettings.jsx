import React, { useState } from 'react';
import { History, Key, Plus, Trash2, UserCog } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { AREAS, DEFAULT_PERMISSIONS, LEVELS, levelLabel } from '../assistant/access';
import { FormDialog, Fld, apiError } from './modals/form';

const BASE = '/api/teacher/assistants';

/** One select per area: No access / View only / Can edit. */
function PermissionGrid({ value, onChange, disabled }) {
  return (
    <div className="tbl">
      {AREAS.map(a => (
        <div className="trow" key={a.id}>
          <div className="lmain" style={{ flex: '1 1 0', minWidth: 90 }}><b>{a.label}</b><small style={{ whiteSpace: 'normal' }}>{a.blurb}</small></div>
          <select className="inp sel-s" style={{ flex: '0 0 130px', width: 130 }} aria-label={`${a.label} access`} disabled={disabled} value={value[a.id] || 'none'} onChange={e => onChange({ ...value, [a.id]: e.target.value })}>
            {LEVELS.map(l => <option key={l} value={l}>{levelLabel(l)}</option>)}
          </select>
        </div>
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
      <ActivityLog />
      <CreateDialog open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); }} />
      <ResetDialog assistant={resetting} onClose={() => setResetting(null)} onDone={() => { setResetting(null); list.reload(); }} />
    </>
  );
}
