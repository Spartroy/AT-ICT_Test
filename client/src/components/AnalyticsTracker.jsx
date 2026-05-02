import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible('pageview', { u: window.location.href });
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default AnalyticsTracker;
