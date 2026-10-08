// Canvas confetti for the registration success state (design/website/register.js).
// Skipped entirely for users who prefer reduced motion.

const COLOR_TOKENS = ['--crimson-500', '--gold-500', '--gold-300', '--white', '--crimson-glow', '--crimson-700'];

export const prefersReducedMotion = () =>
  typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fires the burst sequence from `originRect` (the card). Returns a cancel function.
 */
export function fireConfetti(originRect) {
  if (prefersReducedMotion()) return () => {};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return () => {};

  const styles = getComputedStyle(document.documentElement);
  const colors = COLOR_TOKENS.map(t => styles.getPropertyValue(t).trim()).filter(Boolean);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '200' });
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const particles = [];
  const burst = (x, y, n, a0, a1, v0, v1) => {
    for (let i = 0; i < n; i++) {
      const a = ((a0 + Math.random() * (a1 - a0)) * Math.PI) / 180;
      const v = v0 + Math.random() * (v1 - v0);
      particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.35,
        c: colors[i % colors.length],
        round: Math.random() < 0.25,
        t: 0
      });
    }
  };

  const r = originRect || { left: W / 2, top: H / 3, width: 0 };
  burst(r.left + r.width / 2, r.top + 120, 150, -160, -20, 6, 17);
  const timers = [
    setTimeout(() => {
      burst(0, H * 0.8, 70, -80, -35, 10, 19);
      burst(W, H * 0.8, 70, -145, -100, 10, 19);
    }, 350),
    setTimeout(() => burst(W / 2, -10, 80, 60, 120, 2, 6), 900)
  ];

  const tEnd = performance.now() + 1400;
  let frame;
  const cleanup = () => {
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    canvas.remove();
  };
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    particles.forEach(p => {
      p.vy += 0.28;
      p.vx *= 0.992;
      p.vy *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.t++;
      if (p.y >= H + 30) return;
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.t / 260);
      ctx.fillStyle = p.c;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 1.2, 0, 7);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    if (alive || performance.now() < tEnd) frame = requestAnimationFrame(tick);
    else cleanup();
  };
  frame = requestAnimationFrame(tick);
  return cleanup;
}
