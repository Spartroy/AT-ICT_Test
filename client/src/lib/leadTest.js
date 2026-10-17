import { API_ENDPOINTS } from '../config/api';

// Visitor identity and opt-in A/B test helpers for the public free samples.
// A: ask for name + phone before the sample opens. B: open it, ask after PROMPT_DELAY_MS.

export const PROMPT_DELAY_MS = 20000;

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode: the test just can't remember */ } };

const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);

/** A stable anonymous id for this browser. */
export function visitorId() {
  let id = read('atict.visitor');
  if (!id) { id = newId(); write('atict.visitor', id); }
  return id;
}

/** Which version this visitor sees. 'ab' keeps the first coin-flip so they always see the same one. */
export function variantFor(mode) {
  if (mode === 'A' || mode === 'B') return mode;
  let v = read('atict.variant');
  if (v !== 'A' && v !== 'B') { v = Math.random() < 0.5 ? 'A' : 'B'; write('atict.variant', v); }
  return v;
}

/** True once this browser has already left a name and number. */
export const hasLead = () => read('atict.lead') === '1';
export const rememberLead = () => write('atict.lead', '1');

/** Funnel event for the test; failures are ignored. */
export function track(type, { variant, sampleId }) {
  try {
    fetch(`${API_ENDPOINTS.SAMPLES}/event`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ type, variant, sampleId, visitorId: visitorId() })
    }).catch(() => {});
  } catch { /* ignore */ }
}

export async function submitLead({ name, phone, variant, sampleId, website }) {
  const res = await fetch(`${API_ENDPOINTS.SAMPLES}/lead`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, variant, sampleId, website, visitorId: visitorId() })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Could not save your details. Please try again.');
  rememberLead();
}
