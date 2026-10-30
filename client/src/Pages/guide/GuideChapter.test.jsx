import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PortalUIProvider } from '../../components/portal/PortalUI';
import { GuideCtx } from './GuideBlocks';
import ChapterView from './GuideChapter';

const chapter = () => ({
  id: 'c1', key: '1', n: '1', title: 'Computer', hl: 'Structure.', blurb: 'Inside the box.',
  secs: [{
    id: 's1', num: '1.1', title: 'What is a computer?',
    blocks: [
      { id: 'b1', t: 'def', l: 'Computer', h: 'A device that <b>processes</b> data.' },
      { id: 'b2', t: 'cards', title: 'Two parts', items: [['Hardware', 'Touch it'], ['Software', 'Instructions']] },
      { id: 'b3', t: 'mis', w: '"Wrong"', r: 'Right' },
      { id: 'b4', t: 'hint', h: 'Remember the difference.' }
    ]
  }],
  quiz: [{ id: 'q1', sec: '1.1', t: 'Pick hardware', o: ['Word', 'Webcam'], c: 1, e: 'You can touch it.' }]
});

const renderChapter = (ctx) => render(
  <PortalUIProvider>
    <GuideCtx.Provider value={ctx}><ChapterView ch={chapter()} ci={0} /></GuideCtx.Provider>
  </PortalUIProvider>
);

describe('student view', () => {
  test('shows the notes, tip, common mistake and a quiz, with no editing controls', () => {
    const { container } = renderChapter({ editing: false });
    expect(screen.getByText('What is a computer?')).toBeInTheDocument();
    expect(screen.getByText('Exam tip')).toBeInTheDocument();
    expect(screen.getByText('Common mistake')).toBeInTheDocument();
    expect(screen.getByText('Did it stick?')).toBeInTheDocument();
    expect(container.querySelector('[contenteditable]')).toBeNull();
    expect(container.querySelector('.sg-bbar')).toBeNull();
  });

  test('keeps bold in definitions', () => {
    const { container } = renderChapter({ editing: false });
    expect(container.querySelector('.sg-def-h b').textContent).toBe('processes');
  });

  test('marks the right and wrong quiz answers once one is picked', () => {
    renderChapter({ editing: false });
    fireEvent.click(screen.getByRole('button', { name: /Word/ }));
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Webcam/ }).className).toContain('right');
  });
});

describe('teacher view', () => {
  const actions = () => ({ editing: true, set: jest.fn(), remove: jest.fn(), add: jest.fn(), move: jest.fn(), addSection: jest.fn(), pickBlock: jest.fn() });

  test('text is editable in place and a change is sent with its path', () => {
    const ctx = actions();
    const { container } = renderChapter(ctx);
    const meaning = container.querySelector('.sg-def-h');
    expect(meaning.getAttribute('contenteditable')).toBe('true');
    meaning.innerHTML = 'A machine that <b>runs</b> programs.';
    fireEvent.blur(meaning);
    expect(ctx.set).toHaveBeenCalledWith(['chapters', 0, 'secs', 0, 'blocks', 0, 'h'], 'A machine that <b>runs</b> programs.');
  });

  test('a block can be deleted from its bar', () => {
    const ctx = actions();
    const { container } = renderChapter(ctx);
    const mistake = container.querySelector('.sg-b-mis');
    fireEvent.click(within(mistake).getByRole('button', { name: 'Delete this block' }));
    expect(ctx.remove).toHaveBeenCalledWith(['chapters', 0, 'secs', 0, 'blocks'], 2);
  });

  test('a single card can be removed and another added', () => {
    const ctx = actions();
    const { container } = renderChapter(ctx);
    const cards = container.querySelector('.sg-b-cards');
    fireEvent.click(within(cards).getAllByRole('button', { name: 'Remove' })[0]);
    expect(ctx.remove).toHaveBeenCalledWith(['chapters', 0, 'secs', 0, 'blocks', 1, 'items'], 0);
    fireEvent.click(within(cards).getByRole('button', { name: /Add card/ }));
    expect(ctx.add).toHaveBeenCalledWith(['chapters', 0, 'secs', 0, 'blocks', 1, 'items'], 2, ['New card', 'Detail']);
  });

  test('the correct quiz answer can be changed', () => {
    const ctx = actions();
    renderChapter(ctx);
    fireEvent.click(screen.getByRole('button', { name: 'Mark option A as correct' }));
    expect(ctx.set).toHaveBeenCalledWith(['chapters', 0, 'quiz', 0, 'c'], 0);
  });

  test('"Add block here" asks to pick a block at that spot', () => {
    const ctx = actions();
    renderChapter(ctx);
    fireEvent.click(screen.getAllByRole('button', { name: 'Add a block here' })[1]);
    expect(ctx.pickBlock).toHaveBeenCalledWith(['chapters', 0, 'secs', 0, 'blocks'], 1);
  });
});
