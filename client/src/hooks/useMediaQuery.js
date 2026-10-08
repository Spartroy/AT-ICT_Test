import { useEffect, useState } from 'react';

const query = (q) => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q) : null);

/** True while the media query matches; updates on change. */
export default function useMediaQuery(q) {
  const [matches, setMatches] = useState(() => !!query(q)?.matches);
  useEffect(() => {
    const mql = query(q);
    if (!mql) return undefined;
    const onChange = () => setMatches(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if (mql.removeListener) mql.removeListener(onChange);
    };
  }, [q]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
