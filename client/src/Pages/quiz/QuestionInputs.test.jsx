import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuestionInput from './QuestionInputs';

function Harness({ item, initial }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <QuestionInput item={item} index={0} value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value ?? null)}</output>
    </>
  );
}
const read = () => JSON.parse(screen.getByTestId('value').textContent);

describe('answering a quiz in the portal', () => {
  test('true / false: one tick per row, tapping again clears it', () => {
    const item = { uid: 'a', type: 'tf', marks: 2, lead: 'Tick true or false:', items: [{ text: 'RAM is volatile' }, { text: 'ROM is volatile' }] };
    render(<Harness item={item} />);
    fireEvent.click(screen.getByRole('radio', { name: 'True: RAM is volatile' }));
    fireEvent.click(screen.getByRole('radio', { name: 'False: ROM is volatile' }));
    expect(read()).toEqual([true, false]);
    fireEvent.click(screen.getByRole('radio', { name: 'False: ROM is volatile' }));
    expect(read()).toEqual([true, null]);
    fireEvent.click(screen.getByRole('radio', { name: 'False: RAM is volatile' }));
    expect(read()).toEqual([false, null]);
  });

  test('tick table keeps one column per row', () => {
    const item = { uid: 'b', type: 'tick', marks: 2, columns: ['Input', 'Output'], items: [{ text: 'Mouse' }, { text: 'Printer' }] };
    render(<Harness item={item} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Input: Mouse' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Input: Printer' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Output: Printer' }));
    expect(read()).toEqual(['Input', 'Output']);
  });

  test('fill-in puts a text box where the gap is', () => {
    const item = { uid: 'c', type: 'fill', marks: 2, items: [{ text: 'The brain of the computer is the …' }] };
    render(<Harness item={item} />);
    fireEvent.change(screen.getByLabelText('Answer 1'), { target: { value: 'CPU' } });
    expect(read()).toEqual(['CPU']);
  });

  test('pick N stops at the limit', () => {
    const item = { uid: 'd', type: 'pick', marks: 2, n: 2, options: ['Mouse', 'Speaker', 'Touch screen'] };
    render(<Harness item={item} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Mouse' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Touch screen' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Speaker' }));
    expect(read()).toEqual(['Mouse', 'Touch screen']);
    fireEvent.click(screen.getByRole('radio', { name: 'Mouse' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Speaker' }));
    expect(read()).toEqual(['Touch screen', 'Speaker']);
  });

  test('word bank: tap a word then tap its gap, tap a filled gap to take it back', () => {
    const item = { uid: 'e', type: 'fill', presentation: 'wordbank', marks: 2, wordbank: ['hardware', 'software', 'virus'], items: [{ text: 'Physical parts are called …' }, { text: 'Programs are called …' }] };
    render(<Harness item={item} />);
    fireEvent.click(screen.getByRole('button', { name: 'hardware' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gap 1, empty' }));
    fireEvent.click(screen.getByRole('button', { name: 'software' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gap 2, empty' }));
    expect(read()).toEqual(['hardware', 'software']);
    expect(screen.queryByRole('button', { name: 'hardware' })).toBeNull(); // used words leave the bank
    fireEvent.click(screen.getByRole('button', { name: 'Gap 1: hardware. Press to remove' }));
    expect(read()).toEqual(['', 'software']);
    expect(screen.getByRole('button', { name: 'hardware' })).toBeInTheDocument();
  });

  test('word bank: dragging a word onto a gap fills it', () => {
    const item = { uid: 'f', type: 'fill', presentation: 'wordbank', marks: 1, wordbank: ['hardware', 'virus'], items: [{ text: 'Physical parts are called …' }] };
    render(<Harness item={item} />);
    const data = {};
    const dt = { setData: (k, v) => { data[k] = v; }, getData: (k) => data[k] };
    fireEvent.dragStart(screen.getByRole('button', { name: 'virus' }), { dataTransfer: dt });
    fireEvent.drop(screen.getByRole('button', { name: 'Gap 1, empty' }), { dataTransfer: dt });
    expect(read()).toEqual(['virus']);
  });

  test('written answers count words', () => {
    const item = { uid: 'g', type: 'written', marks: 3, lead: 'Describe a CPU.' };
    render(<Harness item={item} />);
    fireEvent.change(screen.getByLabelText('Question 1'), { target: { value: 'It runs instructions' } });
    expect(read()).toBe('It runs instructions');
    expect(screen.getByText(/3 words/)).toBeInTheDocument();
  });

  test('a structured question has a box for every part', () => {
    const item = { uid: 'h', type: 'multi', marks: 5, parts: [{ label: 'a', text: 'Explain hacking', marks: 3 }, { label: 'b', text: 'Give two protections', marks: 2 }] };
    render(<Harness item={item} />);
    fireEvent.change(screen.getByLabelText('Question 1 part b'), { target: { value: 'firewall, passwords' } });
    expect(read()).toEqual(['', 'firewall, passwords']);
  });
});
