import { API_ENDPOINTS } from '../config/api';

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    return { ok: false, status: 0, body: { message: "We couldn't reach the server. Check your connection and try again." } };
  }
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return { ok: response.ok, status: response.status, body };
}

const json = (data) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

/** POST /api/auth/login. On 403 the body carries `code` (REGISTRATION_PENDING / REGISTRATION_REJECTED). */
export const loginRequest = (email, password) => request(API_ENDPOINTS.AUTH.LOGIN, json({ email, password }));

/** POST /api/registration/submit */
export const submitRegistration = (payload) => request(API_ENDPOINTS.REGISTRATION.SUBMIT, json(payload));

/** GET /api/settings/registration → { examSessions: [{code,label}], royalClasses: [] } */
export const fetchRegistrationOptions = () => request(API_ENDPOINTS.SETTINGS.REGISTRATION);

/** Stores the session the same way the rest of the app expects (utils/auth.js, ProtectedRoute). */
export function storeSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
