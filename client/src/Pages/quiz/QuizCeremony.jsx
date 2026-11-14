import React, { useEffect, useRef, useState } from 'react';
import { Check, ScrollText } from 'lucide-react';
import { sfx } from './quizSound';

export const PLEDGE_LINES = [
  'I will do this quiz on my own, with my own brain.',
  'I will not use notes, books, other websites, other people or any AI tool unless my teacher says I can.',
  'I will stay on this page. If I leave it, my teacher will be able to see.',
  'I understand that leaving, copying, pasting or printing counts as an illegal action, and that repeated illegal actions earn a yellow card, a mark penalty and then a red card.',
  'I am doing this quiz to find out what I really know, so I will be honest.'
];

/**
 * The honesty pledge on a scroll. Unrolls, waits for the tick, draws the student's signature, rolls up again.
 * `onSigned` fires once the scroll has closed.
 */
export function PledgeScroll({ name, onSigned, onCancel }) {
  const [phase, setPhase] = useState('opening'); // opening | open | signing | closing
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => {
    sfx.scroll();
    later(() => setPhase('open'), 900);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const agree = (on) => {
    if (!on || phase !== 'open') return;
    setPhase('signing');
    sfx.pen();
    later(() => { setPhase('closing'); sfx.scroll(); }, 2600);
    later(() => onSigned(), 3500);
  };

  const sign = (name || '').trim() || 'Student';
  return (
    <div className="qz-veil" role="dialog" aria-modal="true" aria-label="Honesty pledge">
      <div className={`qz-scroll-wrap ${phase}`}>
        <div className="qz-roller top" aria-hidden="true" />
        <div className="qz-parchment">
          <div className="qz-parch-in">
            <h2><ScrollText size={22} /> The Honesty Pledge</h2>
            <ol>{PLEDGE_LINES.map(l => <li key={l}>{l}</li>)}</ol>
            <label className="qz-agree">
              <input type="checkbox" checked={phase !== 'open'} disabled={phase !== 'open'} onChange={e => agree(e.target.checked)} />
              <span>I have read this and I promise.</span>
              {phase === 'open' && <i className="qz-tickhint" aria-hidden="true"><Check size={14} /> tick to sign</i>}
            </label>
            <div className={`qz-sign ${phase === 'signing' || phase === 'closing' ? 'go' : ''}`} aria-live="polite">
              <span className="qz-x">✕</span>
              <svg viewBox="0 0 420 90" aria-label={`Signed: ${sign}`} role="img">
                <defs><clipPath id="qz-sigclip"><rect className="qz-sigwipe" x="0" y="0" width="420" height="90" /></clipPath></defs>
                <text x="10" y="56" className="qz-sigtext" clipPath="url(#qz-sigclip)">{sign}</text>
                <path className="qz-sigline" d="M8 70 C 90 80, 170 62, 240 70 S 360 76, 412 62" />
              </svg>
            </div>
          </div>
        </div>
        <div className="qz-roller bottom" aria-hidden="true" />
        {phase === 'open' && <button type="button" className="btn o sm qz-scroll-x" onClick={onCancel}>Not now</button>}
      </div>
    </div>
  );
}

/** F1-style start: five lights, then a big 3, 2, 1, GO with a beep each. `onGo` fires on GO. */
export function StartCountdown({ onGo }) {
  const [n, setN] = useState(3);
  const goRef = useRef(onGo);
  goRef.current = onGo;
  useEffect(() => {
    sfx.count();
    const steps = [setTimeout(() => { setN(2); sfx.count(); }, 1000), setTimeout(() => { setN(1); sfx.count(); }, 2000), setTimeout(() => { setN(0); sfx.go(); goRef.current(); }, 3000)];
    return () => steps.forEach(clearTimeout);
  }, []);
  const lit = n === 3 ? 2 : n === 2 ? 4 : n === 1 ? 5 : 0;
  return (
    <div className="qz-veil qz-f1" role="alert" aria-live="assertive">
      <div className="qz-lights" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} className={i < lit ? 'on' : ''} />)}</div>
      <div key={n} className={`qz-bignum ${n === 0 ? 'go' : ''}`}>{n === 0 ? 'GO!' : n}</div>
    </div>
  );
}
