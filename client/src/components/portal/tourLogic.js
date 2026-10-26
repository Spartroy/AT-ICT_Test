/** Geometry for the guided tour: where the annotation card goes relative to the spotlighted element. */

const SIDES = ['bottom', 'top', 'right', 'left'];

const fits = (side, r, tip, vw, vh, gap, margin) => {
  switch (side) {
    case 'bottom': return vh - r.bottom - gap - margin >= tip.h && tip.w + margin * 2 <= vw;
    case 'top': return r.top - gap - margin >= tip.h && tip.w + margin * 2 <= vw;
    case 'right': return vw - r.right - gap - margin >= tip.w;
    default: return r.left - gap - margin >= tip.w;
  }
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * rect: { top, left, width, height } of the target (viewport coordinates, already padded).
 * tip: { w, h } of the card. Returns { top, left, side, arrow } where `arrow` is the offset (px) of the
 * pointer along the card's edge so it keeps pointing at the target's centre. With no rect the card is centred.
 */
export function placeTip({ rect, tip, vw, vh, gap = 16, margin = 12, prefer }) {
  if (!rect) return { top: Math.max(margin, (vh - tip.h) / 2), left: Math.max(margin, (vw - tip.w) / 2), side: 'center', arrow: 0 };
  const r = { top: rect.top, left: rect.left, right: rect.left + rect.width, bottom: rect.top + rect.height };
  const order = prefer ? [prefer, ...SIDES.filter(s => s !== prefer)] : SIDES;
  const side = order.find(s => fits(s, r, tip, vw, vh, gap, margin)) || 'bottom';
  const cx = r.left + rect.width / 2;
  const cy = r.top + rect.height / 2;
  let top;
  let left;
  if (side === 'bottom' || side === 'top') {
    left = clamp(cx - tip.w / 2, margin, vw - tip.w - margin);
    top = side === 'bottom' ? r.bottom + gap : r.top - gap - tip.h;
  } else {
    top = clamp(cy - tip.h / 2, margin, vh - tip.h - margin);
    left = side === 'right' ? r.right + gap : r.left - gap - tip.w;
  }
  // No side has room (a huge target): sit at the bottom of the screen, still readable.
  if (!order.some(s => fits(s, r, tip, vw, vh, gap, margin))) {
    top = clamp(vh - tip.h - margin, margin, vh);
    left = clamp(cx - tip.w / 2, margin, vw - tip.w - margin);
    return { top, left, side: 'over', arrow: 0 };
  }
  const arrow = side === 'bottom' || side === 'top' ? clamp(cx - left, 22, tip.w - 22) : clamp(cy - top, 22, tip.h - 22);
  return { top, left, side, arrow };
}

/** Index of the next step in `dir` (1 or -1) that is not in `skipped`, or -1 when none is left. */
export function nextIndex(index, dir, count, skipped = new Set()) {
  let i = index + dir;
  while (i >= 0 && i < count && skipped.has(i)) i += dir;
  return i >= 0 && i < count ? i : -1;
}
