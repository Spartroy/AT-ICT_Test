import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { usePortalUI } from './PortalUI';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { nextIndex, placeTip } from './tourLogic';
import '../../styles/tour.css';

const PAD = 8;
const FIND_TIMEOUT = 2500;

/** First element matching `selector` that is actually on screen (the sidebar and the tab bar share targets). */
const findTarget = (selector) => {
  if (!selector) return null;
  return [...document.querySelectorAll(selector)].find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) || null;
};

const sameRect = (a, b) => (!a && !b) || (a && b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * Guided tour: dims the page, spotlights one element at a time and explains it in a card.
 * steps: [{ id, target?: CSS selector, path?: route under `base`, title, body, optional?, side?, cta? }].
 * Steps whose target never shows up (hidden at this screen size, no data yet) are skipped when `optional`,
 * otherwise the card is shown centred. `forced` (first login) hides Skip and ignores Esc, so the student sees it through.
 */
export default function Tour({ open, steps, base, onClose, forced = false }) {
  const { layer } = usePortalUI();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState(null);
  const [rect, setRect] = useState(null);
  const [tipSize, setTipSize] = useState({ w: 340, h: 200 });
  const [skipped, setSkipped] = useState(() => new Set());
  const [viewport, setViewport] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  const dir = useRef(1);
  const startPath = useRef(null);
  const tipRef = useRef(null);
  const nextRef = useRef(null);
  const step = open ? steps[index] : null;

  // Remember where the student was so the tour can put them back.
  useEffect(() => {
    if (open) { startPath.current = location.pathname; setIndex(0); setSkipped(new Set()); dir.current = 1; }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback((completed) => {
    const back = startPath.current;
    onClose?.(completed);
    if (back && back !== location.pathname) navigate(back);
  }, [onClose, navigate, location.pathname]);

  const go = useCallback((d) => {
    dir.current = d;
    const n = nextIndex(index, d, steps.length, skipped);
    if (n === -1) { if (d === 1) finish(true); return; }
    setIndex(n);
  }, [index, steps.length, skipped, finish]);

  // Bring the step's page up, then wait for its target to render.
  useEffect(() => {
    if (!step) return undefined;
    setTarget(null);
    const route = `${base}${step.path ? `/${step.path}` : ''}`;
    const moving = location.pathname !== route;
    if (moving) navigate(route);
    if (!step.target) return undefined;
    // Same page and nothing to point at (e.g. the points card is hidden on phones): don't make the student wait.
    const limit = step.optional && !moving ? 500 : FIND_TIMEOUT;
    let stopped = false;
    const started = Date.now();
    const look = () => {
      if (stopped) return;
      const el = findTarget(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        setTarget(el);
      } else if (Date.now() - started > limit) {
        if (step.optional) {
          setSkipped(s => new Set(s).add(index));
          const n = nextIndex(index, dir.current, steps.length, new Set([...skipped, index]));
          if (n === -1) finish(dir.current === 1); else setIndex(n);
        }
      } else {
        setTimeout(look, 100);
      }
    };
    look();
    return () => { stopped = true; };
  }, [step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the target while the page scrolls, resizes or animates.
  useEffect(() => {
    if (!open) return undefined;
    let raf;
    const tick = () => {
      setViewport(v => (v.vw === window.innerWidth && v.vh === window.innerHeight ? v : { vw: window.innerWidth, vh: window.innerHeight }));
      if (target && !document.contains(target)) setTarget(null);
      const r = target?.getBoundingClientRect();
      const next = r ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 } : null;
      setRect(prev => (sameRect(prev, next) ? prev : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, target]);

  useLayoutEffect(() => {
    const el = tipRef.current;
    if (el && (el.offsetWidth !== tipSize.w || el.offsetHeight !== tipSize.h)) setTipSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [tipSize.w, tipSize.h, index, open, viewport.vw]);

  useEffect(() => {
    if (step) nextRef.current?.focus({ preventScroll: true });
  }, [step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); if (!forced) finish(false); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Tab' && tipRef.current) {
        const f = [...tipRef.current.querySelectorAll('button:not([disabled])')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!tipRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, go, finish, forced]);

  if (!open || !step || !layer) return null;

  const total = steps.length;
  const isFirst = nextIndex(index, -1, total, skipped) === -1;
  const isLast = nextIndex(index, 1, total, skipped) === -1;
  const active = step.target ? rect : null;
  const pos = placeTip({ rect: active, tip: tipSize, ...viewport, prefer: step.side });
  const tipStyle = { top: pos.top, left: pos.left, '--arrow': `${pos.arrow}px` };

  return createPortal(
    <div className={`tour ${reduced ? 'calm' : ''}`} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      <div className="tour-block" />
      {active
        ? <div className="tour-spot" style={{ top: active.top, left: active.left, width: active.width, height: active.height }} />
        : <div className="tour-dim" />}
      <div ref={tipRef} className={`tour-tip side-${pos.side}`} style={tipStyle}>
        {active && <i className="tour-arrow" aria-hidden="true" />}
        <div className="tour-top">
          <span className="tour-count">{index + 1} / {total}</span>
          {!forced && <button type="button" className="tour-skip" onClick={() => finish(false)}>{isLast ? 'Close' : 'Skip tour'}</button>}
        </div>
        <div className="tour-copy" key={step.id}>
          <h3 id="tour-title">{step.title}</h3>
          <p id="tour-body">{step.body}</p>
        </div>
        <div className="tour-dots" aria-hidden="true">
          {steps.map((s, i) => <i key={s.id} className={i === index ? 'on' : i < index ? 'done' : ''} />)}
        </div>
        <div className="tour-acts">
          {!isFirst && <button type="button" className="btn o sm" onClick={() => go(-1)}><ArrowLeft className="i" aria-hidden="true" />Back</button>}
          <button type="button" ref={nextRef} className="btn p sm" onClick={() => go(1)}>
            {step.cta || (isLast ? 'Finish' : 'Next')}
            {isLast ? <Check className="i" aria-hidden="true" /> : <ArrowRight className="i" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>,
    layer
  );
}
