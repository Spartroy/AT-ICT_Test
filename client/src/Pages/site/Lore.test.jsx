import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Lore, { OPEN_LORE_PROMPT } from './Lore';

const type = (text) => text.split('').forEach(k => fireEvent.keyDown(document.body, { key: k }));

describe('Lore easter egg', () => {
  it('shows nothing until it is triggered', () => {
    render(<Lore />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the story when the code is typed anywhere', () => {
    render(<Lore />);
    type('xx311220');
    expect(screen.getByRole('dialog', { name: /chronicles of at-ict/i })).toBeInTheDocument();
    expect(screen.getByText(/love of my life/i)).toBeInTheDocument();
    expect(screen.getByText(/Mr\. Safty/)).toBeInTheDocument();
  });

  it('ignores the code typed into a form field', () => {
    render(<><input aria-label="x" /><Lore /></>);
    '311220'.split('').forEach(k => fireEvent.keyDown(screen.getByLabelText('x'), { key: k }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks for the code after the tap trigger, rejects a wrong one, accepts the right one', () => {
    render(<Lore />);
    act(() => { window.dispatchEvent(new Event(OPEN_LORE_PROMPT)); });
    const input = screen.getByLabelText('Password');
    fireEvent.change(input, { target: { value: '000000' } });
    fireEvent.submit(input.closest('form'));
    expect(screen.getByRole('alert')).toHaveTextContent(/try again/i);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '311220' } });
    fireEvent.submit(screen.getByLabelText('Password').closest('form'));
    expect(screen.getByRole('dialog', { name: /chronicles/i })).toBeInTheDocument();
  });

  it('closes with Escape and the close button', () => {
    render(<Lore />);
    type('311220');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    type('311220');
    fireEvent.click(screen.getByLabelText('Close lore'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lays the story out as chapters on a scroll, ending with the seal', () => {
    render(<Lore />);
    type('311220');
    expect(screen.getByRole('heading', { name: /the origin story/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /the first student/i })).toBeInTheDocument();
    expect(screen.getByText(/Chapter II/)).toBeInTheDocument();
    expect(document.querySelector('.lore-seal')).toBeInTheDocument();
    // Without IntersectionObserver (jsdom) every line is shown straight away
    expect(document.querySelectorAll('.lore-ink:not(.in)').length).toBe(0);
  });

  it('lets the visitor mute the sound and remembers it', () => {
    localStorage.removeItem('atict:lore:muted');
    render(<Lore />);
    type('311220');
    fireEvent.click(screen.getByRole('button', { name: /turn sound off/i }));
    expect(localStorage.getItem('atict:lore:muted')).toBe('1');
    expect(screen.getByRole('button', { name: /turn sound on/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /turn sound on/i }));
    expect(localStorage.getItem('atict:lore:muted')).toBe('0');
  });
});
