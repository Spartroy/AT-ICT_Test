import React, { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, FileText, Package, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../config/api';
import { Ic } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { FormDialog, Fld, apiError, announceChange } from './form';

export const KINDS = [
  { id: 'book', label: 'Book', hint: 'A book on the shelf', icon: BookOpen },
  { id: 'revsheet', label: 'Rev sheet', hint: 'A revision folder', icon: FileText },
  { id: 'source', label: 'Source file', hint: 'A box of files to download', icon: Package },
  { id: 'pastpapers', label: 'Past papers', hint: 'QP, SRC and MS by year', icon: ClipboardList }
];
const SECTIONS = [
  { id: 'practical', label: 'Practical' },
  { id: 'theory', label: 'Theory' },
  { id: 'other', label: 'Revision' }
];
const PAPERS = [
  { id: 1, label: 'Paper 1', sub: 'Theory' },
  { id: 2, label: 'Paper 2', sub: 'Practical' },
  { id: 3, label: 'Paper 3', sub: 'Practical' }
];
export const YEAR_RANGE = Array.from({ length: 9 }, (_, i) => 2026 - i); // 2026 … 2018
const SESSIONS = [{ id: 'jun', label: 'June session' }, { id: 'nov', label: 'November session' }];
const LINK = /^https?:\/\/[^\s]+$/i;
const blankVariant = () => ({ qp: '', src: '', ms: '' });

/** Option cards: one choice, big and obvious. */
function Choice({ title, options, value, onChange, cols }) {
  return (
    <div className="wz-q" role="group" aria-label={title}>
      <b className="wz-qt">{title}</b>
      <div className="wz-opts" style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
        {options.map(o => (
          <button key={o.id} type="button" className={`wz-opt ${value === o.id ? 'on' : ''}`} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.icon && <Ic as={o.icon} />}
            <span><b>{o.label}</b>{(o.hint || o.sub) && <small>{o.hint || o.sub}</small>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Past papers for one paper + year: Jun and Nov columns, each with V1, V2… and their links. */
function PastPaperForm({ state, setState, errors }) {
  const { paper, year, sessions, loading } = state;
  const showSrc = paper === 2 || paper === 3;
  const patch = (p) => setState(s => ({ ...s, ...p }));
  const setVariant = (session, i, key, value) => setState(s => ({
    ...s, sessions: { ...s.sessions, [session]: s.sessions[session].map((v, k) => (k === i ? { ...v, [key]: value } : v)) }
  }));
  const addVariant = (session) => setState(s => ({ ...s, sessions: { ...s.sessions, [session]: [...s.sessions[session], blankVariant()] } }));
  const removeVariant = (session, i) => setState(s => ({ ...s, sessions: { ...s.sessions, [session]: s.sessions[session].filter((_, k) => k !== i) } }));

  return (
    <>
      <Choice title="Which paper?" options={PAPERS} value={paper} onChange={id => patch({ paper: id })} cols={3} />
      {paper && (
        <Fld label="Year" error={errors.year}>
          <select className="inp" value={year || ''} onChange={e => patch({ year: Number(e.target.value) || null })} style={{ maxWidth: 200 }}>
            <option value="">Choose a year…</option>
            {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Fld>
      )}
      {paper && year && (
        <div className="wz-sessions" aria-busy={loading}>
          {SESSIONS.map(({ id, label }) => (
            <section className="wz-session" key={id} aria-label={label}>
              <h4>{label}</h4>
              {sessions[id].map((v, i) => (
                <div className="wz-variant" key={i}>
                  <header>
                    <b>V{i + 1}</b>
                    <button type="button" className="ib sm dng" aria-label={`Remove ${label} variant ${i + 1}`} onClick={() => removeVariant(id, i)}><Ic as={Trash2} /></button>
                  </header>
                  <Fld label="Question Paper · QP" error={errors[`${id}.${i}.qp`]}><input className="inp" type="url" value={v.qp} onChange={e => setVariant(id, i, 'qp', e.target.value)} placeholder="https://…" /></Fld>
                  {showSrc && <Fld label="Source files · SRC" error={errors[`${id}.${i}.src`]}><input className="inp" type="url" value={v.src} onChange={e => setVariant(id, i, 'src', e.target.value)} placeholder="https://…" /></Fld>}
                  <Fld label="Mark Scheme · MS" error={errors[`${id}.${i}.ms`]}><input className="inp" type="url" value={v.ms} onChange={e => setVariant(id, i, 'ms', e.target.value)} placeholder="https://…" /></Fld>
                </div>
              ))}
              <button type="button" className="btn o sm" onClick={() => addVariant(id)}><Ic as={Plus} />Add variant{sessions[id].length ? ` V${sessions[id].length + 1}` : ' V1'}</button>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Add / edit a material, one question at a time:
 *   what is it (Book / Rev sheet / Source file / Past papers) → title → section → link.
 * Past papers branch into paper → year → Jun / Nov variants. Materials are links only.
 * `material` edits an existing one; `pastpaper` ({ paper, year }) opens the past-paper editor for that year.
 */
export function MaterialModal({ open, onClose, material, pastpaper }) {
  const toast = useToast();
  const m = material;
  const [kind, setKind] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(null);
  const [link, setLink] = useState('');
  const [pp, setPp] = useState({ paper: null, year: null, sessions: { jun: [], nov: [] }, loading: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setBusy(false);
    if (pastpaper) {
      setKind('pastpapers');
      setPp({ paper: pastpaper.paper || null, year: pastpaper.year || null, sessions: { jun: [], nov: [] }, loading: false });
    } else {
      setKind(m ? (m.kind === 'revsheet' || m.kind === 'source' ? m.kind : (m.isSourceFile ? 'source' : 'book')) : null);
      setPp({ paper: null, year: null, sessions: { jun: [], nov: [] }, loading: false });
    }
    setTitle(m?.title || '');
    setType(m?.type || null);
    setLink(m?.externalUrl || '');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load what is already saved for the chosen paper + year.
  useEffect(() => {
    if (!open || kind !== 'pastpapers' || !pp.paper || !pp.year) return undefined;
    let cancelled = false;
    setPp(s => ({ ...s, loading: true }));
    api.get(`${API_ENDPOINTS.TEACHER_PASTPAPERS}?paper=${pp.paper}&year=${pp.year}`)
      .then((res) => {
        if (cancelled) return;
        const sessions = { jun: [], nov: [] };
        (res.data?.papers || []).forEach(p => sessions[p.session]?.push({ qp: p.qp || '', src: p.src || '', ms: p.ms || '' }));
        setPp(s => ({ ...s, sessions, loading: false }));
      })
      .catch(() => { if (!cancelled) setPp(s => ({ ...s, loading: false })); });
    return () => { cancelled = true; };
  }, [open, kind, pp.paper, pp.year]);

  const isPast = kind === 'pastpapers';
  const needsType = kind === 'book' || kind === 'revsheet';
  const showTitle = !isPast && !!kind;
  const showType = needsType && title.trim().length > 0;
  const showLink = showTitle && title.trim().length > 0 && (kind === 'source' || !!type);
  const editingLegacyFile = !!m?.fileName; // uploaded earlier: keep its file, only details change
  const ready = isPast ? !!(pp.paper && pp.year) : showLink && (editingLegacyFile || link.trim().length > 0);

  const submit = async () => {
    const e = {};
    if (isPast) {
      if (!pp.paper) e.paper = 'Choose a paper';
      if (!pp.year) e.year = 'Choose a year';
      Object.entries(pp.sessions).forEach(([session, list]) => list.forEach((v, i) => {
        ['qp', 'src', 'ms'].forEach((key) => {
          if (v[key].trim() && !LINK.test(v[key].trim())) e[`${session}.${i}.${key}`] = 'Start the link with https://';
        });
      }));
    } else {
      if (!title.trim()) e.title = 'Enter a title';
      if (!editingLegacyFile && !link.trim()) e.link = 'Paste the link';
      else if (!editingLegacyFile && !LINK.test(link.trim())) e.link = 'Start the link with https://';
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (isPast) {
        const res = await api.put(API_ENDPOINTS.TEACHER_PASTPAPERS, { paper: pp.paper, year: pp.year, sessions: pp.sessions });
        toast(res.message || 'Past papers saved');
        announceChange('pastpaper');
      } else {
        const body = { kind, title: title.trim(), type: kind === 'source' ? 'practical' : type };
        if (!editingLegacyFile) body.externalUrl = link.trim();
        if (m) await api.put(`${API_ENDPOINTS.TEACHER.MATERIALS}/${m._id}`, body);
        else {
          const fd = new FormData();
          Object.entries(body).forEach(([k, v]) => fd.append(k, v));
          await api.post(API_ENDPOINTS.TEACHER.MATERIALS, fd);
        }
        toast(m ? 'Material saved' : 'Material added');
        announceChange('material');
      }
      onClose();
    } catch (err) {
      setErrors({ form: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      icon={Upload}
      size={isPast ? 'wide' : ''}
      title={m ? 'Edit material' : pastpaper ? (pastpaper.paper ? 'Edit past papers' : 'Add past papers') : 'Add material'}
      submitLabel={isPast ? 'Save past papers' : m ? 'Save' : 'Add material'}
      busy={busy}
      disabled={!ready}
      error={errors.form}
      onSubmit={submit}
    >
      {!m && !pastpaper && <Choice title="What are you adding?" options={KINDS} value={kind} onChange={setKind} cols={2} />}

      {isPast && <PastPaperForm state={pp} setState={setPp} errors={errors} />}

      {showTitle && (
        <Fld label="Title" error={errors.title}>
          <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Classified" autoFocus />
        </Fld>
      )}
      {showType && <Choice title="Which section?" options={SECTIONS} value={type} onChange={setType} cols={3} />}
      {showLink && !editingLegacyFile && (
        <Fld label="Link" error={errors.link}>
          <input className="inp" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://drive.google.com/…" />
        </Fld>
      )}
      {showLink && editingLegacyFile && <p className="sub">This material uses an uploaded file, which stays as it is.</p>}
    </FormDialog>
  );
}
