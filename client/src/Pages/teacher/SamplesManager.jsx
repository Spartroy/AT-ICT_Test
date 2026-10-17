import React, { useState } from 'react';
import { ExternalLink, Gift, Pencil, Trash2, FlaskConical } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { apiError, useTeacherChange } from './modals/form';
import { kindLabel } from './sampleOptions';

const MODES = [
  { id: 'ab', label: 'A/B test', hint: 'Half of visitors get A, half get B. Compare results in Students › Leads.' },
  { id: 'A', label: 'Always A', hint: 'Ask for name and phone before the sample opens.' },
  { id: 'B', label: 'Always B', hint: 'Open the sample right away and ask in the middle of the screen after 15 seconds.' },
  { id: 'off', label: 'No form', hint: 'Samples open freely and nothing is collected.' }
];

/** Library › Free samples: the cards on the public website, plus the opt-in test switch. */
export default function SamplesManager() {
  const { openModal } = useTeacher();
  const toast = useToast();
  const confirm = useConfirm();
  const res = useApi(API_ENDPOINTS.TEACHER_SAMPLES, b => b.data);
  useTeacherChange('sample', res.reload);
  const [saving, setSaving] = useState(false);

  if (res.loading && !res.data) return <Loading label="Loading samples…" />;
  if (res.error && !res.data) return <ErrorNote error={res.error} onRetry={res.reload} />;
  const samples = res.data?.samples || [];
  const mode = res.data?.test?.mode || 'ab';

  const setMode = async (next) => {
    setSaving(true);
    try {
      await api.put(`${API_ENDPOINTS.TEACHER_SAMPLES}/test`, { mode: next });
      toast('Opt-in setting saved');
      res.reload();
    } catch (err) { toast(apiError(err)); } finally { setSaving(false); }
  };
  const remove = async (s) => {
    if (!(await confirm({ title: `Delete “${s.title}”?`, body: 'It disappears from the website.', confirmLabel: 'Delete' }))) return;
    try { await api.del(`${API_ENDPOINTS.TEACHER_SAMPLES}/${s.id}`); toast('Sample deleted'); res.reload(); } catch (err) { toast(apiError(err)); }
  };

  return (
    <>
      <section className="card set-card" aria-labelledby="smp-test">
        <h3 id="smp-test"><Ic as={FlaskConical} />Name &amp; phone form</h3>
        <p className="sub set-note">Visitors leave their name and number to open a sample. Choose when we ask. The results are in Students › Leads.</p>
        <div className="chips" role="group" aria-label="When to show the form">
          {MODES.map(m => <button key={m.id} type="button" className={`ch ${mode === m.id ? 'on' : ''}`} aria-pressed={mode === m.id} disabled={saving} onClick={() => setMode(m.id)}>{m.label}</button>)}
        </div>
        <p className="sub smp-hint">{MODES.find(m => m.id === mode)?.hint}</p>
      </section>

      {!samples.length && <div className="card"><Empty icon={Gift}>No samples yet. Add the first one.</Empty></div>}
      <div className="smp-list">
        {samples.map(s => (
          <div className={`card smp-row ${s.published ? '' : 'off'}`} key={s.id}>
            <div className="smp-main">
              <div className="smp-top">
                <b>{s.title}</b>
                <span className="chip c-th">{kindLabel(s.kind)}</span>
                {!s.published && <span className="chip c-gy">Hidden</span>}
                {!s.url && <span className="chip c-am">No link yet</span>}
              </div>
              <p className="sub">{s.description || 'No description'}</p>
              {s.url && <a className="smp-link" href={s.url} target="_blank" rel="noopener noreferrer"><Ic as={ExternalLink} />{s.url.replace(/^https?:\/\//, '').slice(0, 60)}</a>}
            </div>
            <span className="lact">
              <button type="button" className="ib sm" aria-label={`Edit ${s.title}`} onClick={() => openModal('sample', { sample: s })}><Ic as={Pencil} /></button>
              <button type="button" className="ib sm dng" aria-label={`Delete ${s.title}`} onClick={() => remove(s)}><Ic as={Trash2} /></button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
