import React, { useMemo, useState } from 'react';
import { Phone, MessageCircle, Copy, Users, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, SearchBox } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { apiError } from './modals/form';
import { BUILT_IN_TEMPLATES, PLACEHOLDERS, fillTemplate, telHref, whatsappLink } from './messageTemplates';

const known = (v) => v !== null && v !== undefined && v !== '' && v !== 'N/A';
const level = (s) => (s.schoolType === 'royal' ? (known(s.royalClass) ? `Class ${s.royalClass}` : 'Royal') : known(s.year) ? `Year ${s.year}` : '—');

/** Student / parent number table, with call and WhatsApp buttons that fill in a message template. */
export default function ParentNumbersPanel() {
  const { assistant, me } = useTeacher();
  const teacherName = me?.name;
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [templateId, setTemplateId] = useState(BUILT_IN_TEMPLATES[0]._id);
  const [managing, setManaging] = useState(false);

  // withParents=true marks the request as a parent-number lookup (assistants' lookups are logged)
  const list = useApi(`${API_ENDPOINTS.TEACHER.STUDENTS}?all=true&status=approved&withParents=true`, b => b.data?.students || []);
  const templates = useApi(API_ENDPOINTS.TEACHER.MESSAGE_TEMPLATES, b => b.data?.templates || []);
  const allTemplates = useMemo(() => [...BUILT_IN_TEMPLATES, ...(templates.data || [])], [templates.data]);
  const template = allTemplates.find(t => t._id === templateId) || allTemplates[0];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data || [])
      .filter(s => !q || [s.fullName, s.studentId, s.parentNumber].some(v => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [list.data, search]);

  const copy = async (number) => {
    try { await navigator.clipboard.writeText(number); toast('Number copied'); } catch { toast(number); }
  };
  const message = (s) => fillTemplate(template?.body, { student: s.firstName, group: s.group || '', teacher: teacherName });

  return (
    <>
      <div className="fbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, ID or number…" style={{ margin: 0, flex: 1, minWidth: 200 }} />
        <select className="inp sel-s" value={template?._id} onChange={e => setTemplateId(e.target.value)} aria-label="Message template">
          {allTemplates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>
        {!assistant && <button type="button" className="btn o sm" onClick={() => setManaging(true)}><Ic as={FileText} />Templates</button>}
      </div>
      <div className="card" style={{ padding: 8, overflowX: 'auto' }}>
        {list.loading && !list.data && <Loading label="Loading parent numbers…" />}
        {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
        {list.data && !rows.length && <Empty icon={Users}>No students match.</Empty>}
        {rows.length > 0 && (
          <table className="pn-table">
            <caption className="sr-only">Students and their parent phone numbers</caption>
            <thead><tr><th scope="col">Student</th><th scope="col">ID</th><th scope="col">Level</th><th scope="col">Parent number</th><th scope="col"><span className="sr-only">Contact</span></th></tr></thead>
            <tbody>
              {rows.map(s => {
                const has = known(s.parentNumber);
                const wa = has ? whatsappLink(s.parentNumber, message(s)) : '';
                const tel = has ? telHref(s.parentNumber) : '';
                return (
                  <tr key={s._id}>
                    <th scope="row">
                      {s.fullName}
                      {s.siblings?.length > 0 && <small className="pn-sib" title={`Same parent number as ${s.siblings.join(', ')}`}> · siblings: {s.siblings.join(', ')}</small>}
                    </th>
                    <td>{known(s.studentId) && s.studentId !== 'Not assigned' ? s.studentId : '—'}</td>
                    <td>{level(s)}</td>
                    <td className="mono">{has ? s.parentNumber : <span className="sub">Not provided</span>}</td>
                    <td className="pn-act">
                      {has && (
                        <>
                          <button type="button" className="ib sm" aria-label={`Copy ${s.fullName}'s parent number`} onClick={() => copy(s.parentNumber)}><Ic as={Copy} /></button>
                          {tel && <a className="ib sm" href={tel} aria-label={`Call ${s.fullName}'s parent`}><Ic as={Phone} /></a>}
                          {wa && <a className="ib sm" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${s.fullName}'s parent with “${template?.title}”`}><Ic as={MessageCircle} /></a>}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <TemplatesDialog open={managing} onClose={() => setManaging(false)} templates={templates.data || []} reload={templates.reload} />
    </>
  );
}

/** Add, edit and delete the teacher's own templates (the built-in ones stay). */
function TemplatesDialog({ open, onClose, templates, reload }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null); // { _id?, title, body }
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { title: editing.title, body: editing.body };
      if (editing._id) await api.put(`${API_ENDPOINTS.TEACHER.MESSAGE_TEMPLATES}/${editing._id}`, body);
      else await api.post(API_ENDPOINTS.TEACHER.MESSAGE_TEMPLATES, body);
      toast('Template saved');
      setEditing(null);
      reload();
    } catch (err) { toast(apiError(err)); } finally { setBusy(false); }
  };
  const remove = async (t) => {
    if (!(await confirm({ title: `Delete “${t.title}”?`, body: 'This template is removed for everyone who uses it.', confirmLabel: 'Delete' }))) return;
    try { await api.del(`${API_ENDPOINTS.TEACHER.MESSAGE_TEMPLATES}/${t._id}`); toast('Template deleted'); reload(); } catch (err) { toast(apiError(err)); }
  };

  return (
    <Dialog open onClose={onClose} labelledBy="tpl-title">
      <DialogHeader id="tpl-title" icon={FileText} title="Message templates" sub={`Use ${PLACEHOLDERS.join(', ')} to fill in names automatically.`} onClose={onClose} />
      <div className="mbody">
        {editing ? (
          <form onSubmit={save}>
            <label className="fld"><span>Title</span><input className="inp" maxLength={80} required value={editing.title} onChange={e => setEditing(x => ({ ...x, title: e.target.value }))} /></label>
            <label className="fld"><span>Message</span><textarea className="inp" rows={5} maxLength={1000} required value={editing.body} onChange={e => setEditing(x => ({ ...x, body: e.target.value }))} /></label>
            <div className="mfoot"><button type="button" className="btn o" onClick={() => setEditing(null)}>Cancel</button><button className="btn p" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
          </form>
        ) : (
          <>
            {!templates.length && <Empty icon={FileText}>No custom templates yet. The built-in ones are always available.</Empty>}
            {templates.map(t => (
              <div className="trow" key={t._id}>
                <div className="lmain"><b>{t.title}</b><small>{t.body}</small></div>
                <button type="button" className="ib sm" aria-label={`Edit ${t.title}`} onClick={() => setEditing({ _id: t._id, title: t.title, body: t.body })}><Ic as={Pencil} /></button>
                <button type="button" className="ib sm" aria-label={`Delete ${t.title}`} onClick={() => remove(t)}><Ic as={Trash2} /></button>
              </div>
            ))}
            <div className="mfoot"><button type="button" className="btn o" onClick={onClose}>Close</button><button type="button" className="btn p" onClick={() => setEditing({ title: '', body: '' })}><Ic as={Plus} />New template</button></div>
          </>
        )}
      </div>
    </Dialog>
  );
}
