import { useEffect, useState } from 'react';

// Which practical activities this student has opened. Kept on this device only (nothing is sent to the server).
const KEY = 'atict.guide.tried';
const listeners = new Set();

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch { return []; }
};
let tried = load();

/** Remember that activity `id` was opened. */
export function markTried(id) {
  if (!id || tried.includes(id)) return;
  tried = [...tried, id];
  try { localStorage.setItem(KEY, JSON.stringify(tried)); } catch { /* the tick just won't survive a reload */ }
  listeners.forEach(fn => fn(tried));
}

/** The set of activity ids opened so far; re-renders when one is added. */
export function useTried() {
  const [ids, setIds] = useState(tried);
  useEffect(() => {
    listeners.add(setIds);
    setIds(tried);
    return () => { listeners.delete(setIds); };
  }, []);
  return new Set(ids);
}
