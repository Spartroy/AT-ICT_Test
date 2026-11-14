import React, { useEffect, useState } from 'react';
import { AlertTriangle, Timer } from 'lucide-react';
import { sfx, vibrate } from './quizSound';

// What happens when a student does something the quiz does not allow:
//   1st time  a reminder (the box shakes like a wrong password)
//   2nd time  yellow card, quiz paused for 30 seconds
//   3rd time  second yellow card, 2 marks taken off
//   4th time  red card, sent off, marked on what is answered so far
export const PAUSE_SECONDS = 30;
export const PENALTY = 2;

export const REASONS = {
  leave: 'You left the quiz page',
  fullscreen: 'You left full screen',
  paste: 'You tried to paste',
  copy: 'You tried to copy',
  print: 'You tried to print',
  devtools: 'You tried to open the developer tools'
};

/** The step on the ladder for the Nth illegal action. */
export const levelFor = (n) => (n <= 1 ? 'reminder' : n === 2 ? 'yellow1' : n === 3 ? 'yellow2' : 'red');

function Whistle() {
  return (
    <svg className="qz-whistle" viewBox="0 0 120 80" aria-hidden="true">
      <g className="qz-waves" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M96 14 q8 8 0 16" /><path d="M104 8 q13 14 0 28" /><path d="M112 2 q18 20 0 40" />
      </g>
      <path d="M8 36 h58 a22 22 0 1 1 -14 38 l-4 -6 h-22 a8 8 0 0 1 -8 -8 v-14 z" fill="currentColor" />
      <circle cx="56" cy="56" r="8" fill="#fff4b3" />
      <rect x="2" y="32" width="26" height="8" rx="3" fill="currentColor" />
    </svg>
  );
}

/**
 * `event` = { n, level, reason }. Shown over the quiz; `onClose` resumes, `onSentOff` ends the quiz.
 * For a first yellow card the quiz stays covered until the 30 second pause is over.
 */
export default function DisciplineOverlay({ event, onClose, onSentOff }) {
  const { level, reason, n } = event;
  const [wait, setWait] = useState(level === 'yellow1' ? PAUSE_SECONDS : level === 'yellow2' || level === 'red' ? 3 : 0);

  useEffect(() => {
    if (level === 'reminder') { sfx.buzz(); vibrate([90, 50, 90, 50, 160]); }
    else if (level === 'red') { sfx.whistleLong(); vibrate([300, 100, 300, 100, 500]); }
    else { sfx.whistle(); vibrate([200, 80, 200]); }
  }, [level, n]);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const why = REASONS[reason] || 'That is not allowed during the quiz';

  if (level === 'reminder') {
    return (
      <div className="qz-veil" role="alertdialog" aria-modal="true" aria-labelledby="qz-d-t">
        <div className="qz-viol shake">
          <span className="qz-viol-ic"><AlertTriangle size={34} /></span>
          <h2 id="qz-d-t">Not allowed</h2>
          <p><b>{why}.</b> This has been recorded and your teacher can see it.</p>
          <p className="qz-viol-sub">Next time the quiz is paused and you get a yellow card.</p>
          <button type="button" className="btn p" onClick={onClose}>Back to the quiz</button>
        </div>
      </div>
    );
  }

  const red = level === 'red';
  const second = level === 'yellow2';
  return (
    <div className={`qz-veil ${red ? 'red' : 'yellow'}`} role="alertdialog" aria-modal="true" aria-labelledby="qz-d-t">
      <div className="qz-ref">
        <Whistle />
        <div className={`qz-card-pop ${red ? 'red' : 'yellow'} ${second ? 'two' : ''}`} aria-hidden="true" />
        <h2 id="qz-d-t">{red ? 'Red card. You are sent off.' : second ? 'Second yellow card' : 'Yellow card'}</h2>
        <p><b>{why}.</b>{' '}
          {red && 'The quiz ends now and is marked on the answers you have given so far.'}
          {second && `${PENALTY} marks have been taken off your total. One more and it is a red card.`}
          {level === 'yellow1' && 'The quiz is paused. The clock keeps running.'}
        </p>
        {level === 'yellow1' && (
          <div className="qz-pause" role="timer" aria-label="Pause time left"><Timer size={20} /><b>{wait}</b><small>seconds until you can carry on</small>
            <i style={{ width: `${(wait / PAUSE_SECONDS) * 100}%` }} />
          </div>
        )}
        {red
          ? <button type="button" className="btn p" disabled={wait > 0} onClick={onSentOff}>{wait > 0 ? `Please wait ${wait}…` : 'See my result'}</button>
          : <button type="button" className="btn p" disabled={wait > 0} onClick={onClose}>{wait > 0 ? (level === 'yellow1' ? `Paused ${wait}s` : `Wait ${wait}…`) : 'Back to the quiz'}</button>}
      </div>
    </div>
  );
}
