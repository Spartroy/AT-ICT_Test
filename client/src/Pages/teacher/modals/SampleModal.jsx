import React, { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { useToast } from '../../../components/portal/PortalUI';
import { ChoiceRow, FormDialog, Fld, announceChange, apiError } from './form';
import { CUSTOM_TITLE, KIND_OPTIONS, TITLE_GROUPS, isKnownTitle, presetDescription } from '../sampleOptions';

const blank = () => ({ pick: '', custom: '', kind: 'notes', url: '', description: '', published: true });

/** Add or edit a free-sample card: title from the curriculum, link, and a description that fills itself in. */
export function SampleModal({ open, onClose, sample }) {
  const toast = useToast();
  const [f, setF] = useState(blank);
  const [touched, setTouched] = useState(false); // the teacher wrote their own description
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (!sample) { setF(blank()); setTouched(false); return; }
    const known = isKnownTitle(sample.title);
    setF({ pick: known ? sample.title : CUSTOM_TITLE, custom: known ? '' : sample.title, kind: sample.kind, url: sample.url || '', description: sample.description || '', published: sample.published !== false });
    setTouched(sample.description !== presetDescription(sample.title, sample.kind));
  }, [open, sample]);

  const title = f.pick === CUSTOM_TITLE ? f.custom.trim() : f.pick;
  const update = (patch) => setF(prev => {
    const next = { ...prev, ...patch };
    const t = next.pick === CUSTOM_TITLE ? next.custom.trim() : next.pick;
    return touched || !t ? next : { ...next, description: presetDescription(t, next.kind) };
  });

  const submit = async () => {
    if (!title) { setError('Choose a title (or pick “Other” and type one)'); return; }
    if (f.url.trim() && !/^https?:\/\//i.test(f.url.trim())) { setError('The link must start with https://'); return; }
    const body = { title, kind: f.kind, url: f.url.trim(), description: f.description.trim(), published: f.published };
    setBusy(true);
    try {
      if (sample) await api.put(`${API_ENDPOINTS.TEACHER_SAMPLES}/${sample.id}`, body);
      else await api.post(API_ENDPOINTS.TEACHER_SAMPLES, body);
      toast('Sample saved');
      announceChange('sample');
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open={open} onClose={onClose} icon={Gift} title={sample ? 'Edit free sample' : 'Add free sample'} sub="Shown on the public website; visitors leave their details to open it" submitLabel="Save" busy={busy} error={error} onSubmit={submit}>
      <Fld label="Title">
        <select className="inp" value={f.pick} onChange={e => update({ pick: e.target.value })}>
          <option value="" disabled>Choose a chapter or practical…</option>
          {TITLE_GROUPS.map(g => (
            <optgroup key={g.label} label={g.label}>{g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
          ))}
          <option value={CUSTOM_TITLE}>Other (type my own)…</option>
        </select>
      </Fld>
      {f.pick === CUSTOM_TITLE && <Fld label="Custom title"><input className="inp" value={f.custom} maxLength={120} onChange={e => update({ custom: e.target.value })} placeholder="e.g. Paper 2 revision" /></Fld>}
      <ChoiceRow title="What is the link?" value={f.kind} onChange={kind => update({ kind })} options={KIND_OPTIONS.map(k => ({ value: k.value, label: k.label }))} />
      <Fld label="Link (opens in a large window on the site)">
        <input className="inp" type="url" inputMode="url" value={f.url} onChange={e => setF(p => ({ ...p, url: e.target.value }))} placeholder="https://prezi.com/… · YouTube · Google Drive…" />
      </Fld>
      <Fld label="Description">
        <textarea className="inp" rows={3} maxLength={400} value={f.description} onChange={e => { setTouched(true); setF(p => ({ ...p, description: e.target.value })); }} />
      </Fld>
      {touched && title && (
        <button type="button" className="btn o sm" style={{ justifySelf: 'start', marginBottom: 10 }} onClick={() => { setTouched(false); setF(p => ({ ...p, description: presetDescription(title, p.kind) })); }}>Reset to the preset description</button>
      )}
      <label className="cb"><input type="checkbox" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} /><span /> Show on the website</label>
    </FormDialog>
  );
}
