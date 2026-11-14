import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Clock, FileText, Flag, Lock, Paperclip, Sparkles, Star, Trophy, Upload } from 'lucide-react';
import { Loading, ErrorNote } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { PREVIEW, PREVIEW_NOTE } from '../../../lib/learnPreview';
import { API_ENDPOINTS } from '../../../config/api';
import { APPS, GUIDES } from './practicalSkills';
import usePracticalProgress from './usePracticalProgress';
import { GUIDE_BY_ID, SKILL_BY_ID, TREE, XP_GUIDE, XP_SKILL, appStats, guideState, guidesOfApp, isBonus, labelLines, layoutTree, newlyUnlocked, overall, skillState, skillsOfGuide } from './skillTreeLogic';
import '../../../styles/skilltree.css';

/**
 * Learn › Skill tree: every skill of the Practical Skills Checker, grown by the practical guides.
 * Tap a guide to see the skills it practises, tap a skill to see which guides teach it.
 */
export default function SkillTree() {
  const toast = useToast();
  const prog = usePracticalProgress();
  const [appId, setAppId] = useState(APPS[0].id);
  const [sel, setSel] = useState(null); // { kind: 'guide' | 'skill', id }
  const [fresh, setFresh] = useState(new Set());
  const [view, setView] = useState('tree'); // tree | submit
  const [focusGuide, setFocusGuide] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const app = APPS.find(a => a.id === appId);
  const guides = useMemo(() => guidesOfApp(appId), [appId]);
  const stats = useMemo(() => appStats(app, prog.guides, prog.skills), [app, prog.guides, prog.skills]);
  const all = useMemo(() => overall(prog.guides, prog.skills), [prog.guides, prog.skills]);

  // What the current selection lights up
  const lit = useMemo(() => {
    if (!sel) return null;
    if (sel.kind === 'guide') return { guides: new Set([sel.id]), skills: new Set(skillsOfGuide(sel.id)) };
    const s = SKILL_BY_ID.get(sel.id);
    return { guides: new Set(s?.guides || []), skills: new Set([sel.id]) };
  }, [sel]);

  if (prog.loading && !prog.guides.size && !prog.skills.size && !prog.preview) return <Loading label="Growing your skill tree…" />;
  if (prog.error) return <ErrorNote error={prog.error} onRetry={prog.reload} />;

  const flash = (ids) => {
    setFresh(new Set(ids));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFresh(new Set()), 3200);
  };

  const goSubmit = (g) => { setFocusGuide(g.id); setView('submit'); };

  const master = async (s, done) => {
    const res = await prog.set('skill', s.id, done);
    if (res === PREVIEW) return toast(PREVIEW_NOTE);
    if (!res) return toast("Couldn't save that. Please try again.");
    if (done) {
      const bonus = s.guides.filter(id => prog.guides.has(id) && guideState(id, prog.guides, new Set([...prog.skills, s.id])) === 'complete' && guideState(id, prog.guides, prog.skills) !== 'complete');
      toast(`${s.name} gained. +${XP_SKILL} XP${bonus.length ? ` · ${GUIDE_BY_ID.get(bonus[0]).label} complete! +${XP_GUIDE} XP bonus` : ''}`);
      flash([s.id]);
    }
    return undefined;
  };

  const pick = (kind, id) => setSel(s => (s && s.kind === kind && s.id === id ? null : { kind, id }));

  return (
    <div className="sk">
      <header className="card sk-hero">
        <div className="sk-lv" aria-label={`Level ${all.level}`}><Trophy size={20} /><b>{all.level}</b><small>level</small></div>
        <div className="sk-herom">
          <h2>Practical skill tree</h2>
          <p>Hand in your evidence for a practical guide to unlock its skills, then tick the skills you can do. Each skill is +{XP_SKILL} XP, and ticking a whole guide adds +{XP_GUIDE}.</p>
          <div className="sk-xp" role="progressbar" aria-valuenow={all.percent} aria-valuemin={0} aria-valuemax={100} aria-label="XP to the next level"><i style={{ width: `${all.percent}%` }} /></div>
          <small>{all.xp} XP · {all.into}/{all.need} to level {all.level + 1} · {all.mastered}/{all.total} skills mastered</small>
        </div>
      </header>

      <div className="sk-views" role="tablist" aria-label="Skill tree sections">
        <button type="button" role="tab" aria-selected={view === 'tree'} className={view === 'tree' ? 'on' : ''} onClick={() => setView('tree')}><Trophy size={15} />Skill tree</button>
        <button type="button" role="tab" aria-selected={view === 'submit'} className={view === 'submit' ? 'on' : ''} onClick={() => setView('submit')}><Upload size={15} />Submissions<small>{prog.submissions.size}/{GUIDES.length}</small></button>
      </div>

      {view === 'submit' && <GuideSubmissions prog={prog} focus={focusGuide} onFocused={() => setFocusGuide(null)} toast={toast} onTree={(id) => { setSel(id ? { kind: 'skill', id } : null); setView('tree'); }} flash={flash} />}

      {view === 'tree' && (
      <>
      <div className="sk-apps" role="tablist" aria-label="Applications">
        {APPS.map(a => {
          const st = appStats(a, prog.guides, prog.skills);
          return (
            <button key={a.id} type="button" role="tab" aria-selected={a.id === appId} className={a.id === appId ? 'on' : ''} onClick={() => { setAppId(a.id); setSel(null); }}>
              <span className="sk-ring" style={{ '--p': st.percent }}><b>{st.percent}%</b></span>
              <span><strong>{a.name}</strong><small>{st.rank.name}</small></span>
            </button>
          );
        })}
      </div>

      <section className="card sk-banner">
        <div><h3>{app.name}</h3><p>{app.sub}</p></div>
        <div className="sk-chips">
          <span><Star size={14} /> {stats.rank.name}</span>
          <span><Check size={14} /> {stats.mastered}/{stats.total} skills</span>
          <span><Paperclip size={14} /> {stats.guidesDone}/{stats.guidesTotal} handed in</span>
          <span><Flag size={14} /> {stats.guidesComplete} complete</span>
          <span><Sparkles size={14} /> {stats.xp} XP</span>
        </div>
        <div className="sk-bar"><i style={{ width: `${stats.percent}%` }} /></div>
      </section>

      <div className="sk-grid">
        <aside className="card sk-quests" aria-label="Practical guides">
          <h4>Quest line</h4>
          <ol>
            {guides.map(g => {
              const gs = guideState(g.id, prog.guides, prog.skills);
              const done = gs === 'complete';
              const cls = ['sk-q', done ? 'done' : '', gs === 'submitted' ? 'sub' : '', sel?.kind === 'guide' && sel.id === g.id ? 'sel' : '', lit && !lit.guides.has(g.id) ? 'dim' : '', lit && lit.guides.has(g.id) && sel?.kind === 'skill' ? 'hl' : ''].filter(Boolean).join(' ');
              return (
                <li key={g.id} className={cls}>
                  <button type="button" onClick={() => pick('guide', g.id)} aria-pressed={sel?.kind === 'guide' && sel.id === g.id}>
                    <span className="sk-node">{done ? <Check size={16} strokeWidth={3} /> : gs === 'submitted' ? <Paperclip size={15} /> : g.kind === 'task' ? <Flag size={14} /> : g.no}</span>
                    <span className="sk-qt"><b>{g.label}</b><small>{gs === 'complete' ? 'Complete' : gs === 'submitted' ? 'Handed in' : `${g.kind === 'task' ? 'Home task' : 'Class guide'} · ${g.minutes} min`}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="sk-branches">
          {app.categories.map(c => <Branch key={c.id} cat={c} prog={prog} sel={sel} lit={lit} fresh={fresh} onPick={pick} />)}
        </div>
      </div>

      <Detail sel={sel} prog={prog} onSubmit={goSubmit} onSkill={master} onPick={pick} onClose={() => setSel(null)} />
      </>
      )}
    </div>
  );
}

const BOX = { r: TREE.radius, halo: TREE.radius + 7 };

/** One branch of the tree: its skills as hexagon nodes joined by lines, root at the top. */
function Branch({ cat, prog, sel, lit, fresh, onPick }) {
  const layout = useMemo(() => layoutTree(cat.skills.length), [cat.skills.length]);
  const states = cat.skills.map(s => skillState(s, prog.guides, prog.skills));
  const got = states.filter(x => x === 'mastered').length;
  return (
    <section className="sk-branch" aria-label={cat.name}>
      <header><h4>{cat.name}</h4><small>{got}/{cat.skills.length}</small></header>
      <svg className="sk-svg" viewBox={`0 0 ${TREE.width} ${layout.height}`} role="group" aria-label={`${cat.name} skills`}>
        {layout.edges.map(([p, c]) => {
          const a = layout.nodes[p];
          const b = layout.nodes[c];
          const cls = states[c] === 'mastered' ? 'bright' : states[c] !== 'locked' && states[p] !== 'locked' ? 'lit' : '';
          const dim = lit && !(lit.skills.has(cat.skills[p].id) && lit.skills.has(cat.skills[c].id)) ? 'dim' : '';
          return <line key={`${p}-${c}`} className={`sk-edge ${cls} ${dim}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
        {cat.skills.map((s, i) => {
          const n = layout.nodes[i];
          const st = states[i];
          const picked = sel?.kind === 'skill' && sel.id === s.id;
          const cls = ['skn', st, isBonus(s) ? 'bonus' : '', fresh.has(s.id) ? 'fresh' : '', picked ? 'sel' : '', lit && !lit.skills.has(s.id) ? 'dim' : '', lit && lit.skills.has(s.id) && sel?.kind === 'guide' ? 'hl' : ''].filter(Boolean).join(' ');
          const lines = labelLines(s.name);
          return (
            <g key={s.id} className={cls} transform={`translate(${n.x},${n.y})`} role="button" tabIndex={0} aria-label={`${s.name}, ${st}`} aria-pressed={picked}
              onClick={() => onPick('skill', s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick('skill', s.id); } }}>
              <rect className="skn-halo" x={-BOX.halo} y={-BOX.halo} width={BOX.halo * 2} height={BOX.halo * 2} rx="20" />
              <rect className="skn-hex" x={-BOX.r} y={-BOX.r} width={BOX.r * 2} height={BOX.r * 2} rx="15" />
              {st === 'mastered' && <path className="skn-ico" d="M-8 0 L-2 7 L9 -7" />}
              {st === 'locked' && <g className="skn-ico lock"><rect x="-6" y="-2" width="12" height="9" rx="2" /><path d="M-4 -2 V-5 a4 4 0 0 1 8 0 V-2" /></g>}
              {st === 'open' && <path className="skn-ico diamond" d="M0 -8 L7 0 L0 8 L-7 0 Z" />}
              <text className="skn-label" y={TREE.radius + 18}>{lines.map((l, k) => <tspan key={k} x="0" dy={k ? 12 : 0}>{l}</tspan>)}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function Detail({ sel, prog, onSubmit, onSkill, onPick, onClose }) {
  if (!sel) {
    return <div className="card sk-detail empty"><Sparkles size={18} /> Tap a guide to see which skills it grows, or a skill to see where you practise it.</div>;
  }
  if (sel.kind === 'guide') {
    const g = GUIDE_BY_ID.get(sel.id);
    const covered = skillsOfGuide(g.id).map(id => SKILL_BY_ID.get(id));
    const state = guideState(g.id, prog.guides, prog.skills);
    return (
      <div className="card sk-detail" role="region" aria-live="polite">
        <div>
          <h4>{g.label}<small>{g.kind === 'task' ? 'Home task' : 'Class guide'}</small></h4>
          <p className="sk-brief">{g.brief}</p>
          <p className="sk-meta"><span><Clock size={13} /> {g.minutes} min</span><span><BookOpen size={13} /> Practical Guidance, page {g.page}</span><span><Star size={13} /> {covered.length} skills</span></p>
          {g.tags.length > 0 && <p className="sk-tags">{g.tags.map(t => <span key={t}>{t}</span>)}</p>}
          <p className="sk-cov">{covered.length ? covered.map(s => <button type="button" key={s.id} onClick={() => onPick('skill', s.id)}>{s.name}</button>) : 'No skills matched this guide.'}</p>
        </div>
        <div className="sk-acts">
          <button type="button" className={`btn ${state === 'todo' ? 'p' : 'o'}`} onClick={() => onSubmit(g)}>{state === 'todo' ? <><Upload size={15} /> Submit evidence</> : state === 'submitted' ? <><Check size={15} /> Handed in. Tick your skills</> : <><Check size={15} /> Complete. View</>}</button>
          <button type="button" className="btn o sm" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  const s = SKILL_BY_ID.get(sel.id);
  const st = skillState(s, prog.guides, prog.skills);
  return (
    <div className="card sk-detail" role="region" aria-live="polite">
      <div>
        <h4>{s.name}<small>{st === 'mastered' ? 'Mastered' : st === 'locked' ? 'Locked' : isBonus(s) ? 'Bonus skill' : 'Unlocked'}</small></h4>
        {isBonus(s)
          ? <p className="sk-brief">No practical guide covers this one yet. Try it yourself, then tick it off when you can do it without help.</p>
          : (
            <>
              <p className="sk-brief">{st === 'locked' ? 'Hand in your evidence for one of these guides to unlock it:' : 'You practise it in:'}</p>
              <p className="sk-cov">{s.guides.map(id => { const g = GUIDE_BY_ID.get(id); return <button type="button" key={id} className={prog.guides.has(id) ? 'done' : ''} onClick={() => onPick('guide', id)}>{prog.guides.has(id) ? '✓ ' : ''}{g.label}</button>; })}</p>
            </>
          )}
      </div>
      <div className="sk-acts">
        <button type="button" className={`btn ${st === 'mastered' ? 'o' : 'p'}`} disabled={st === 'locked'} onClick={() => onSkill(s, st !== 'mastered')}>
          {st === 'mastered' ? <><Check size={15} /> Mastered. Undo</> : st === 'locked' ? <><Lock size={15} /> Locked</> : <><Check size={15} /> I can do this (+{XP_SKILL} XP)</>}
        </button>
        <button type="button" className="btn o sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}


const fmtSize = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fmtWhen = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Submissions: every practical guide in one list. Hand in your evidence, then tick the skills you really did. */
function GuideSubmissions({ prog, focus, onFocused, toast, onTree, flash }) {
  const [open, setOpen] = useState(focus || null);
  useEffect(() => { if (focus) { setOpen(focus); onFocused(); } }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = prog.submissions.size;
  return (
    <section className="sk-subs" aria-label="Guide submissions">
      <div className="card sk-flow">
        <ol>
          <li><b>1</b><span>Do the guide in class</span></li>
          <li><b>2</b><span>Submit your Evidence document and files</span></li>
          <li><b>3</b><span>Tick the skills you can do (+{XP_SKILL} XP each)</span></li>
          <li><b>4</b><span>Tick them all for the guide bonus (+{XP_GUIDE} XP)</span></li>
        </ol>
        <small>{done} of {GUIDES.length} guides handed in. Your teacher can see what you submit.</small>
      </div>
      {APPS.map(a => (
        <div className="card sk-sapp" key={a.id}>
          <h4>{a.name}<small>{GUIDES.filter(g => g.app === a.id && prog.submissions.has(g.id)).length}/{GUIDES.filter(g => g.app === a.id).length}</small></h4>
          {GUIDES.filter(g => g.app === a.id).map(g => (
            <GuideRow key={g.id} g={g} prog={prog} open={open === g.id} onToggle={() => setOpen(o => (o === g.id ? null : g.id))} toast={toast} onTree={onTree} flash={flash} />
          ))}
        </div>
      ))}
    </section>
  );
}

function GuideRow({ g, prog, open, onToggle, toast, onTree, flash }) {
  const sub = prog.submissions.get(g.id);
  const state = guideState(g.id, prog.guides, prog.skills);
  const skills = skillsOfGuide(g.id).map(id => SKILL_BY_ID.get(id));
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const ticked = skills.filter(x => prog.skills.has(x.id)).length;
  const legacy = prog.guides.has(g.id) && !sub; // marked done before submissions existed

  const pickFiles = (e) => { setFiles(Array.from(e.target.files || []).slice(0, 5)); };
  const send = async () => {
    if (!files.length && !sub) return toast('Choose your Evidence document or output files first.');
    setBusy(true);
    try {
      const res = await prog.submit(g.id, files, note || sub?.note || '');
      if (res === PREVIEW) toast(PREVIEW_NOTE);
      else { toast(sub ? 'Submission updated.' : 'Evidence handed in. Now tick the skills you can do.'); flash(skills.map(x => x.id)); setFiles([]); if (input.current) input.current.value = ''; }
    } catch (err) {
      toast(err?.message || "Couldn't upload that. Check the files and try again.");
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const tick = async (x, on) => {
    const res = await prog.set('skill', x.id, on);
    if (res === PREVIEW) return toast(PREVIEW_NOTE);
    if (!res) return toast("Couldn't save that. Please try again.");
    if (on) {
      const all = skills.every(k => k.id === x.id || prog.skills.has(k.id));
      toast(`${x.name} gained. +${XP_SKILL} XP${all ? ` · ${g.label} complete! +${XP_GUIDE} XP bonus` : ''}`);
      flash([x.id]);
    }
    return undefined;
  };
  const tickAll = async () => { for (const x of skills) if (!prog.skills.has(x.id)) await tick(x, true); };

  return (
    <article className={`sk-g ${state} ${open ? 'open' : ''}`}>
      <button type="button" className="sk-grow" onClick={onToggle} aria-expanded={open}>
        <span className="sk-gn">{state === 'complete' ? <Check size={16} strokeWidth={3} /> : state === 'submitted' || legacy ? <Paperclip size={15} /> : g.kind === 'task' ? <Flag size={14} /> : g.no}</span>
        <span className="sk-gt"><b>{g.label}</b><small>{g.brief}</small></span>
        <span className={`sk-st ${state}`}>{state === 'complete' ? 'Complete' : state === 'submitted' ? `Handed in · ${ticked}/${skills.length} skills` : legacy ? 'Marked done' : 'Not submitted'}</span>
      </button>
      {open && (
        <div className="sk-gbody">
          <p className="sk-meta"><span><Clock size={13} /> {g.minutes} min</span><span><BookOpen size={13} /> Practical Guidance, page {g.page}</span><span><Star size={13} /> {skills.length} skills</span></p>
          <div className="sk-up">
            <h5>{sub ? 'Your submission' : 'Submit your evidence'}</h5>
            {sub && (
              <ul className="sk-files">{sub.files.map(f => <li key={f.url}><FileText size={14} /><a href={`${API_ENDPOINTS.BASE_URL || ''}${f.url}`} target="_blank" rel="noreferrer">{f.name}</a><small>{fmtSize(f.size)}</small></li>)}
                <li className="when">Handed in {fmtWhen(sub.submittedAt)}{sub.updatedAt && sub.updatedAt !== sub.submittedAt ? ` · updated ${fmtWhen(sub.updatedAt)}` : ''}</li></ul>
            )}
            <label className="sk-drop"><Upload size={18} /><span>{files.length ? files.map(f => f.name).join(', ') : sub ? 'Choose new files to replace the old ones (optional)' : 'Choose your Evidence document and output files (up to 5)'}</span>
              <input ref={input} type="file" multiple accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt,.png,.jpg,.jpeg,.gif,.webp,.html" onChange={pickFiles} />
            </label>
            <textarea className="inp" rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder={sub?.note ? sub.note : 'A note for your teacher (optional): what you found hard'} aria-label="Note for your teacher" />
            <button type="button" className="btn p" disabled={busy || (!files.length && !sub && !legacy)} onClick={send}><Upload size={15} />{busy ? 'Uploading…' : sub ? 'Update submission' : 'Hand in'}</button>
          </div>
          <div className="sk-tick">
            <h5>Skills in this guide<small>{ticked}/{skills.length} ticked</small></h5>
            {!sub && !legacy && <p className="sk-lock"><Lock size={14} /> Hand in your evidence first, then you can tick your skills.</p>}
            <div className="sk-ticks">
              {skills.map(x => (
                <label key={x.id} className={`${prog.skills.has(x.id) ? 'on' : ''} ${!sub && !legacy ? 'off' : ''}`}>
                  <input type="checkbox" disabled={!sub && !legacy} checked={prog.skills.has(x.id)} onChange={e => tick(x, e.target.checked)} />
                  <i>{prog.skills.has(x.id) && <Check size={12} strokeWidth={3} />}</i>
                  <span>{x.name}</span>
                  <button type="button" className="sk-see" onClick={(e) => { e.preventDefault(); onTree(x.id); }} aria-label={`Show ${x.name} on the tree`}>tree</button>
                </label>
              ))}
            </div>
            {(sub || legacy) && ticked < skills.length && <button type="button" className="btn o sm" onClick={tickAll}>Tick all I can do</button>}
          </div>
        </div>
      )}
    </article>
  );
}
