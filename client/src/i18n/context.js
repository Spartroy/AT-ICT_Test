import { createContext, useContext } from 'react';

/**
 * Tiny translation layer. The English text itself is the key: t('Homework') returns the Arabic when the portal is in
 * Arabic and the dictionary knows the phrase, otherwise the English as written. {name} placeholders are filled from vars.
 * Without a provider (teacher and student portals) every call returns the English text, so those portals are unchanged.
 */
export const interpolate = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : text);

/** Wraps text values in Unicode isolates so an English name or amount inside an Arabic sentence keeps its own direction. */
export const isolate = (vars) => (vars
  ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === 'string' && /[^\d\s.,:/-]/.test(v) ? `\u2068${v}\u2069` : v]))
  : vars);

export const LANGS = {
  en: { label: 'English', short: 'EN', dir: 'ltr', locale: 'en-GB' },
  ar: { label: 'العربية', short: 'ع', dir: 'rtl', locale: 'ar-EG-u-nu-latn' } // Western digits keep amounts and dates easy to read
};

const fallback = {
  lang: 'en',
  dir: 'ltr',
  locale: 'en-GB',
  switching: false,
  setLang: () => {},
  t: (text, vars) => interpolate(text, vars),
  fmtDate: (d, opts = { month: 'short', day: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-GB', opts) : '—'),
  fmtDateTime: (d) => (d ? new Date(d).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
};

export const LanguageContext = createContext(fallback);
export const useLang = () => useContext(LanguageContext);

