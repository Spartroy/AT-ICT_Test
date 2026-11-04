// Sound effects for the lore scroll, synthesised with Web Audio so no audio files are needed.
// Every function is a safe no-op where Web Audio is unavailable (tests, old browsers) or the visitor muted it.

const KEY = 'atict:lore:muted';

let ctx = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage unavailable */ }

const audio = () => {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try { ctx = new AC(); } catch { ctx = null; }
  return ctx;
};

/** Call from a user gesture (the key press or tap that opens the lore) so the browser allows sound. */
export function unlock() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export const isMuted = () => muted;
export function setMuted(value) {
  muted = !!value;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* storage unavailable */ }
}

const noise = (c, seconds) => {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
};

/** Run `build(c, out)` with a master gain, only when sound is on. */
const play = (volume, build) => {
  if (muted) return;
  const c = audio();
  if (!c) return;
  try {
    const out = c.createGain();
    out.gain.value = volume;
    out.connect(c.destination);
    build(c, out, c.currentTime);
  } catch { /* never let a sound break the page */ }
};

/** Paper sliding: filtered noise that sweeps up then settles. */
const paper = (seconds, volume, from, to) => play(volume, (c, out, t) => {
  const src = noise(c, seconds);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + seconds);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + seconds * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t); src.stop(t + seconds);
});

/** The scroll unrolling. */
export const unroll = () => paper(1.9, 0.5, 500, 2600);
/** The scroll rolling back up. */
export const rollUp = () => paper(0.9, 0.4, 2600, 500);
/** A short rustle as a new chapter appears. */
export const rustle = () => paper(0.35, 0.22, 1200, 3200);

/** A deep temple gong: a few slightly detuned partials with a long decay. */
export const gong = () => play(0.5, (c, out, t) => {
  [[110, 1], [165.5, 0.6], [233, 0.4], [331, 0.25]].forEach(([freq, amp]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + 3.3);
  });
});

/** The red seal being pressed: a low thump with a touch of noise. */
export const stamp = () => play(0.7, (c, out, t) => {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + 0.4);
  const n = noise(c, 0.08);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.4, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  n.connect(ng); ng.connect(out);
  n.start(t); n.stop(t + 0.09);
});
