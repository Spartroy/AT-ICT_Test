import { nextIndex, placeTip } from './tourLogic';

const tip = { w: 320, h: 160 };
const vp = { vw: 1200, vh: 800 };

describe('placeTip', () => {
  it('centres the card when there is no target', () => {
    expect(placeTip({ rect: null, tip, ...vp })).toMatchObject({ side: 'center', top: 320, left: 440 });
  });

  it('puts the card under a target near the top and points at its centre', () => {
    const rect = { top: 100, left: 500, width: 200, height: 60 };
    const p = placeTip({ rect, tip, ...vp });
    expect(p.side).toBe('bottom');
    expect(p.top).toBe(176);
    expect(p.arrow).toBe(160); // target centre x (600) − card left (440)
  });

  it('flips above a target at the bottom of the screen', () => {
    const p = placeTip({ rect: { top: 720, left: 500, width: 200, height: 60 }, tip, ...vp });
    expect(p.side).toBe('top');
    expect(p.top).toBe(720 - 16 - 160);
  });

  it('goes beside a tall sidebar item', () => {
    const p = placeTip({ rect: { top: 100, left: 12, width: 220, height: 700 }, tip, ...vp });
    expect(p.side).toBe('right');
    expect(p.left).toBe(12 + 220 + 16);
  });

  it('keeps the card inside the viewport horizontally', () => {
    const p = placeTip({ rect: { top: 100, left: 1150, width: 40, height: 40 }, tip, ...vp });
    expect(p.left + tip.w).toBeLessThanOrEqual(1200 - 12);
    expect(p.arrow).toBeLessThanOrEqual(tip.w - 22);
  });

  it('honours a preferred side when it fits', () => {
    const p = placeTip({ rect: { top: 400, left: 500, width: 200, height: 60 }, tip, ...vp, prefer: 'top' });
    expect(p.side).toBe('top');
  });
});

describe('nextIndex', () => {
  it('walks forward and back', () => {
    expect(nextIndex(2, 1, 5)).toBe(3);
    expect(nextIndex(2, -1, 5)).toBe(1);
  });
  it('skips unavailable steps and reports the ends', () => {
    expect(nextIndex(0, 1, 5, new Set([1, 2]))).toBe(3);
    expect(nextIndex(4, 1, 5)).toBe(-1);
    expect(nextIndex(0, -1, 5)).toBe(-1);
  });
});
