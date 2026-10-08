import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { DEFAULT_SITE, faqFor, makeWhatsappLink, navLinksOf, visibleSections } from './siteContent';

// Teacher-editable website content (Settings > Website). Fetched once per page load, defaults until it answers.
let cached = null;

const merge = (data) => ({
  ...DEFAULT_SITE,
  ...data,
  sections: { ...DEFAULT_SITE.sections, ...(data?.sections || {}) },
  banner: { ...DEFAULT_SITE.banner, ...(data?.banner || {}) }
});

const derive = (site) => {
  const sections = visibleSections(site);
  return { site, sections, navLinks: navLinksOf(sections), faq: faqFor(site), whatsappLink: makeWhatsappLink(site.whatsappNumber) };
};

const SiteContext = createContext(derive(DEFAULT_SITE));

export function SiteSettingsProvider({ children }) {
  const [site, setSite] = useState(() => cached || DEFAULT_SITE);

  useEffect(() => {
    if (cached) return undefined;
    let cancelled = false;
    fetch(API_ENDPOINTS.SETTINGS.SITE)
      .then(res => (res.ok ? res.json() : null))
      .then(body => {
        if (cancelled || !body?.data) return;
        cached = merge(body.data);
        setSite(cached);
      })
      .catch(() => {}); // keep the defaults when the API is unreachable
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => derive(site), [site]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/** { site, sections, navLinks, faq, whatsappLink(text) } for the public website. */
export const useSite = () => useContext(SiteContext);
