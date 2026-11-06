// Drag to reorder for the guide editor. Works with mouse, pen and touch (pointer events), no library.
//
// Every item that can be reordered carries `sortAttrs(list, index)`. A grip button calls `beginDrag` on
// pointer down: the item follows the pointer, the item underneath is outlined, and letting go calls
// `onMove(list, from, to)`. Items made of several elements (a table row) just repeat the same attributes.

export const sortKey = (list) => list.join('/');
export const sortAttrs = (list, i) => ({ 'data-sort-list': sortKey(list), 'data-sort-i': i });

const EDGE = 72; // px from the top/bottom of the scroller where dragging starts to scroll it

/** The nearest ancestor (or self) belonging to list `key`; nested lists with other keys are skipped. */
function ownerOf(node, key) {
  let n = node && node.closest ? node.closest('[data-sort-list]') : null;
  while (n && n.dataset.sortList !== key) n = n.parentElement ? n.parentElement.closest('[data-sort-list]') : null;
  return n;
}

export function beginDrag(e, list, from, onMove) {
  if (e.button !== undefined && e.button !== 0) return;
  const key = sortKey(list);
  const all = [...document.querySelectorAll('[data-sort-list]')].filter(el => el.dataset.sortList === key);
  const ofIndex = (i) => all.filter(el => Number(el.dataset.sortI) === i);
  const dragged = ofIndex(from);
  if (!dragged.length) return;
  e.preventDefault();

  const scroller = dragged[0].closest('.sg-screen-body') || document.scrollingElement;
  const startY = e.clientY;
  const startX = e.clientX;
  const startScroll = scroller.scrollTop;
  let x = startX;
  let y = startY;
  let over = from;
  let frame = 0;

  const mark = (i, on) => ofIndex(i).forEach(el => el.classList.toggle('sg-drop', on));
  const place = () => {
    const dx = x - startX;
    const dy = y - startY + (scroller.scrollTop - startScroll);
    dragged.forEach(el => { el.style.transform = `translate(${dx}px, ${dy}px)`; });
    const hit = document.elementFromPoint(x, y);
    const target = ownerOf(hit, key);
    const next = target ? Number(target.dataset.sortI) : over;
    if (next !== over) {
      mark(over, false);
      over = next;
      if (over !== from) mark(over, true);
    }
  };
  const tick = () => {
    const r = scroller.getBoundingClientRect ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    if (y < r.top + EDGE) scroller.scrollTop -= 14;
    else if (y > r.bottom - EDGE) scroller.scrollTop += 14;
    place();
    frame = requestAnimationFrame(tick);
  };
  const move = (ev) => { x = ev.clientX; y = ev.clientY; };
  const finish = (commit) => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('keydown', esc);
    document.body.classList.remove('sg-sorting');
    dragged.forEach(el => { el.style.transform = ''; el.classList.remove('sg-dragging'); });
    mark(over, false);
    if (commit && over !== from) onMove(list, from, over);
  };
  const up = () => finish(true);
  const cancel = () => finish(false);
  const esc = (ev) => { if (ev.key === 'Escape') finish(false); };

  document.body.classList.add('sg-sorting');
  dragged.forEach(el => el.classList.add('sg-dragging'));
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', esc);
  frame = requestAnimationFrame(tick);
}
