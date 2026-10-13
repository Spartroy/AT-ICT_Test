import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '../config/api';

const POLL_MS = 60 * 1000;

/**
 * My notifications. Refreshes every minute and whenever the tab comes back into view.
 * Returns { items, unread, reload, markRead(ids), markAllRead() }.
 */
export default function useNotifications() {
  const [state, setState] = useState({ items: [], unread: 0 });

  const reload = useCallback(async () => {
    try {
      const body = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
      setState({ items: body.data?.notifications || [], unread: body.data?.unreadCount || 0 });
    } catch {
      // A missed refresh is harmless; the next one will catch up.
    }
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(reload, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const markRead = useCallback(async (ids) => {
    setState(s => ({
      items: s.items.map(n => (ids.includes(n._id) ? { ...n, read: true } : n)),
      unread: Math.max(0, s.unread - s.items.filter(n => ids.includes(n._id) && !n.read).length)
    }));
    try { await api.post(API_ENDPOINTS.NOTIFICATIONS.READ, { ids }); } catch { reload(); }
  }, [reload]);

  const markAllRead = useCallback(async () => {
    setState(s => ({ items: s.items.map(n => ({ ...n, read: true })), unread: 0 }));
    try { await api.post(API_ENDPOINTS.NOTIFICATIONS.READ, { all: true }); } catch { reload(); }
  }, [reload]);

  return { ...state, reload, markRead, markAllRead };
}
