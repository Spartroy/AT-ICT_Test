import React, { useCallback, useEffect, useRef, useState } from 'react';
import useMediaQuery, { useReducedMotion } from '../../hooks/useMediaQuery';
import { METHOD_STEPS } from './siteContent';
import { METHOD_PANELS } from './methodPanels';
import { SI } from './SiteLayout';

/**
 * Local progress (0-1) inside the current step. The animation completes at ~80% of the step
 * so the finished state is visible before the next step takes over.
 */
export function stepProgress(p, n) {
  const index = Math.min(n - 1, Math.floor(p * n));
  return { index, sp: Math.min((p * n - index) / 0.8, 1) };
}

/** Reveal the parts of panel `el` whose data-at threshold is ≤ sp; draw the roadmap for the plan panel. */
function paint(el, sp) {
  if (!el) return;
  el.querySelectorAll('[data-at]').forEach(node => node.classList.toggle('sh', sp >= Number(node.dataset.at)));
  const path = el.querySelector('#rpath');
  const runner = el.querySelector('#runner');
  if (path && runner && path.getTotalLength) {
    const L = path.getTotalLength();
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = L * (1 - sp);
    const q = path.getPointAtLength(L * sp);
    runner.setAttribute('cx', q.x);
    runner.setAttribute('cy', q.y);
    runner.style.opacity = sp > 0.96 ? 0 : 1;
  }
}

const Panel = React.forwardRef(function Panel({ index, on }, ref) {
  return <div ref={ref} className={`m-panel ${on ? 'on' : ''}`} aria-hidden={!on} dangerouslySetInnerHTML={{ __html: METHOD_PANELS[index] }} />;
});

/** "Why AT-ICT": 4 steps. Desktop: pinned 520vh section, scroll drives step + animation. ≤1000px: inline panels play once. */
export default function Method() {
  const mobile = useMediaQuery('(max-width: 1000px)');
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const barRef = useRef(null);
  const panelRefs = useRef([]);
  const [step, setStep] = useState(0);
  const n = METHOD_STEPS.length;

  // Desktop scroll engine.
  useEffect(() => {
    if (mobile) return undefined;
    let frame;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const travel = el.offsetHeight - window.innerHeight;
        const p = Math.min(Math.max(-el.getBoundingClientRect().top / travel, 0), 0.999);
        const { index, sp } = stepProgress(p, n);
        setStep(index);
        if (barRef.current) barRef.current.style.width = `${p * 100}%`;
        paint(panelRefs.current[index], reduced ? 1 : sp);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mobile, reduced, n]);

  // Mobile: each inline panel plays once (3.5s) when 35% visible.
  useEffect(() => {
    if (!mobile) return undefined;
    const played = new Set();
    const frames = [];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const i = panelRefs.current.indexOf(e.target);
      if (!e.isIntersecting || played.has(i)) return;
      played.add(i);
      if (reduced) return paint(e.target, 1);
      const t0 = performance.now();
      const tick = (t) => {
        const sp = Math.min((t - t0) / 3500, 1);
        paint(e.target, sp);
        if (sp < 1) frames.push(requestAnimationFrame(tick));
      };
      frames.push(requestAnimationFrame(tick));
    }), { threshold: 0.35 });
    panelRefs.current.forEach(p => p && io.observe(p));
    return () => { io.disconnect(); frames.forEach(cancelAnimationFrame); };
  }, [mobile, reduced]);

  const jumpTo = useCallback((i) => {
    const el = sectionRef.current;
    if (mobile || !el) return;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + (travel * (i + 0.5)) / n, behavior: reduced ? 'auto' : 'smooth' });
  }, [mobile, reduced, n]);

  const setPanelRef = (i) => (el) => { panelRefs.current[i] = el; };

  return (
    <section id="method" className="method" ref={sectionRef} aria-labelledby="method-title">
      <div className="m-stick">
        <div className="wrap">
          <div className="m-g">
            <div>
              <span className="eyebrow">Why AT-ICT</span>
              <h2 className="h2" id="method-title">Everything you need, <em>one platform.</em></h2>
              <p className="lead">Scroll through how a chapter goes from confusing to confident.</p>
              <div className="m-steps">
                {METHOD_STEPS.map((s, i) => (
                  <React.Fragment key={s.title}>
                    <button type="button" className={`m-step ${mobile || step === i ? 'on' : ''}`} aria-current={!mobile && step === i ? 'step' : undefined} onClick={() => jumpTo(i)}>
                      <span className="chip"><SI name={s.icon} /></span>
                      <span><h3>{s.title}</h3><p>{s.text}</p></span>
                    </button>
                    {mobile && <Panel ref={setPanelRef(i)} index={i} on />}
                  </React.Fragment>
                ))}
              </div>
              <div className="m-bar" aria-hidden="true"><i ref={barRef} /></div>
            </div>
            {!mobile && (
              <div className="m-vis" aria-live="polite">
                {METHOD_STEPS.map((s, i) => <Panel key={s.title} ref={setPanelRef(i)} index={i} on={step === i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
