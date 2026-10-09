const express = require('express');
const jwt = require('jsonwebtoken');

const SECRET = 'fallback_jwt_secret_for_development';
const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET || SECRET);

// Small limits so the test is quick; set before the module reads them.
process.env.RATE_LIMIT_MAX_REQUESTS = '5';
process.env.RATE_LIMIT_ANON_MAX_REQUESTS = '2';
const { apiLimiter, rateLimitKey } = require('../middleware/rateLimit');

describe('rateLimitKey', () => {
  it('uses the account for a valid token and the IP otherwise', () => {
    expect(rateLimitKey({ headers: { authorization: `Bearer ${token('u1')}` }, ip: '1.1.1.1' })).toBe('user:u1');
    expect(rateLimitKey({ headers: {}, ip: '1.1.1.1' })).toBe('ip:1.1.1.1');
  });

  it('cannot be forged: a bad or tampered token falls back to the IP', () => {
    expect(rateLimitKey({ headers: { authorization: 'Bearer not-a-token' }, ip: '2.2.2.2' })).toBe('ip:2.2.2.2');
    const forged = jwt.sign({ id: 'victim' }, 'some-other-secret');
    expect(rateLimitKey({ headers: { authorization: `Bearer ${forged}` }, ip: '2.2.2.2' })).toBe('ip:2.2.2.2');
  });
});

describe('apiLimiter', () => {
  let server;
  let base;

  beforeAll(async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(apiLimiter);
    app.get('/ping', (req, res) => res.json({ ok: true }));
    await new Promise(resolve => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => new Promise(resolve => server.close(resolve)));

  const hit = (headers = {}) => fetch(`${base}/ping`, { headers }).then(r => r.status);

  it('lets a signed-in user make more requests than a signed-out visitor, and counts users separately', async () => {
    // Signed out: 2 allowed, then blocked.
    expect([await hit(), await hit(), await hit()]).toEqual([200, 200, 429]);
    // Two students on the same IP each get their own allowance (5), even though the IP is already blocked.
    const a = { Authorization: `Bearer ${token('student-a')}` };
    const b = { Authorization: `Bearer ${token('student-b')}` };
    const first = [];
    for (let i = 0; i < 6; i += 1) first.push(await hit(a));
    expect(first).toEqual([200, 200, 200, 200, 200, 429]);
    expect(await hit(b)).toBe(200);
  });
});
