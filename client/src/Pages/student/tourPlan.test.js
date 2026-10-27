import { HINT_LOGINS, tourPlan } from './tourPlan';

describe('tourPlan', () => {
  it('forces the tour on the first login only', () => {
    expect(tourPlan({ loginCount: 1 })).toMatchObject({ autoStart: true, forced: true, showHint: false });
    expect(tourPlan({ loginCount: 2 }).autoStart).toBe(false);
    expect(tourPlan({ loginCount: 1, seen: true }).autoStart).toBe(false);
  });

  it('never auto-starts for students whose count is unknown or past the window', () => {
    expect(tourPlan({}).autoStart).toBe(false);
    expect(tourPlan({ loginCount: 7 }).autoStart).toBe(false);
  });

  it('shows the help halo on logins 1 to 6 once the tour is out of the way', () => {
    expect(tourPlan({ loginCount: 1, seen: true }).showHint).toBe(true);
    expect(tourPlan({ loginCount: 2 }).showHint).toBe(true);
    expect(tourPlan({ loginCount: HINT_LOGINS }).showHint).toBe(true);
    expect(tourPlan({ loginCount: HINT_LOGINS + 1 }).showHint).toBe(false);
    expect(tourPlan({ loginCount: 0 }).showHint).toBe(false);
  });

  it('stops the hint once the student used help, closed the bubble, or just finished the tour', () => {
    expect(tourPlan({ loginCount: 3, helpUsed: true }).showHint).toBe(false);
    expect(tourPlan({ loginCount: 3, hintDismissed: true }).showHint).toBe(false);
    expect(tourPlan({ loginCount: 3, justFinished: true }).showHint).toBe(false);
  });
});
