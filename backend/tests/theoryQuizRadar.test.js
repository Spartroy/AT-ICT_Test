const { buildRadar, describeEvent } = require('../services/theoryQuiz/radar');

describe('integrity radar', () => {
  const now = new Date('2026-11-14T10:10:00Z');
  const started = new Date('2026-11-14T10:00:00Z');
  const attempt = (id, name, events, status = 'in_progress') => ({ _id: id, quiz: 'q1', student: { firstName: name, lastName: 'X', studentInfo: { group: 'G1' } }, status, startedAt: started, endsAt: new Date('2026-11-14T10:30:00Z'), events });

  test('logs anomalies newest first with real clock times', () => {
    const r = buildRadar([attempt('a1', 'Sam', [{ t: 60000, type: 'hidden' }, { t: 90000, type: 'visible' }, { t: 120000, type: 'paste', len: 80 }])], new Map([['q1', 'Test 2']]), now);
    expect(r.feed.map(f => f.kind)).toEqual(['paste', 'tab']);
    expect(r.feed[0].at.toISOString()).toBe('2026-11-14T10:02:00.000Z');
    expect(r.rows[0]).toMatchObject({ student: 'Sam X', quiz: 'Test 2', status: 'live', away: false });
  });

  test('shows who is away right now and counts live, flagged and cards', () => {
    const r = buildRadar([
      attempt('a1', 'Sam', [{ t: 1000, type: 'hidden' }]),
      attempt('a2', 'Alex', [{ t: 1000, type: 'violation', q: 'leave', n: 2 }, { t: 1100, type: 'card', q: 'yellow1' }], 'submitted'),
      attempt('a3', 'Kim', [])
    ], new Map(), now);
    expect(r.totals).toMatchObject({ live: 2, cards: 1, away: 1 });
    expect(r.rows.find(x => x.student.startsWith('Alex'))).toMatchObject({ status: 'submitted', yellows: 1, away: false });
    expect(r.rows[0].status).toBe('live');
  });

  test('bookkeeping events are not logged and a red card is high severity', () => {
    expect(describeEvent({ type: 'visible' })).toBeNull();
    expect(describeEvent({ type: 'card', q: 'red' }).severity).toBe('high');
    expect(describeEvent({ type: 'violation', q: 'paste', n: 2 }).text).toBe('Illegal action 2: tried to paste');
  });
});

describe('radar levels follow the card rules', () => {
  const started = new Date('2026-11-14T10:00:00Z');
  const run = (events) => buildRadar([{ _id: 'a', quiz: 'q', student: { firstName: 'S', lastName: 'T' }, status: 'in_progress', startedAt: started, endsAt: new Date('2026-11-14T11:00:00Z'), events }], new Map(), new Date('2026-11-14T10:10:00Z'));
  const v = (n) => ({ t: n * 1000, type: 'violation', q: 'leave', n });
  const c = (q, t = 9000) => ({ t, type: 'card', q });
  test.each([
    [[], 'clear'],
    [[v(1)], 'reminder'],
    [[v(1), v(2), c('yellow1')], 'yellow1'],
    [[v(1), v(2), c('yellow1'), v(3), c('yellow2')], 'yellow2'],
    [[v(4), c('red')], 'red']
  ])('%j gives %s', (events, level) => {
    const r = run(events);
    expect(r.rows[0].level).toBe(level);
    expect(r.totals.alarms).toBe(level === 'clear' ? 0 : 1);
  });
});
