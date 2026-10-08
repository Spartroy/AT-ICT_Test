import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The home page and its auth modal share one page: opening / closing the modal must not jump to the top.
const HOME_PATHS = ['/', '/signin', '/register'];

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (hash) return;
    if (HOME_PATHS.includes(from) && HOME_PATHS.includes(pathname)) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
