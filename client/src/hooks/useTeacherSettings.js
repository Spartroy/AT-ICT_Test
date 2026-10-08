import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { setAuthHeaders, handleAuthResponse } from '../utils/auth';

/**
 * Teacher-editable settings (exam sessions, Royal College classes).
 * Returns { settings, loading, error, reload, save }. save() resolves to { ok, message, errors }.
 */
export default function useTeacherSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.TEACHER, { headers: setAuthHeaders() });
      if (handleAuthResponse(res)) return;
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Could not load settings');
      setSettings(body.data);
    } catch (e) {
      setError(e.message || 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const save = useCallback(async (changes) => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.TEACHER, {
        method: 'PUT',
        headers: setAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(changes)
      });
      if (handleAuthResponse(res)) return { ok: false };
      const body = await res.json();
      if (!res.ok) return { ok: false, message: body.message, errors: body.errors || [] };
      setSettings(s => ({ ...s, ...body.data }));
      return { ok: true, message: body.message };
    } catch {
      return { ok: false, message: "We couldn't reach the server. Please try again." };
    }
  }, []);

  return { settings, loading, error, reload, save };
}
