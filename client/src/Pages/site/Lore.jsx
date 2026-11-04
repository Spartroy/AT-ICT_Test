import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as sfx from './loreSound';

/**
 * The AT-ICT lore easter egg (restored from the old About page).
 * Opened either by typing the code anywhere on the page, or by tapping "Simple" five times (phones),
 * which asks for the code. The story unrolls like a scroll, with synthesised sound effects (loreSound.js).
 * This is a wink for curious visitors, not security: the code is in the bundle.
 */
const CODE = '311220';
export const OPEN_LORE_PROMPT = 'atict:lore-prompt';


/** Shown for chapters that are not written yet. */
const PLACEHOLDER = [<>The ink is still drying on this chapter. Check back soon.</>];

/** The scroll's chapters. Add a chapter here and it appears on the scroll. */
const CHAPTERS = [
  {
    id: 'origin', title: 'The Origin Story', num: 'Chapter I',
    paras: [
      <>I was once an IGCSE student—quiet, introverted, unable to talk to anyone. I was extremely shy and often afraid to step out of my comfort zone.</>,
      <>Everything changed on 31/12/2020. While playing football, I met the love of my life. She brought light into my world and gave me a reason to live with purpose. One day, as we were sharing our exam results, I told her I had scored an A+ in ICT. She was genuinely happy for me and, half-jokingly, said: <i>"You should teach ICT and compete with Mr. Safty."</i></>,
      <>Months passed, and during my four-month gap between school and university, I remembered her words. I thought to myself: <i>"Why not try it?"</i> I began creating what I called my <b>interactive notes</b>, just for fun. I showed them to a few friends and to my mentor, Dr. Ahmad Hassan, my history teacher. Of course, I also told her—and she was thrilled. She called it creative and innovative, even saying she wished she had taken ICT so I could teach her. Her encouragement made me seriously consider becoming a teacher.</>,
      <>What began as a small experiment turned into a mission. I completed all 13 chapters of the notes, then moved on to the <b>Practical Guidance</b>, <b>The Classified</b>, and <b>The Markscheme</b>. I worked every single day—no less than six hours daily—until the journey was complete.</>,
      <>That’s how it all began. That’s how <b>AT-ICT</b> was born.</>
    ]
  },
  {
    id: 'first-student', title: 'The First Student', num: 'Chapter II',
    paras: [
      <>Who was the very first student to join AT-ICT?</>,
      <>It all began during a casual chat with my friends. I was explaining my plan to start teaching ICT, and word started to spread. One of my friends—a Math teacher—already knew my story. He told me, <i>"I know a girl who’s struggling with ICT and looking for a tutor. Since you’re starting out, I thought you could help her."</i> Then he said, <i>"Her name is Nuria. Here’s her father’s number—you can call him to arrange the details."</i></>,
      <>That was the spark that lit the fire. Nuria became my very first student. She was Spanish, and at first, we struggled to communicate. Sometimes we had to rely on gestures, simple words, and even drawings to explain concepts. But slowly, lesson by lesson, we built understanding—not just of ICT, but of each other.</>,
      <>I still remember one particular day during our Excel revision. I had given her a set of difficult questions, the kind that could easily overwhelm a student. She kept trying, making mistakes, and trying again. At one point, she paused, her eyes filling with tears—not from giving up, but from the frustration of wanting to get it right so badly. I encouraged her, reminded her how far she’d come, and guided her through it step by step. The moment she finally solved the problem, her tears turned into the biggest smile I had ever seen.</>,
      <>I’ll never forget our last session before her exam. She looked at me, smiling, and said, <i>"Thanks for everything"</i> Such a simple sentence, yet it meant everything. All the effort, the hours of preparation, and the moments of frustration had led to this: a student who once struggled was now confident and ready.</>,
      <>When the session ended, I walked away with a mix of pride and gratitude. I realized this wasn’t just about teaching ICT—it was about changing lives, starting with hers. And in that moment, I knew AT-ICT was no longer just an idea. It had truly begun.</>
    ]
  },
  // Placeholders: replace `paras` with the real story, and delete PLACEHOLDER from a chapter once it is written.
  ...[
    ['notes', 'The Notes Take Shape', 'Chapter III'],
    ['mentor', 'The Mentor', 'Chapter IV'],
    ['doubt', 'The Doubt', 'Chapter V'],
    ['growth', 'The Growth', 'Chapter VI'],
    ['results', 'First Great Results', 'Chapter VII'],
    ['platform', 'The Platform', 'Chapter VIII'],
    ['promise', 'The Promise', 'Chapter IX']
  ].map(([id, title, num]) => ({ id, title, num, paras: PLACEHOLDER }))
];

const typing = (el) => !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Wrap a trigger: returns an onClick that opens the code prompt on the 5th tap within a few seconds. */
export function useLoreTaps() {
  const taps = useRef({ n: 0, t: 0 });
  return useCallback(() => {
    const now = Date.now();
    taps.current = { n: now - taps.current.t > 4000 ? 1 : taps.current.n + 1, t: now };
    if (taps.current.n >= 5) {
      taps.current = { n: 0, t: 0 };
      window.dispatchEvent(new Event(OPEN_LORE_PROMPT));
    }
  }, []);
}

/** Rises into view once (calls onFirst the first time), or immediately where IntersectionObserver is missing. */
function useReveal(rootRef, deps) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const items = [...root.querySelectorAll('[data-ink]')];
    const show = (el) => { el.classList.add('in'); el.dispatchEvent(new CustomEvent('ink')); };
    if (typeof IntersectionObserver === 'undefined') { items.forEach(show); return undefined; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }), { root, threshold: 0.35 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** The scroll itself: unrolls, gongs, writes itself as you read, and ends with the red seal. */
function Scroll({ onClose }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(sfx.isMuted());
  const paperRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    sfx.unlock();
    sfx.unroll();
    const t0 = requestAnimationFrame(() => setOpen(true));
    const t1 = setTimeout(sfx.gong, 1500);
    const t2 = setTimeout(() => setReady(true), 2300);
    closeRef.current?.focus();
    return () => { cancelAnimationFrame(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Chapter titles rustle in; the seal thumps
  useEffect(() => {
    const root = paperRef.current;
    if (!root) return undefined;
    const onInk = (e) => { if (e.target.dataset.sfx === 'rustle') sfx.rustle(); if (e.target.dataset.sfx === 'stamp') sfx.stamp(); };
    root.addEventListener('ink', onInk, true);
    return () => root.removeEventListener('ink', onInk, true);
  }, []);
  useReveal(paperRef, [open]);

  const toggleSound = () => { const next = !muted; sfx.setMuted(next); setMuted(next); if (!next) { sfx.unlock(); sfx.rustle(); } };
  const close = () => { sfx.rollUp(); onClose(); };
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="lore-back" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="lore-embers" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.9) % 9}s`, animationDuration: `${7 + (i % 5)}s` }} />)}
      </div>
      <div className={`lore ${open ? 'open' : ''} ${ready ? 'ready' : ''}`} role="dialog" aria-modal="true" aria-labelledby="lore-t">
        <button type="button" className="lore-snd" aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted} onClick={toggleSound}>{muted ? '🔇' : '🔊'}</button>
        <button ref={closeRef} type="button" className="lore-x" aria-label="Close lore" onClick={close}>✕</button>
        <div className="lore-roller" aria-hidden="true" />
        <div className="lore-paper" ref={paperRef}>
          <div className="lore-body">
            <header className="lore-head">
              <h2 id="lore-t">The Chronicles of AT-ICT</h2>
              <p>A Tale of Innovation &amp; Rise</p>
              <span className="lore-orn" aria-hidden="true" />
            </header>

            {CHAPTERS.map((c) => (
              <section className="lore-chap" key={c.id} aria-labelledby={`lore-${c.id}`}>
                <span className="lore-num lore-ink" data-ink data-sfx="rustle">{c.num}</span>
                <h3 id={`lore-${c.id}`} className="lore-ink" data-ink>{c.title}</h3>
                {c.paras.map((p, i) => <p key={i} className="lore-ink" data-ink>{p}</p>)}
              </section>
            ))}

            <footer className="lore-end">
              <p className="lore-ink" data-ink>"A Winner is just a Loser who tried one more time !"</p>
              <b className="lore-ink" data-ink>- AT-ICT Philosophy</b>
              <div className="lore-seal" data-ink data-sfx="stamp" aria-hidden="true">AT</div>
            </footer>
          </div>
        </div>
        <div className="lore-roller" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function Lore() {
  const [stage, setStage] = useState('closed'); // closed | prompt | story
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const typed = useRef('');
  const inputRef = useRef(null);

  // Typing the code anywhere on the page
  useEffect(() => {
    const onKey = (e) => {
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      typed.current = (typed.current + e.key).slice(-CODE.length);
      if (typed.current === CODE) { typed.current = ''; setStage('story'); }
    };
    const onPrompt = () => { setValue(''); setWrong(false); setStage('prompt'); };
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_LORE_PROMPT, onPrompt);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener(OPEN_LORE_PROMPT, onPrompt); };
  }, []);

  // The page behind stops scrolling while anything is open; the prompt handles its own Escape and focus
  useEffect(() => {
    if (stage === 'closed') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let onEsc;
    if (stage === 'prompt') {
      onEsc = (e) => { if (e.key === 'Escape') setStage('closed'); };
      document.addEventListener('keydown', onEsc);
      inputRef.current?.focus();
    }
    return () => { document.body.style.overflow = prev; if (onEsc) document.removeEventListener('keydown', onEsc); };
  }, [stage]);

  const submit = (e) => {
    e.preventDefault();
    if (value.trim() === CODE) { setValue(''); setStage('story'); } else { setValue(''); setWrong(true); }
  };

  if (stage === 'closed') return null;
  if (stage === 'story') return <Scroll onClose={() => setStage('closed')} />;

  return (
    <div className="lore-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setStage('closed'); }}>
      <form className="lore-ask" role="dialog" aria-modal="true" aria-labelledby="lore-ask-t" onSubmit={submit}>
        <p id="lore-ask-t"><b>You found an easter egg!</b><br />Enter the password to reveal the lore.</p>
        <input ref={inputRef} type="password" inputMode="numeric" autoComplete="off" value={value} onChange={(e) => { setValue(e.target.value); setWrong(false); }} placeholder="Enter password…" aria-label="Password" aria-invalid={wrong} />
        {wrong && <span className="lore-err" role="alert">That's not it. Try again.</span>}
        <div className="lore-btns">
          <button type="submit" className="btn">Submit</button>
          <button type="button" className="btn ghost" onClick={() => setStage('closed')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
