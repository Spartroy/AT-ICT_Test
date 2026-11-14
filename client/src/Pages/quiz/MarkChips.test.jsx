import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MarkChips, { chipValues, markText } from './MarkChips';

function Harness({ max, start = '' }) {
  const [v, setV] = useState(start);
  return <><MarkChips value={v} max={max} onChange={setV} label="Marks" /><output data-testid="v">{String(v)}</output></>;
}

describe('quick-pick mark chips', () => {
  test('offers halves for small questions, whole marks for medium, quarters for big', () => {
    expect(chipValues(2)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(chipValues(6)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(chipValues(20)).toEqual([0, 5, 10, 15, 20]);
    expect(markText(1.5)).toBe('1½');
    expect(markText(0.5)).toBe('½');
  });

  test('tap a chip to give the mark, tap it again to clear', () => {
    render(<Harness max={3} />);
    fireEvent.click(screen.getByRole('radio', { name: '2½' }));
    expect(screen.getByTestId('v')).toHaveTextContent('2.5');
    fireEvent.click(screen.getByRole('radio', { name: '2½' }));
    expect(screen.getByTestId('v')).toHaveTextContent('');
  });
});
