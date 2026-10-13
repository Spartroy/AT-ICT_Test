import { splitMinutes, toMinutes } from './notificationUnits';

describe('splitMinutes', () => {
  it('shows the largest unit that divides evenly', () => {
    expect(splitMinutes(30)).toEqual({ value: 30, unit: 'minutes' });
    expect(splitMinutes(120)).toEqual({ value: 2, unit: 'hours' });
    expect(splitMinutes(1440)).toEqual({ value: 1, unit: 'days' });
    expect(splitMinutes(90)).toEqual({ value: 90, unit: 'minutes' });
    expect(splitMinutes(2880)).toEqual({ value: 2, unit: 'days' });
  });
});

describe('toMinutes', () => {
  it('converts back, and refuses empty or fractional values', () => {
    expect(toMinutes({ value: '2', unit: 'hours' })).toBe(120);
    expect(toMinutes({ value: 1, unit: 'days' })).toBe(1440);
    expect(toMinutes({ value: '45', unit: 'minutes' })).toBe(45);
    expect(toMinutes({ value: '', unit: 'hours' })).toBeNaN();
    expect(toMinutes({ value: '1.5', unit: 'hours' })).toBeNaN();
    expect(toMinutes({ value: '0', unit: 'hours' })).toBeNaN();
  });

  it('round-trips with splitMinutes', () => {
    [5, 30, 60, 120, 1440, 4320, 10080].forEach(m => expect(toMinutes(splitMinutes(m))).toBe(m));
  });
});
