import { api } from './api';
import { API_ENDPOINTS } from '../config/api';

// Web Push in the browser: service worker + permission + subscription, saved to the server per device.

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const isIOS = () =>
  typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** True when the site runs as an installed app (home-screen icon), which iPhones require for push. */
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

/** What the settings UI should show: 'unsupported' | 'needs-install' (iPhone, not installed) | 'denied' | 'on' | 'off'. */
export async function pushState() {
  if (isIOS() && !isStandalone()) return 'needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'off';
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

// The server sends the key as URL-safe base64; the browser wants bytes.
const keyToBytes = (base64) => {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

/** Asks permission, subscribes this device and saves it. Resolves to 'on', or throws an Error with a readable message. */
export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser can't receive notifications.");
  const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS.PUSH_KEY);
  if (!data?.publicKey) throw new Error('Push notifications are not switched on for this site yet.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in the browser settings, then try again.');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(data.publicKey) });
  await api.post(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, { subscription: sub.toJSON() });
  return 'on';
}

/** Stops notifications on this device. */
export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.raw(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, { method: 'DELETE', body: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  }
  return 'off';
}
