/**
 * Dark / light mode. The choice is kept per device in localStorage; with nothing saved, the device's own
 * setting (prefers-color-scheme) decides. The theme is an attribute on <html> (data-theme="dark" | "light"),
 * which styles/theme-light.css reads.
 */

export const THEME_KEY = 'at-theme';
export const THEME_EVENT = 'at-theme-change';
export const THEMES = ['dark', 'light'];

const safeGet = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

/** The theme to use: the saved one if valid, else the device preference, else dark (the original look). */
export const resolveTheme = (saved = safeGet(), prefersLight = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: light)').matches) => {
  if (THEMES.includes(saved)) return saved;
  return prefersLight ? 'light' : 'dark';
};

export const currentTheme = () => (typeof document !== 'undefined' && THEMES.includes(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : 'dark');

/** Puts `theme` on <html>, tells the browser (form controls, scrollbars) and tells listeners. Does not save. */
export const applyTheme = (theme) => {
  const next = THEMES.includes(theme) ? theme : 'dark';
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  return next;
};

/** Applies and remembers the user's choice. */
export const setTheme = (theme) => {
  const next = applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private mode: the choice just lasts until the page is closed.
  }
  return next;
};

export const toggleTheme = () => setTheme(currentTheme() === 'light' ? 'dark' : 'light');

/** Call once before the first render so the page never flashes the wrong theme. */
export const initTheme = () => applyTheme(resolveTheme());
