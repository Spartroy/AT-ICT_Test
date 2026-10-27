import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { BookLoader } from '../components/portal/kit';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { LANGS, LanguageContext, interpolate, isolate, useLang } from './context';

export { useLang };

const readStored = (key, dictionaries) => {
  try {
    const v = localStorage.getItem(key);
    return dictionaries[v] ? v : 'en';
  } catch {
    return 'en';
  }
};

/**
 * Holds the portal language. Switching shows a full-screen loading screen: the language swaps while it covers the page,
 * so the layout flipping to right-to-left is never seen half-done.
 * dictionaries: { ar: { 'English text': 'Arabic text' } }.
 */
export function LanguageProvider({ dictionaries, storageKey, children }) {
  const all = useMemo(() => ({ en: {}, ...dictionaries }), [dictionaries]);
  const reduced = useReducedMotion();
  const [lang, setLangState] = useState(() => readStored(storageKey, all));
  const [target, setTarget] = useState(null); // language being switched to while the loader shows
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setLang = useCallback((next) => {
    if (!all[next] || next === lang || target) return;
    setTarget(next);
    const swapAt = reduced ? 120 : 650;
    const doneAt = reduced ? 300 : 1250;
    timers.current.push(setTimeout(() => {
      setLangState(next);
      try { localStorage.setItem(storageKey, next); } catch { /* the choice just isn't remembered */ }
    }, swapAt));
    timers.current.push(setTimeout(() => setTarget(null), doneAt));
  }, [all, lang, target, reduced, storageKey]);

  const meta = LANGS[lang] || LANGS.en;
  const value = useMemo(() => {
    const dict = all[lang] || {};
    return {
      lang,
      dir: meta.dir,
      locale: meta.locale,
      switching: !!target,
      setLang,
      t: (text, vars) => interpolate(dict[text] ?? text, meta.dir === 'rtl' ? isolate(vars) : vars),
      fmtDate: (d, opts = { month: 'short', day: 'numeric' }) => (d ? new Date(d).toLocaleDateString(meta.locale, opts) : '—'),
      fmtDateTime: (d) => (d ? new Date(d).toLocaleString(meta.locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
    };
  }, [all, lang, meta, target, setLang]);

  const to = target ? LANGS[target] : null;
  const toDict = target ? all[target] || {} : {};
  return (
    <LanguageContext.Provider value={value}>
      {children}
      {target && (
        <div className={`lang-loader ${reduced ? 'calm' : ''}`} role="status" aria-live="polite" dir={to.dir}>
          <BookLoader size="md">
            <span className="lang-loader-text">
              <Languages className="i" aria-hidden="true" />
              {target === 'ar' ? (toDict['Switching language…'] || 'جارٍ تغيير اللغة…') : 'Switching language…'}
            </span>
          </BookLoader>
        </div>
      )}
    </LanguageContext.Provider>
  );
}

/** Button that flips between English and Arabic. Shows the language you would switch to. */
export function LanguageToggle({ className = '' }) {
  const { lang, setLang, switching } = useLang();
  const next = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className={`ib lang-toggle ${className}`}
      onClick={() => setLang(next)}
      disabled={switching}
      lang={next}
      aria-label={next === 'ar' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      title={LANGS[next].label}
    >
      <span aria-hidden="true">{LANGS[next].label}</span>
    </button>
  );
}
