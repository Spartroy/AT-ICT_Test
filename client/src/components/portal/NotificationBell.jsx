import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, BellRing, Download, Settings2 } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { disablePush, enablePush, pushState } from '../../lib/push';
import { Ic } from './kit';
import { useToast } from './PortalUI';

/** "5m", "3h", "2d" since the notification was created. */
export const timeAgo = (iso, now = Date.now()) => {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

/** This device's push status with the one action that makes sense for it (turn on, turn off, install, or why not). */
function DevicePush() {
  const toast = useToast();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => { pushState().then(setState); }, []);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const run = async (fn) => {
    setBusy(true);
    try { setState(await fn()); } catch (err) { toast(err.message || 'Something went wrong'); setState(await pushState()); } finally { setBusy(false); }
  };

  if (!state) return null;
  if (state === 'needs-install') return <p className="nt-hint">On iPhone and iPad, notifications work once the site is on your home screen: tap <b>Share</b>, then <b>Add to Home Screen</b>, and open AT-ICT from there.</p>;
  if (state === 'unsupported') return <p className="nt-hint">This browser can't show notifications. You'll still see them here.</p>;
  if (state === 'denied') return <p className="nt-hint">Notifications are blocked for this site. Allow them in the browser's site settings, then reopen this panel.</p>;
  return (
    <div className="nt-device">
      {state === 'on' ? (
        <>
          <span className="nt-ok"><Ic as={BellRing} />On for this device</span>
          <button type="button" className="btn o sm" disabled={busy} onClick={() => run(disablePush)}><Ic as={BellOff} />Turn off</button>
        </>
      ) : (
        <button type="button" className="btn p sm" disabled={busy} onClick={() => run(enablePush)}><Ic as={BellRing} />{busy ? 'Turning on…' : 'Turn on notifications'}</button>
      )}
      {installEvent && <button type="button" className="btn o sm" onClick={async () => { installEvent.prompt(); await installEvent.userChoice.catch(() => {}); setInstallEvent(null); }}><Ic as={Download} />Install app</button>}
    </div>
  );
}

/** Which kinds of notification I get. Students can only change these if the teacher allows it. */
function Preferences({ onBack }) {
  const toast = useToast();
  const prefs = useApi(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, b => b.data);

  const toggle = async (type, enabled) => {
    prefs.setData(d => ({ ...d, types: d.types.map(t => (t.id === type.id ? { ...t, enabled } : t)) }));
    try { await api.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, { overrides: { [type.id]: enabled } }); } catch { toast("Couldn't save that. Please try again."); prefs.reload(); }
  };

  return (
    <>
      <div className="nt-head"><button type="button" className="ib sm" aria-label="Back to notifications" onClick={onBack}><Ic as={ArrowLeft} /></button><b>Notification settings</b></div>
      <div className="nt-body">
        {!prefs.data && <p className="nt-hint">Loading…</p>}
        {prefs.data && !prefs.data.canChoose && <p className="nt-hint">Your teacher chooses which notifications you get.</p>}
        {prefs.data?.types.map(t => (
          <label key={t.id} className="nt-pref">
            <input type="checkbox" checked={t.enabled} disabled={!prefs.data.canChoose} onChange={e => toggle(t, e.target.checked)} />
            <span>{t.label}</span>
          </label>
        ))}
        {prefs.data && !prefs.data.types.length && <p className="nt-hint">No notification types are switched on right now.</p>}
      </div>
    </>
  );
}

/** Header bell: unread badge, the list of notifications, this device's push switch, and personal settings. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const { items, unread, reload, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list');
  const rootRef = useRef(null);

  const close = useCallback(() => { setOpen(false); setView('list'); }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) close(); };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);

  const go = (n) => {
    if (!n.read) markRead([n._id]);
    close();
    if (n.url && n.url.startsWith('/')) navigate(n.url);
  };

  return (
    <div className="nt" ref={rootRef}>
      <button type="button" className="ib" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} onClick={() => { setOpen(o => !o); if (!open) reload(); }}>
        <Bell className="i" aria-hidden="true" />
        {unread > 0 && <span className="nt-count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="nt-panel" role="dialog" aria-label="Notifications">
          {view === 'settings' ? <Preferences onBack={() => setView('list')} /> : (
            <>
              <div className="nt-head">
                <b>Notifications</b>
                <span className="sp" />
                {unread > 0 && <button type="button" className="nt-link" onClick={markAllRead}>Mark all read</button>}
                <button type="button" className="ib sm" aria-label="Notification settings" onClick={() => setView('settings')}><Ic as={Settings2} /></button>
              </div>
              <DevicePush />
              <div className="nt-body">
                {!items.length && <p className="nt-hint">Nothing yet. New homework, messages and reminders will show up here.</p>}
                {items.map(n => (
                  <button type="button" key={n._id} className={`nt-item${n.read ? '' : ' unread'}`} onClick={() => go(n)}>
                    <span className="nt-dot" aria-hidden="true" />
                    <span className="nt-txt"><b>{n.title}</b>{n.body && <small>{n.body}</small>}</span>
                    <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
