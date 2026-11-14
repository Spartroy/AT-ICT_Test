// The teacher's integrity radar: turns attempts (with the events the student page recorded) into
//   - one row per student with a live risk level,
//   - a log of anomalies, newest first.
// Pure functions, so they are tested without a database.
const cheat = require('./cheat');

const LABEL = { leave: 'left the quiz page', fullscreen: 'left full screen', paste: 'tried to paste', copy: 'tried to copy', print: 'tried to print', devtools: 'tried to open developer tools' };

/** One recorded event as a line for the log, or null when it is only bookkeeping. */
function describeEvent(e) {
  switch (e.type) {
    case 'card': return e.q === 'red'
      ? { severity: 'high', kind: 'card', text: 'Red card. Sent off, quiz ended' }
      : { severity: 'medium', kind: 'card', text: e.q === 'yellow2' ? 'Second yellow card, 2 marks deducted' : 'Yellow card, quiz paused for 30 seconds' };
    case 'violation': return { severity: (e.n || 0) >= 3 ? 'high' : (e.n || 0) === 2 ? 'medium' : 'low', kind: 'violation', text: `Illegal action ${e.n || ''}: ${LABEL[e.q] || 'broke a quiz rule'}`.replace('action :', 'action:') };
    case 'hidden': return { severity: 'low', kind: 'tab', text: 'Switched away from the quiz tab' };
    case 'paste': return (e.len || 0) >= 40 ? { severity: 'medium', kind: 'paste', text: `Pasted ${e.len} characters` } : { severity: 'low', kind: 'paste', text: 'Pasted text' };
    case 'copy': case 'cut': return { severity: 'low', kind: 'copy', text: 'Copied text from the page' };
    case 'fs_exit': return { severity: 'low', kind: 'fullscreen', text: 'Left full screen' };
    case 'print': return { severity: 'medium', kind: 'tools', text: 'Tried to print the quiz' };
    case 'devtools': return { severity: 'medium', kind: 'tools', text: 'Tried to open developer tools' };
    case 'offline': return { severity: 'low', kind: 'offline', text: 'Lost connection' };
    default: return null;
  }
}

/** Is the student away from the quiz tab right now (last visibility event was "hidden")? */
function awayNow(events) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'hidden') return true;
    if (events[i].type === 'visible') return false;
  }
  return false;
}

/**
 * attempts: plain objects { _id, quiz, student: { firstName, lastName, studentInfo }, status, startedAt, endsAt, events, integrity }
 * titles: Map(quizId -> title)
 */
function buildRadar(attempts, titles, now = new Date()) {
  const rows = [];
  const feed = [];
  attempts.forEach(a => {
    const events = cheat.cleanEvents(a.events);
    const started = new Date(a.startedAt).getTime();
    const live = a.status === 'in_progress' && new Date(a.endsAt).getTime() > now.getTime();
    const sum = cheat.summarise(events, { durationMs: 0, spentMs: Math.max(0, now.getTime() - started) });
    const d = cheat.discipline(events);
    const name = `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || 'Student';
    const quiz = titles.get(String(a.quiz)) || 'Quiz';
    let last = null;
    events.forEach((e, i) => {
      const line = describeEvent(e);
      if (!line) return;
      const at = new Date(started + e.t);
      feed.push({ id: `${a._id}:${i}`, at, attemptId: String(a._id), quizId: String(a.quiz), student: name, quiz, ...line });
      last = at;
    });
    rows.push({
      attemptId: String(a._id), quizId: String(a.quiz), quiz, student: name, group: a.student?.studentInfo?.group || null,
      status: live ? 'live' : a.status === 'in_progress' ? 'ended' : a.status, startedAt: a.startedAt,
      risk: sum.risk, flags: sum.flags, violations: d.violations, yellows: d.yellows, sentOff: d.sentOff, penalty: d.penalty,
      tabLeaves: sum.tabLeaves, pastes: sum.pastes, away: live && awayNow(events), lastEventAt: last
    });
  });
  const rank = { high: 3, medium: 2, low: 1, none: 0 };
  rows.sort((x, y) => (Number(y.status === 'live') - Number(x.status === 'live')) || (rank[y.risk] - rank[x.risk]) || String(x.student).localeCompare(String(y.student)));
  feed.sort((x, y) => y.at - x.at);
  return {
    serverNow: now,
    totals: {
      live: rows.filter(r => r.status === 'live').length,
      flagged: rows.filter(r => r.risk === 'medium' || r.risk === 'high').length,
      cards: rows.reduce((n, r) => n + r.yellows + (r.sentOff ? 1 : 0), 0),
      away: rows.filter(r => r.away).length
    },
    rows,
    feed: feed.slice(0, 120)
  };
}

module.exports = { buildRadar, describeEvent, awayNow };
