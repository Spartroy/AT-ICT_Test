import { API_ENDPOINTS } from '../config/api';
import { getValidToken, clearAuth } from '../utils/auth';

export const API = API_ENDPOINTS.BASE_URL;

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

const authHeaders = (extra = {}) => {
  const token = getValidToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

async function send(url, { method = 'GET', body, headers, raw = false } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(url.startsWith('http') ? url : `${API}${url}`, {
    method,
    headers: authHeaders(isForm || body === undefined ? headers : { 'Content-Type': 'application/json', ...headers }),
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
  });
  if (res.status === 401) {
    clearAuth();
    if (!window.location.pathname.startsWith('/signin')) window.location.assign('/signin?error=session_expired');
    throw new ApiError(401, { message: 'Your session has expired' });
  }
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** Thin fetch wrapper: JSON in/out, bearer token, 401 → sign-in. Paths may be relative to the API base. */
export const api = {
  get: (url) => send(url),
  post: (url, body) => send(url, { method: 'POST', body }),
  put: (url, body) => send(url, { method: 'PUT', body }),
  patch: (url, body) => send(url, { method: 'PATCH', body }),
  del: (url) => send(url, { method: 'DELETE' }),
  raw: (url, options) => send(url, { ...options, raw: true })
};

/** Downloads a protected file (Authorization header required) and saves it with `filename`. */
export async function downloadFile(url, filename) {
  const res = await api.raw(url);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
