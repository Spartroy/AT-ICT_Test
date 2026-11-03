import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';
import { THEME_KEY, applyTheme } from '../utils/theme';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('offers light mode while dark, and switches and remembers it', () => {
    applyTheme('dark');
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('stays in step when the theme is changed elsewhere', () => {
    applyTheme('light');
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    React.act(() => { applyTheme('dark'); });
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('uses translated labels when given', () => {
    applyTheme('dark');
    render(<ThemeToggle label={['فاتح', 'داكن']} />);
    expect(screen.getByRole('button', { name: 'فاتح' })).toBeInTheDocument();
  });
});
