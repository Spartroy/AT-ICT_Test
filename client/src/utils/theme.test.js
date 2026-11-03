import { THEME_KEY, applyTheme, currentTheme, initTheme, resolveTheme, setTheme, toggleTheme } from './theme';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('resolveTheme', () => {
  it('uses the saved choice when it is valid', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('follows the device when nothing valid is saved', () => {
    expect(resolveTheme(null, true)).toBe('light');
    expect(resolveTheme('purple', false)).toBe('dark');
    expect(resolveTheme(undefined, false)).toBe('dark');
  });
});

describe('applying a theme', () => {
  it('sets the attribute and colour scheme on <html> and announces it', () => {
    const seen = [];
    const on = (e) => seen.push(e.detail);
    window.addEventListener('at-theme-change', on);
    applyTheme('light');
    window.removeEventListener('at-theme-change', on);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(seen).toEqual(['light']);
  });

  it('falls back to dark for anything unknown', () => {
    expect(applyTheme('sepia')).toBe('dark');
  });

  it('remembers an explicit choice, and applying alone does not save', () => {
    applyTheme('light');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    setTheme('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('toggles between the two and keeps the choice', () => {
    setTheme('dark');
    expect(toggleTheme()).toBe('light');
    expect(currentTheme()).toBe('light');
    expect(toggleTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('initTheme restores the saved choice on load', () => {
    localStorage.setItem(THEME_KEY, 'light');
    initTheme();
    expect(currentTheme()).toBe('light');
  });
});
