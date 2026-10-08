import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Users, Bell, Eye, MoreHorizontal, CheckCircle2, XCircle, GraduationCap, MapPin, Clock, Phone, User, Mail, Copy } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, SearchBox, Seg, fmtDate, initials } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import useTeacherSettings from '../../hooks/useTeacherSettings';
import { useTeacher } from './TeacherPortal';
import { apiError, useTeacherChange } from './modals/form';
import StudentModal from './StudentModal';

const PAGE = 20;
const known = (v) => v !== null && v !== undefined && v !== '' && v !== 'N/A' && v !== 'Not assigned';
const yearOrClass = (r) => (r.schoolType === 'royal' || known(r.royalClass) ? (known(r.royalClass) ? `Class ${r.royalClass}` : 'Royal College') : known(r.year) ? `Year ${r.year}` : 'N/A');

export default function Students() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, counts } = useTeacher();
  if (!['all', 'registrations'].includes(tab)) return <Navigate to={`${base}/students/all`} replace />;
  return (
    <>
      <PageHead eyebrow="Student management" title="Students" />
      <Seg
        tabs={[{ id: 'all', label: 'All students', icon: Users }, { id: 'registrations', label: 'Registrations', icon: Bell, count: counts.pendingRegs || '' }]}
        value={tab}
        onChange={id => navigate(`${base}/students/${id}`)}
        label="Student sections"
      />
      {tab === 'all' ? <StudentList /> : <Registrations />}
    </>
  );
}

/** Shows credentials the API returns once (temporary password / new parent login). */
export function CredentialsDialog({ creds, onClose }) {
  const toast = useToast();
  if (!creds) return null;
  const copy = () => navigator.clipboard?.writeText(`${creds.email ? `Email: ${creds.email}\n` : ''}Password: ${creds.password}`).then(() => toast('Copied'), () => toast("Couldn't copy"));
  return (
    <Dialog open onClose={onClose} size="sm" labelledBy="cred-title">
      <DialogHeader id="cred-title" icon={User} title={creds.title} sub="Shown once. Share it securely." onClose={onClose} />
      <div className="mbody">
        {creds.email && <div className="kvr"><span>Email</span><b className="mono">{creds.email}</b></div>}
        <div className="kvr"><span>Password</span><b className="mono">{creds.password}</b></div>
        <div className="mfoot"><button type="button" className="btn o" onClick={copy}><Ic as={Copy} />Copy</button><button type="button" className="btn p" onClick={onClose}>Done</button></div>
      </div>
    </Dialog>
  );
}

function StudentList() {
  const { settings } = useTeacherSettings();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { base } = useTeacher();
  const [filters, setFilters] = useState({ search: '', session: '', year: '', status: '', schoolType: '' });
  const [debounced, setDebounced] = useState(filters);
  const [limit, setLimit] = useState(PAGE);
  const [menu, setMenu] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [creds, setCreds] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(filters); setLimit(PAGE); }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  const qs = new URLSearchParams({ limit: String(limit), ...Object.fromEntries(Object.entries(debounced).filter(([, v]) => v)) }).toString();
  const list = useApi(`${API_ENDPOINTS.TEACHER.STUDENTS}?${qs}`, b => b.data || {});
  useTeacherChange(['registration', 'student'], list.reload);
  const set = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!e.target.closest('.mw')) setMenu(null); };
    const esc = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

  const act = async (kind, s) => {
    setMenu(null);
    try {
      if (kind === 'parent') {
        const res = await api.post(`${API_ENDPOINTS.TEACHER.STUDENTS}/${s._id}/create-parent`, {});
        setCreds({ title: `Parent account for ${s.fullName}`, ...res.data.credentials });
        list.reload();
      } else if (kind === 'chatParent') {
        navigate(`${base}/inbox/chat`);
      } else if (kind === 'reset') {
        if (!(await confirm({ title: `Reset ${s.fullName}'s password?`, body: 'Their current password stops working immediately.', confirmLabel: 'Reset password' }))) return;
        const res = await api.post(API_ENDPOINTS.TEACHER.RESET_STUDENT_PASSWORD(s._id), {});
        setCreds({ title: `Temporary password for ${s.fullName}`, email: s.email, password: res.data.tempPassword });
      } else if (kind === 'remove') {
        if (!(await confirm({ title: `Remove ${s.fullName}?`, body: 'This deletes the student account.', confirmLabel: 'Remove' }))) return;
        await api.del(`${API_ENDPOINTS.TEACHER.STUDENTS}/${s._id}`);
        toast('Student removed');
        list.reload();
      }
    } catch (err) {
      toast(apiError(err));
    }
  };

  const students = list.data?.students || [];
  const total = list.data?.pagination?.total ?? students.length;

  return (
    <>
      <div className="fbar">
        <SearchBox value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} placeholder="Search name, ID or email…" style={{ margin: 0, flex: 1, minWidth: 200 }} />
        <select className="inp sel-s" value={filters.session} onChange={set('session')} aria-label="Session">
          <option value="">All sessions</option>
          {(settings?.examSessions || []).map(s => <option key={s.code} value={s.code}>Session: {s.code}{s.open ? '' : ' (closed)'}</option>)}
        </select>
        <select className="inp sel-s" value={filters.year} onChange={set('year')} aria-label="Year">
          <option value="">All years</option><option value="10">Year 10</option><option value="11">Year 11</option><option value="12">Year 12</option>
        </select>
        <select className="inp sel-s" value={filters.status} onChange={set('status')} aria-label="Status">
          <option value="">All statuses</option><option value="approved">Status: Approved</option><option value="pending">Status: Pending</option><option value="rejected">Status: Rejected</option>
        </select>
        <select className="inp sel-s" value={filters.schoolType} onChange={set('schoolType')} aria-label="School type">
          <option value="">All schools</option><option value="royal">Royal College</option><option value="center">Center / other</option>
        </select>
      </div>
      <div className="card" style={{ padding: 8 }}>
        {list.loading && !list.data && <Loading label="Loading students…" />}
        {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
        {list.data && !students.length && <Empty icon={Users}>No students match.</Empty>}
        {students.map(s => (
          <div className="srow2" key={s._id}>
            <span className="av" style={{ width: 42, height: 42 }} aria-hidden="true">{initials(s.fullName)}</span>
            <div className="lmain">
              <b>{s.fullName} {s.registrationStatus === 'pending' && <span className="chip c-am">Pending</span>}{s.schoolType === 'royal' && <span className="chip c-th">Royal</span>}</b>
              <small>{[known(s.studentId) ? s.studentId : null, yearOrClass(s), known(s.session) ? s.session : null].filter(Boolean).join(' · ')}</small>
            </div>
            <span className="sc-c">{known(s.school) ? s.school : '—'}</span>
            <span className="en-c">{fmtDate(s.enrolledDate, { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
            <div className="sr-a">
              <button type="button" className="btn o sm" onClick={() => setViewing(s._id)}><Ic as={Eye} />View</button>
              <div className="mw">
                <button type="button" className="ib sm" aria-label={`More actions for ${s.fullName}`} aria-haspopup="menu" aria-expanded={menu === s._id} onClick={() => setMenu(m => (m === s._id ? null : s._id))}><Ic as={MoreHorizontal} /></button>
                <div className={`menu ${menu === s._id ? 'on' : ''}`} role="menu" hidden={menu !== s._id}>
                  {s.hasParent
                    ? <button type="button" role="menuitem" onClick={() => act('chatParent', s)}>Chat with parent</button>
                    : <button type="button" role="menuitem" onClick={() => act('parent', s)}>Create parent account</button>}
                  <button type="button" role="menuitem" onClick={() => act('reset', s)}>Reset password</button>
                  <button type="button" role="menuitem" className="dng" onClick={() => act('remove', s)}>Remove</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {students.length < total && (
          <div className="load-more"><button type="button" className="btn o sm" onClick={() => setLimit(l => l + PAGE)} disabled={list.loading}>{list.loading ? 'Loading…' : `Show more (${total - students.length} left)`}</button></div>
        )}
      </div>
      <StudentModal studentId={viewing} onClose={() => setViewing(null)} onCredentials={setCreds} />
      <CredentialsDialog creds={creds} onClose={() => setCreds(null)} />
    </>
  );
}

function Registrations() {
  const { registrations, refreshBadges } = useTeacher();
  const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const toast = useToast();
  const list = useMemo(() => registrations.data?.registrations || [], [registrations.data]);

  useEffect(() => {
    const id = params.get('open');
    if (id && list.length) {
      setDetail(list.find(r => r._id === id) || null);
      params.delete('open');
      setParams(params, { replace: true });
    }
  }, [params, list, setParams]);

  const approve = async (r) => {
    try {
      await api.put(`${API_ENDPOINTS.REGISTRATION.BASE}/${r._id}/approve`, {});
      toast(`${r.firstName} ${r.lastName} approved`);
      setDetail(null);
      refreshBadges();
      window.dispatchEvent(new CustomEvent('teacher:changed', { detail: 'registration' }));
    } catch (err) {
      toast(apiError(err));
    }
  };

  if (registrations.loading && !registrations.data) return <Loading label="Loading registrations…" />;
  if (registrations.error) return <ErrorNote error={registrations.error} onRetry={registrations.reload} />;

  return (
    <>
      {!list.length && <div className="card"><Empty icon={CheckCircle2}>No pending registrations.</Empty></div>}
      {list.map(r => (
        <div className="card reg" key={r._id}>
          <span className="av" style={{ width: 56, height: 56, fontSize: '1.1rem' }} aria-hidden="true">{initials(`${r.firstName} ${r.lastName}`)}</span>
          <div className="lmain">
            <h3 style={{ margin: 0 }}>{r.firstName} {r.lastName}</h3>
            <p className="sub">{r.email}</p>
            <div className="rg-m">
              <span><Ic as={GraduationCap} />{yearOrClass(r)}</span>
              <span><Ic as={MapPin} />{[r.city, r.country].filter(known).join(', ') || 'N/A'}</span>
              <span><Ic as={Clock} />{fmtDate(r.createdAt, { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
              <span><Ic as={Phone} />{r.contactNumber || 'N/A'}</span>
            </div>
            <div className="rg-f">
              {[['School', r.school], ['Session', r.session], ['Tech', known(r.techKnowledge) ? `${r.techKnowledge}/10` : 'N/A'], ['Retaker', r.isRetaker ? 'Yes' : 'No']].map(([k, v]) => (
                <div key={k}><small>{k}</small><b>{known(v) ? v : 'N/A'}</b></div>
              ))}
            </div>
          </div>
          <div className="rg-a">
            <button type="button" className="btn o" onClick={() => setDetail(r)}><Ic as={Eye} />View</button>
            <button type="button" className="btn g" onClick={() => approve(r)}><Ic as={CheckCircle2} />Approve</button>
            <button type="button" className="btn p" onClick={() => setRejecting(r)}><Ic as={XCircle} />Reject</button>
          </div>
        </div>
      ))}
      <RegistrationDialog reg={detail} onClose={() => setDetail(null)} onApprove={approve} onReject={r => { setDetail(null); setRejecting(r); }} />
      <RejectDialog reg={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); refreshBadges(); }} />
    </>
  );
}

function RegistrationDialog({ reg, onClose, onApprove, onReject }) {
  if (!reg) return null;
  const rows = [
    ['Year / class', yearOrClass(reg)], ['School', reg.school], ['Session', reg.session], ['Nationality', reg.nationality],
    ['City', reg.city], ['Country', reg.country], ['Retaker', reg.isRetaker ? 'Yes' : 'No'],
    ['Tech knowledge', known(reg.techKnowledge) ? `${reg.techKnowledge}/10` : 'N/A'], ['English level', known(reg.englishLevel) ? `${reg.englishLevel}/10` : 'N/A'],
    ['Other subjects', reg.otherSubjects]
  ];
  return (
    <Dialog open onClose={onClose} labelledBy="reg-title">
      <DialogHeader id="reg-title" icon={User} title="Registration details" sub={`${reg.firstName} ${reg.lastName}`} onClose={onClose} />
      <div className="mbody">
        <div className="pf">
          <span className="av" style={{ width: 64, height: 64, fontSize: '1.3rem', borderRadius: 18 }} aria-hidden="true">{initials(`${reg.firstName} ${reg.lastName}`)}</span>
          <div><h3 style={{ margin: 0 }}>{reg.firstName} {reg.lastName}</h3><p className="sub">{reg.email}</p><span className="chip c-th">{reg.schoolType === 'royal' ? 'Royal College' : 'Center student'}</span></div>
        </div>
        <div className="kv">{rows.map(([k, v]) => <div key={k}><small>{k}</small><b>{known(v) ? v : 'N/A'}</b></div>)}</div>
        <div className="card" style={{ marginTop: 12 }}>
          <small className="lbl">Contact information</small>
          <p className="ir"><Ic as={Mail} />{reg.email}</p>
          <p className="ir"><Ic as={Phone} />{reg.contactNumber || 'N/A'}</p>
          <p className="ir"><Ic as={Users} />Parent: {known(reg.parentNumber) ? reg.parentNumber : 'N/A'}</p>
        </div>
        <div className="mfoot">
          <button type="button" className="btn o" onClick={onClose}>Close</button>
          <button type="button" className="btn p" onClick={() => onReject(reg)}>Reject</button>
          <button type="button" className="btn g" onClick={() => onApprove(reg)}>Approve</button>
        </div>
      </div>
    </Dialog>
  );
}

function RejectDialog({ reg, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setReason(''); setError(''); }, [reg]);
  if (!reg) return null;
  const submit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) { setError('Give a reason of at least 5 characters'); ref.current?.focus(); return; }
    setBusy(true);
    try {
      await api.put(`${API_ENDPOINTS.REGISTRATION.BASE}/${reg._id}/reject`, { reason: reason.trim() });
      toast('Registration rejected');
      onDone();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} size="sm" labelledBy="rej-title">
      <DialogHeader id="rej-title" icon={XCircle} title="Reject this registration?" sub={`${reg.firstName} ${reg.lastName}`} onClose={onClose} />
      <form className="mbody" onSubmit={submit}>
        <label className="fld"><span>Reason (shared with the student)</span><textarea ref={ref} className="inp" rows={3} value={reason} onChange={e => setReason(e.target.value)} />{error && <span className="fld-err">{error}</span>}</label>
        <div className="mfoot"><button type="button" className="btn o" onClick={onClose}>Cancel</button><button className="btn p" disabled={busy}>{busy ? 'Rejecting…' : 'Reject'}</button></div>
      </form>
    </Dialog>
  );
}
