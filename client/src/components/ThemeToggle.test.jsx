import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ThemeToggle, { SWITCH_TIMING } from './ThemeToggle';
import { THEME_KEY, applyTheme } from '../utils/theme';

// setupTests defaults to reduced motion; these tests are about the animated path unless they say otherwise.
const motion = (reduced) => { window.matchMedia = jest.fn().mockReturnValue({ matches: reduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }); };

beforeEach(() => {
  jest.useFakeTimers();
  motion(false);
});
afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

const advance = (ms) => act(() => { jest.advanceTimersByTime(ms); });

describe('ThemeToggle', () => {
  it('offers light mode while dark', () => {
    applyTheme('dark');
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('shows a loading screen, changes the theme while it covers the page, then removes it', () => {
    applyTheme('dark');
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(screen.getByRole('status')).toHaveTextContent('Switching to light mode…');
    expect(document.documentElement.dataset.theme).toBe('dark'); // not yet: the page is still being covered

    advance(SWITCH_TIMING.cover);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    expect(screen.getByRole('status')).toBeInTheDocument();

    advance(SWITCH_TIMING.end);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeEnabled();
  });

  it('ignores clicks while it is switching', () => {
    applyTheme('dark');
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Switch to light mode' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    advance(SWITCH_TIMING.end);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('switches at once, with no loading screen, for people who prefer reduced motion', () => {
    motion(true);
    applyTheme('dark');
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays in step when the theme is changed elsewhere', () => {
    applyTheme('light');
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    act(() => { applyTheme('dark'); });
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('uses translated labels when given', () => {
    applyTheme('dark');
    render(<ThemeToggle label={['فاتح', 'داكن']} />);
    expect(screen.getByRole('button', { name: 'فاتح' })).toBeInTheDocument();
  });
});
