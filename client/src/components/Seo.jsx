import { useEffect } from 'react';

const SITE_URL = (
  process.env.REACT_APP_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://at-ict-test.vercel.app')
).replace(/\/$/, '');

const SITE_NAME = 'AT-ICT';
const SITE_FULL_NAME = 'AT-ICT — IGCSE ICT Mastery';

const ensureMetaName = (name, content) => {
  if (!content) return null;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
    created = true;
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return { el, created, previous };
};

const ensureMetaProperty = (property, content) => {
  if (!content) return null;
  let el = document.head.querySelector(`meta[property="${property}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
    created = true;
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return { el, created, previous };
};

const ensureLink = (rel, href) => {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
    created = true;
  }
  const previous = el.getAttribute('href');
  el.setAttribute('href', href);
  return { el, created, previous };
};

const Seo = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noIndex = false
}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_FULL_NAME;
    const previousTitle = document.title;
    document.title = fullTitle;

    const url = `${SITE_URL.replace(/\/$/, '')}${path}`;
    const ogImage = image || `${SITE_URL.replace(/\/$/, '')}/favicon.ico`;

    const tracked = [
      ensureMetaName('description', description),
      ensureMetaProperty('og:title', fullTitle),
      ensureMetaProperty('og:description', description),
      ensureMetaProperty('og:type', type),
      ensureMetaProperty('og:url', url),
      ensureMetaProperty('og:site_name', SITE_FULL_NAME),
      ensureMetaProperty('og:image', ogImage),
      ensureMetaName('twitter:card', 'summary_large_image'),
      ensureMetaName('twitter:title', fullTitle),
      ensureMetaName('twitter:description', description),
      ensureMetaName('twitter:image', ogImage),
      ensureLink('canonical', url),
      noIndex ? ensureMetaName('robots', 'noindex, nofollow') : null
    ].filter(Boolean);

    let jsonLdScript = null;
    if (jsonLd) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.dataset.seo = 'page';
      jsonLdScript.text = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = previousTitle;
      tracked.forEach(({ el, created, previous }) => {
        if (created) {
          el.parentNode && el.parentNode.removeChild(el);
        } else if (previous !== undefined && previous !== null) {
          if (el.tagName === 'LINK') el.setAttribute('href', previous);
          else el.setAttribute('content', previous);
        }
      });
      if (jsonLdScript && jsonLdScript.parentNode) {
        jsonLdScript.parentNode.removeChild(jsonLdScript);
      }
    };
  }, [title, description, path, image, type, jsonLd, noIndex]);

  return null;
};

export default Seo;
