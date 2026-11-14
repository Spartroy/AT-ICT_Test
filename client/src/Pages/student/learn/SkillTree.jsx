import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Clock, Flag, Lock, Sparkles, Star, Trophy } from 'lucide-react';
import { Loading, ErrorNote } from '../../../components/portal/kit';
import { useToast } from '../../../components/portal/PortalUI';
import { PREVIEW, PREVIEW_NOTE } from '../../../lib/learnPreview';
import { APPS } from './practicalSkills';
import usePracticalProgress from './usePracticalProgress';
import { GUIDE_BY_ID, SKILL_BY_ID, XP_GUIDE, XP_SKILL, appStats, guidesOfApp, isBonus, newlyUnlocked, overall, skillState, skillsOfGuide } from './skillTreeLogic';
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

  const finish = async (g, done) => {
    const unlocked = done ? newlyUnlocked(g.id, prog.guides) : 0;
    const res = await prog.set('guide', g.id, done);
    if (res === PREVIEW) return toast(PREVIEW_NOTE);
    if (!res) return toast("Couldn't save that. Please try again.");
    if (done) {
      flash(skillsOfGuide(g.id));
      toast(`${g.label} complete. +${XP_GUIDE} XP${unlocked ? ` · ${unlocked} skill${unlocked === 1 ? '' : 's'} unlocked` : ''}`);
    }
    return undefined;
  };

  const master = async (s, done) => {
    const res = await prog.set('skill', s.id, done);
    if (res === PREVIEW) return toast(PREVIEW_NOTE);
    if (!res) return toast("Couldn't save that. Please try again.");
    if (done) toast(`${s.name} mastered. +${XP_SKILL} XP`);
    return undefined;
  };

  const pick = (kind, id) => setSel(s => (s && s.kind === kind && s.id === id ? null : { kind, id }));

  return (
    <div className="sk" style={{ '--app': app.color }}>
      <header className="card sk-hero">
        <div className="sk-lv" aria-label={`Level ${all.level}`}><Trophy size={20} /><b>{all.level}</b><small>level</small></div>
        <div className="sk-herom">
          <h2>Practical skill tree</h2>
          <p>Finish a practical guide to unlock its skills, then tick them off when you can do them without help.</p>
          <div className="sk-xp" role="progressbar" aria-valuenow={all.percent} aria-valuemin={0} aria-valuemax={100} aria-label="XP to the next level"><i style={{ width: `${all.percent}%` }} /></div>
          <small>{all.xp} XP · {all.into}/{all.need} to level {all.level + 1} · {all.mastered}/{all.total} skills mastered</small>
        </div>
      </header>

      <div className="sk-apps" role="tablist" aria-label="Applications">
        {APPS.map(a => {
          const st = appStats(a, prog.guides, prog.skills);
          return (
            <button key={a.id} type="button" role="tab" aria-selected={a.id === appId} className={a.id === appId ? 'on' : ''} style={{ '--app': a.color }} onClick={() => { setAppId(a.id); setSel(null); }}>
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
          <span><Flag size={14} /> {stats.guidesDone}/{stats.guidesTotal} guides</span>
          <span><Sparkles size={14} /> {stats.xp} XP</span>
        </div>
        <div className="sk-bar"><i style={{ width: `${stats.percent}%` }} /></div>
      </section>

      <div className="sk-grid">
        <aside className="card sk-quests" aria-label="Practical guides">
          <h4>Quest line</h4>
          <ol>
            {guides.map(g => {
              const done = prog.guides.has(g.id);
              const cls = ['sk-q', done ? 'done' : '', sel?.kind === 'guide' && sel.id === g.id ? 'sel' : '', lit && !lit.guides.has(g.id) ? 'dim' : '', lit && lit.guides.has(g.id) && sel?.kind === 'skill' ? 'hl' : ''].filter(Boolean).join(' ');
              return (
                <li key={g.id} className={cls}>
                  <button type="button" onClick={() => pick('guide', g.id)} aria-pressed={sel?.kind === 'guide' && sel.id === g.id}>
                    <span className="sk-node">{done ? <Check size={16} strokeWidth={3} /> : g.kind === 'task' ? <Flag size={14} /> : g.no}</span>
                    <span className="sk-qt"><b>{g.label}</b><small>{g.kind === 'task' ? 'Home task' : 'Class guide'} · {g.minutes} min</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="sk-branches">
          {app.categories.map(c => {
            const got = c.skills.filter(s => prog.skills.has(s.id)).length;
            return (
              <section className="card sk-branch" key={c.id} aria-label={c.name}>
                <h4>{c.name}<small>{got}/{c.skills.length}</small></h4>
                <div className="sk-leaves">
                  {c.skills.map(s => {
                    const st = skillState(s, prog.guides, prog.skills);
                    const cls = ['sk-s', st, isBonus(s) ? 'bonus' : '', fresh.has(s.id) ? 'fresh' : '', sel?.kind === 'skill' && sel.id === s.id ? 'sel' : '', lit && !lit.skills.has(s.id) ? 'dim' : '', lit && lit.skills.has(s.id) && sel?.kind === 'guide' ? 'hl' : ''].filter(Boolean).join(' ');
                    return (
                      <button key={s.id} type="button" className={cls} onClick={() => pick('skill', s.id)} aria-pressed={sel?.kind === 'skill' && sel.id === s.id} aria-label={`${s.name}, ${st}`}>
                        <i>{st === 'mastered' ? <Check size={12} strokeWidth={3} /> : st === 'locked' ? <Lock size={11} /> : null}</i>{s.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Detail sel={sel} prog={prog} onGuide={finish} onSkill={master} onPick={pick} onClose={() => setSel(null)} />
    </div>
  );
}

function Detail({ sel, prog, onGuide, onSkill, onPick, onClose }) {
  if (!sel) {
    return <div className="card sk-detail empty"><Sparkles size={18} /> Tap a guide to see which skills it grows, or a skill to see where you practise it.</div>;
  }
  if (sel.kind === 'guide') {
    const g = GUIDE_BY_ID.get(sel.id);
    const covered = skillsOfGuide(g.id).map(id => SKILL_BY_ID.get(id));
    const done = prog.guides.has(g.id);
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
          <button type="button" className={`btn ${done ? 'o' : 'p'}`} onClick={() => onGuide(g, !done)}>{done ? <><Check size={15} /> Completed. Undo</> : <><Flag size={15} /> Mark as completed (+{XP_GUIDE} XP)</>}</button>
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
              <p className="sk-brief">{st === 'locked' ? 'Finish one of these guides to unlock it:' : 'You practise it in:'}</p>
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

