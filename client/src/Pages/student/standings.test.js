import { moveInfo, rowTier, myRow } from './standings';

describe('moveInfo', () => {
  it('maps movement to a direction and distance', () => {
    expect(moveInfo(2)).toEqual({ dir: 'up', n: 2 });
    expect(moveInfo(-3)).toEqual({ dir: 'down', n: 3 });
    expect(moveInfo(0)).toEqual({ dir: 'same', n: 0 });
    expect(moveInfo(undefined)).toEqual({ dir: 'same', n: 0 });
  });
});

describe('rowTier', () => {
  it('keeps the top 3 distinct and crowns only first place', () => {
    expect(rowTier(1)).toEqual({ tier: 'gold', crown: true });
    expect(rowTier(2)).toEqual({ tier: 'silver', crown: false });
    expect(rowTier(3)).toEqual({ tier: 'bronze', crown: false });
    expect(rowTier(4)).toEqual({ tier: 'rest', crown: false });
  });
});

describe('myRow', () => {
  it('finds the student by id', () => {
    expect(myRow([{ _id: 'a' }, { _id: 'b', rank: 2 }], 'b').rank).toBe(2);
    expect(myRow([{ _id: 'a' }], 'z')).toBeNull();
    expect(myRow(undefined, 'z')).toBeNull();
  });
});
