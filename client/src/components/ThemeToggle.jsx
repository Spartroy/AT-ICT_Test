import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { BookLoader } from './portal/kit';
import { THEME_EVENT, currentTheme, setTheme } from '../utils/theme';
import './themeSwitch.css';

/** How long the loading screen takes to cover the page, stay, and fade away (ms). The theme changes while it covers. */
export const SWITCH_TIMING = { cover: 240, hold: 900, end: 1200 };

const SCREEN = {
  dark: { background: '#09090A', color: '#F4F4F5', label: 'Switching to dark mode…' },
  light: { background: '#F3F4F7', color: '#18181B', label: 'Switching to light mode…' }
};

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Full-screen loading screen in the colours of the theme being switched to. */
function SwitchScreen({ target, visible }) {
  const look = SCREEN[target];
  return createPortal(
    <div className={`theme-switch ${visible ? 'on' : ''}`} style={{ background: look.background, color: look.color }} role="status" aria-live="polite">
      <BookLoader>{look.label}</BookLoader>
    </div>,
    document.body
  );
}

/**
 * Sun / moon button that switches between light and dark mode behind a short loading screen
 * (skipped for people who prefer reduced motion). `className` lets each page style it like its other icon buttons.
 */
export default function ThemeToggle({ className = 'ib', label = ['Switch to light mode', 'Switch to dark mode'] }) {
  const [theme, setThemeState] = useState(currentTheme);
  const [screen, setScreen] = useState(null); // { target, visible } while switching
  const timers = useRef([]);

  useEffect(() => {
    const sync = () => setThemeState(currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    sync();
    const pending = timers.current;
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      pending.forEach(clearTimeout);
    };
  }, []);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const switchTheme = () => {
    if (screen) return;
    const target = currentTheme() === 'light' ? 'dark' : 'light';
    if (prefersReducedMotion()) {
      setTheme(target);
      return;
    }
    setScreen({ target, visible: false });
    later(() => setScreen({ target, visible: true }), 16); // next frame, so the fade-in runs
    later(() => setTheme(target), SWITCH_TIMING.cover);
    later(() => setScreen({ target, visible: false }), SWITCH_TIMING.hold);
    later(() => setScreen(null), SWITCH_TIMING.end);
  };

  const dark = theme !== 'light';
  const Icon = dark ? Sun : Moon;
  const text = dark ? label[0] : label[1];
  return (
    <>
      <button type="button" className={className} aria-label={text} title={text} aria-pressed={!dark} disabled={!!screen} onClick={switchTheme}>
        <Icon className="i" aria-hidden="true" />
      </button>
      {screen && <SwitchScreen target={screen.target} visible={screen.visible} />}
    </>
  );
}
