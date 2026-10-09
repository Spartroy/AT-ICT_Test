const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// A signed-in user is counted on their own account, not on their IP. Students at a school or centre often share one
// public IP, so counting by IP made a whole classroom share a single small allowance.
// Requests without a valid token (login, registration, public pages) are still counted per IP.
const WINDOW_MIN = Number(process.env.RATE_LIMIT_WINDOW) || 15;
const USER_MAX = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 3000;  // per signed-in user per window
const ANON_MAX = Number(process.env.RATE_LIMIT_ANON_MAX_REQUESTS) || 600; // per IP per window, signed out

/** "user:<id>" for a valid token, otherwise "ip:<address>". The token is verified, so the key can't be forged. */
const rateLimitKey = (req) => {
  const header = req.headers?.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'fallback_jwt_secret_for_development');
      if (decoded?.id) return `user:${decoded.id}`;
    } catch { /* invalid or expired token: fall back to the IP */ }
  }
  return `ip:${req.ip}`;
};

const apiLimiter = rateLimit({
  windowMs: WINDOW_MIN * 60 * 1000,
  max: (req) => (rateLimitKey(req).startsWith('user:') ? USER_MAX : ANON_MAX),
  keyGenerator: rateLimitKey,
  message: {
    status: 'error',
    message: 'Too many requests, please wait a few minutes and try again.',
    retryAfter: WINDOW_MIN * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, rateLimitKey, USER_MAX, ANON_MAX };
