import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_EVENT, currentTheme, toggleTheme } from '../utils/theme';

/** Sun / moon button that switches between light and dark mode. `className` lets each page style it like its other icon buttons. */
export default function ThemeToggle({ className = 'ib', label = ['Switch to light mode', 'Switch to dark mode'] }) {
  const [theme, setThemeState] = useState(currentTheme);

  useEffect(() => {
    const sync = () => setThemeState(currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    sync();
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const dark = theme !== 'light';
  const Icon = dark ? Sun : Moon;
  return (
    <button type="button" className={className} aria-label={dark ? label[0] : label[1]} title={dark ? label[0] : label[1]} aria-pressed={!dark} onClick={toggleTheme}>
      <Icon className="i" aria-hidden="true" />
    </button>
  );
}
