// Small sound effects for the quiz (made with the browser's audio, so there are no files to load).
// Browsers only allow sound after a tap, so `unlockAudio()` is called from the Start button.

let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no sound is fine */ }
}

function tone({ freq = 440, dur = 0.2, type = 'sine', gain = 0.18, when = 0, to }) {
  if (!ctx) return;
  try {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch { /* ignore */ }
}

/** A referee whistle: a high tone with a fast wobble. */
function whistle(len = 0.9) {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(2500, t);
    o.frequency.linearRampToValueAtTime(2850, t + len * 0.5);
    lfo.frequency.value = 34;
    lfoGain.gain.value = 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.setValueAtTime(0.16, t + len - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t); lfo.start(t);
    o.stop(t + len + 0.05); lfo.stop(t + len + 0.05);
  } catch { /* ignore */ }
}

export const sfx = {
  /** One beep of the 3-2-1 countdown (lower each time, like the start lights). */
  count: () => tone({ freq: 520, dur: 0.22, type: 'square', gain: 0.12 }),
  go: () => { tone({ freq: 1040, dur: 0.5, type: 'square', gain: 0.14 }); tone({ freq: 1560, dur: 0.5, type: 'sine', gain: 0.1, when: 0.02 }); },
  /** The pen scratching while the signature is drawn. */
  pen: () => { for (let i = 0; i < 9; i++) tone({ freq: 700 + Math.random() * 500, dur: 0.07, type: 'sawtooth', gain: 0.025, when: i * 0.15 }); },
  scroll: () => tone({ freq: 220, dur: 0.45, type: 'triangle', gain: 0.1, to: 110 }),
  /** The "wrong password" buzz. */
  buzz: () => { tone({ freq: 160, dur: 0.16, type: 'square', gain: 0.13 }); tone({ freq: 140, dur: 0.22, type: 'square', gain: 0.13, when: 0.2 }); },
  whistle,
  /** Two-tone siren for the teacher's radar; longer and louder the worse the incident. */
  alarm: (level = 'reminder') => {
    const cycles = level === 'red' ? 5 : level === 'yellow2' ? 4 : level === 'yellow1' ? 3 : 2;
    for (let i = 0; i < cycles; i++) {
      tone({ freq: 880, dur: 0.18, type: 'square', gain: level === 'red' ? 0.2 : 0.12, when: i * 0.4 });
      tone({ freq: 620, dur: 0.18, type: 'square', gain: level === 'red' ? 0.2 : 0.12, when: i * 0.4 + 0.2 });
    }
  },
  whistleLong: () => { whistle(0.55); setTimeout(() => whistle(1.1), 700); }
};

/** Phone buzz where the device supports it. */
export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignore */ }
}
