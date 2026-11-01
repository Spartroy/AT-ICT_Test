const { addMinutes } = require('../utils/quizTime');

describe('addMinutes', () => {
  test('adds the duration to the start time', () => {
    expect(addMinutes('10:30', 45)).toBe('11:15');
    expect(addMinutes('09:00', '10')).toBe('09:10');
    expect(addMinutes('9:05', 5)).toBe('09:10');
  });
  test('rolls past midnight', () => {
    expect(addMinutes('23:50', 20)).toBe('00:10');
  });
  test('rejects a start time or duration it cannot read', () => {
    expect(addMinutes('', 10)).toBeNull();
    expect(addMinutes('25:00', 10)).toBeNull();
    expect(addMinutes('10:00', 'abc')).toBeNull();
    expect(addMinutes(undefined, 10)).toBeNull();
  });
});
