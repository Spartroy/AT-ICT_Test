import React, { useEffect, useState } from 'react';
import { BarChart3, Globe, LayoutList, Megaphone, Phone, Plus, Trash2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { ErrorNote, Ic, Loading } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { apiError } from './modals/form';

const SWITCHES = [
  { key: 'fees', label: 'Fees section', hint: 'Plans, prices, perks and the Pricing FAQ.' },
  { key: 'results', label: 'Results & student stories', hint: 'Story carousel and the results numbers.' },
  { key: 'hallOfFame', label: 'Hall of Fame section', hint: 'The wall of students on the home page (the full page stays available).' }
];

const blankCounter = { n: 0, suffix: '+', label: '' };

/** Numbers editor: up to 4 rows of number / suffix / label. */
function Counters({ id, title, hint, rows, onChange }) {
  const update = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="set-group">
      <legend id={id}>{title}</legend>
      <p className="sub set-note">{hint}</p>
      {rows.map((r, i) => (
        <div className="set-row set-row--num" key={i}>
          <label className="fld"><span>Number</span>
            <input className="inp" type="number" min="0" max="1000000" value={r.n} onChange={e => update(i, { n: e.target.value })} />
          </label>
          <label className="fld"><span>Suffix</span>
            <input className="inp" value={r.suffix} maxLength={3} placeholder="+ or %" onChange={e => update(i, { suffix: e.target.value })} />
          </label>
          <label className="fld"><span>Label</span>
            <input className="inp" value={r.label} maxLength={40} onChange={e => update(i, { label: e.target.value })} />
          </label>
          <button type="button" className="ib sm dng" disabled={rows.length <= 1} aria-label={`Remove ${r.label || 'row'}`} onClick={() => onChange(rows.filter((_, k) => k !== i))}><Ic as={Trash2} /></button>
        </div>
      ))}
      {rows.length < 4 && <button type="button" className="btn o sm" onClick={() => onChange([...rows, { ...blankCounter }])}><Ic as={Plus} />Add number</button>}
    </fieldset>
  );
}

/** A short list of text values (emails, phones). */
function TextList({ title, rows, type, placeholder, onChange }) {
  return (
    <fieldset className="set-group">
      <legend>{title}</legend>
      {rows.map((v, i) => (
        <div className="set-row set-row--one" key={i}>
          <input className="inp" type={type} value={v} placeholder={placeholder} aria-label={`${title} ${i + 1}`} onChange={e => onChange(rows.map((x, k) => (k === i ? e.target.value : x)))} />
          <button type="button" className="ib sm dng" disabled={rows.length <= 1} aria-label={`Remove ${title.toLowerCase()} ${i + 1}`} onClick={() => onChange(rows.filter((_, k) => k !== i))}><Ic as={Trash2} /></button>
        </div>
      ))}
      {rows.length < 4 && <button type="button" className="btn o sm" onClick={() => onChange([...rows, ''])}><Ic as={Plus} />Add</button>}
    </fieldset>
  );
}

/** Settings > Website: everything on the public site the teacher can change without a developer. */
export default function WebsiteSettings() {
  const toast = useToast();
  const site = useApi(API_ENDPOINTS.SETTINGS.SITE, b => b.data);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => { if (site.data) setForm(site.data); }, [site.data]);

  if (site.loading && !form) return <Loading label="Loading website settings…" />;
  if (site.error && !form) return <ErrorNote error={site.error} onRetry={site.reload} />;
  if (!form) return null;

  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    setProblem('');
    setSaving(true);
    try {
      const res = await api.put(API_ENDPOINTS.SETTINGS.TEACHER_SITE, form);
      setForm(res.data);
      toast('Website settings saved');
    } catch (err) {
      setProblem(err.body?.errors?.[0]?.msg || apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      <section className="card set-card" aria-labelledby="web-nums">
        <h3 id="web-nums"><Ic as={BarChart3} />Headline numbers</h3>
        <Counters id="web-hero" title="Home page numbers (top of the page)" hint="Shown under the main headline, e.g. 400+ Students taught." rows={form.heroStats} onChange={heroStats => set({ heroStats })} />
        <Counters id="web-results" title="Results numbers" hint="Shown under the student stories." rows={form.resultCounters} onChange={resultCounters => set({ resultCounters })} />
      </section>

      <section className="card set-card" aria-labelledby="web-contact">
        <h3 id="web-contact"><Ic as={Phone} />Contact details</h3>
        <label className="fld"><span>WhatsApp number (with country code)</span>
          <input className="inp" inputMode="tel" value={form.whatsappNumber} placeholder="201274584000" onChange={e => set({ whatsappNumber: e.target.value })} style={{ maxWidth: 280 }} />
        </label>
        <TextList title="Emails" type="email" placeholder="name@email.com" rows={form.emails} onChange={emails => set({ emails })} />
        <TextList title="Phones" type="tel" placeholder="(+20) 100 000 0000" rows={form.phones} onChange={phones => set({ phones })} />
      </section>

      <section className="card set-card" aria-labelledby="web-sections">
        <h3 id="web-sections"><Ic as={LayoutList} />Sections on the home page</h3>
        <p className="sub set-note">Switch a section off to hide it and its menu link. Nothing is deleted.</p>
        {SWITCHES.map(sw => (
          <label className="cbx set-switch" key={sw.key}>
            <input type="checkbox" checked={!!form.sections[sw.key]} onChange={e => set({ sections: { ...form.sections, [sw.key]: e.target.checked } })} />
            <span><b>{sw.label}</b><small className="sub"> {sw.hint}</small></span>
          </label>
        ))}
      </section>

      <section className="card set-card" aria-labelledby="web-banner">
        <h3 id="web-banner"><Ic as={Megaphone} />Announcement banner</h3>
        <p className="sub set-note">A bar above the menu, e.g. "June 27 registration closes Friday". Visitors can dismiss it.</p>
        <label className="cbx set-switch">
          <input type="checkbox" checked={form.banner.enabled} onChange={e => set({ banner: { ...form.banner, enabled: e.target.checked } })} />
          <span><b>Show the banner</b></span>
        </label>
        <label className="fld"><span>Text (max 160 characters)</span>
          <input className="inp" value={form.banner.text} maxLength={160} onChange={e => set({ banner: { ...form.banner, text: e.target.value } })} />
        </label>
        <label className="fld"><span>Link (optional: https://… or /register)</span>
          <input className="inp" value={form.banner.link} onChange={e => set({ banner: { ...form.banner, link: e.target.value } })} />
        </label>
      </section>

      {problem && <p className="fld-err" role="alert">{problem}</p>}
      <div className="mfoot" style={{ justifyContent: 'flex-start' }}>
        <button className="btn p" disabled={saving}><Ic as={Globe} />{saving ? 'Saving…' : 'Save website settings'}</button>
      </div>
    </form>
  );
}
