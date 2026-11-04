import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The AT-ICT lore easter egg (restored from the old About page).
 * Opened either by typing the code anywhere on the page, or by tapping "Simple" five times (phones),
 * which asks for the code. This is a wink for curious visitors, not security: the code is in the bundle.
 */
const CODE = '311220';
export const OPEN_LORE_PROMPT = 'atict:lore-prompt';

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

export default function Lore() {
  const [stage, setStage] = useState('closed'); // closed | prompt | story
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const typed = useRef('');
  const inputRef = useRef(null);
  const closeRef = useRef(null);

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

  // Escape closes; focus moves into the dialog and the page behind stops scrolling
  useEffect(() => {
    if (stage === 'closed') return undefined;
    const onEsc = (e) => { if (e.key === 'Escape') setStage('closed'); };
    document.addEventListener('keydown', onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (stage === 'prompt' ? inputRef : closeRef).current?.focus();
    return () => { document.removeEventListener('keydown', onEsc); document.body.style.overflow = prev; };
  }, [stage]);

  const submit = (e) => {
    e.preventDefault();
    if (value.trim() === CODE) { setValue(''); setStage('story'); } else { setValue(''); setWrong(true); }
  };

  if (stage === 'closed') return null;

  if (stage === 'prompt') {
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

  return (
    <div className="lore-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setStage('closed'); }}>
      <div className="lore" role="dialog" aria-modal="true" aria-labelledby="lore-t">
        <button ref={closeRef} type="button" className="lore-x" aria-label="Close lore" onClick={() => setStage('closed')}>✕</button>
        <header>
          <h2 id="lore-t">🏛️ The Chronicles of AT-ICT</h2>
          <p>A Tale of Innovation &amp; Rise</p>
        </header>

        <section>
          <h3>📜 The Origin Story</h3>
          <p>I was once an IGCSE student—quiet, introverted, unable to talk to anyone. I was extremely shy and often afraid to step out of my comfort zone.</p>
          <p>Everything changed on 31/12/2020. While playing football, I met the love of my life. She brought light into my world and gave me a reason to live with purpose. One day, as we were sharing our exam results, I told her I had scored an A+ in ICT. She was genuinely happy for me and, half-jokingly, said: <i>"You should teach ICT and compete with Mr. Safty."</i></p>
          <p>Months passed, and during my four-month gap between school and university, I remembered her words. I thought to myself: <i>"Why not try it?"</i> I began creating what I called my <b>interactive notes</b>, just for fun. I showed them to a few friends and to my mentor, Dr. Ahmad Hassan, my history teacher. Of course, I also told her—and she was thrilled. She called it creative and innovative, even saying she wished she had taken ICT so I could teach her. Her encouragement made me seriously consider becoming a teacher.</p>
          <p>What began as a small experiment turned into a mission. I completed all 13 chapters of the notes, then moved on to the <b>Practical Guidance</b>, <b>The Classified</b>, and <b>The Markscheme</b>. I worked every single day—no less than six hours daily—until the journey was complete.</p>
          <p>That’s how it all began. That’s how <b>AT-ICT</b> was born.</p>
        </section>

        <section>
          <h3>The First Student ⚡</h3>
          <p>Who was the very first student to join AT-ICT?</p>
          <p>It all began during a casual chat with my friends. I was explaining my plan to start teaching ICT, and word started to spread. One of my friends—a Math teacher—already knew my story. He told me, <i>"I know a girl who’s struggling with ICT and looking for a tutor. Since you’re starting out, I thought you could help her."</i> Then he said, <i>"Her name is Nuria. Here’s her father’s number—you can call him to arrange the details."</i></p>
          <p>That was the spark that lit the fire. Nuria became my very first student. She was Spanish, and at first, we struggled to communicate. Sometimes we had to rely on gestures, simple words, and even drawings to explain concepts. But slowly, lesson by lesson, we built understanding—not just of ICT, but of each other.</p>
          <p>I still remember one particular day during our Excel revision. I had given her a set of difficult questions, the kind that could easily overwhelm a student. She kept trying, making mistakes, and trying again. At one point, she paused, her eyes filling with tears—not from giving up, but from the frustration of wanting to get it right so badly. I encouraged her, reminded her how far she’d come, and guided her through it step by step. The moment she finally solved the problem, her tears turned into the biggest smile I had ever seen.</p>
          <p>I’ll never forget our last session before her exam. She looked at me, smiling, and said, <i>"Thanks for everything"</i> Such a simple sentence, yet it meant everything. All the effort, the hours of preparation, and the moments of frustration had led to this: a student who once struggled was now confident and ready.</p>
          <p>When the session ended, I walked away with a mix of pride and gratitude. I realized this wasn’t just about teaching ICT—it was about changing lives, starting with hers. And in that moment, I knew AT-ICT was no longer just an idea. It had truly begun.</p>
        </section>

        <footer>
          <p>"A Winner is just a Loser who tried one more time !"</p>
          <b>- AT-ICT Philosophy</b>
        </footer>
      </div>
    </div>
  );
}
