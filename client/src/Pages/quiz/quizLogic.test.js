import { answerLines, formatClock, isAnswered, pctClass, splitBlanks, suggestedMinutes, totalMarks } from './quizLogic';

describe('quiz helpers', () => {
  test('splits a sentence at each blank', () => {
    expect(splitBlanks('The CPU is called a …')).toEqual([{ text: 'The CPU is called a ' }, { blank: 0 }]);
    expect(splitBlanks('A ……… and a ………')).toEqual([{ text: 'A ' }, { blank: 0 }, { text: ' and a ' }, { blank: 1 }]);
    expect(splitBlanks('No gap here')).toEqual([{ text: 'No gap here' }]);
  });

  test('adds up marks in halves', () => {
    expect(totalMarks([{ marks: 2 }, { marks: 1.5 }, { marks: '3' }])).toBe(6.5);
  });

  test('suggests a duration in steps of five minutes, never under five', () => {
    expect(suggestedMinutes([{ type: 'tf', marks: 2 }])).toBe(5);
    expect(suggestedMinutes([{ type: 'written', marks: 10 }, { type: 'written', marks: 10 }, { type: 'tf', marks: 4 }])).toBe(25);
  });

  test('more marks give more answer lines, within limits', () => {
    expect(answerLines(1)).toBe(2);
    expect(answerLines(4)).toBe(6);
    expect(answerLines(40)).toBe(14);
  });

  test('formats the clock', () => {
    expect(formatClock(65000)).toBe('1:05');
    expect(formatClock(3725000)).toBe('1:02:05');
    expect(formatClock(-5)).toBe('0:00');
  });

  test('knows when a question has an answer', () => {
    expect(isAnswered({}, '  ')).toBe(false);
    expect(isAnswered({}, 'x')).toBe(true);
    expect(isAnswered({}, ['', ''])).toBe(false);
    expect(isAnswered({}, [null, false])).toBe(true);
    expect(isAnswered({}, undefined)).toBe(false);
  });

  test('colours a percentage against the pass mark', () => {
    expect(pctClass(30, 50)).toBe('c-rd');
    expect(pctClass(60, 50)).toBe('c-am');
    expect(pctClass(90, 50)).toBe('c-pr');
    expect(pctClass(null)).toBe('c-gy');
  });
});
