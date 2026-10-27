import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { announcePoints } from '../pointsEvents';

/** Keys of the past papers the student has marked as practised, with optimistic tick/untick. */
export default function usePastPaperProgress() {
  const { data, setData, loading, error } = useApi('/api/student/pastpaper-progress', b => new Set(b.data?.keys || []));

  const setDone = useCallback(async (key, done) => {
    const apply = (on) => setData(d => {
      const next = new Set(d || []);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
    apply(done);
    try {
      const res = await api.put(`/api/student/pastpaper-progress/${key}`, { done });
      announcePoints(res.data?.points);
      return true;
    } catch {
      apply(!done);
      return false;
    }
  }, [setData]);

  return { done: data || new Set(), loading, error, setDone };
}
