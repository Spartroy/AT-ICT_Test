import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';

/** Completed video / note ids for the signed-in student, with optimistic mark/unmark. */
export default function useProgress() {
  const { data, setData, loading, error, reload } = useApi('/api/student/progress', b => ({
    videos: new Set(b.data?.videos || []),
    notes: new Set(b.data?.notes || [])
  }));

  const setDone = useCallback(async (kind, id, done) => {
    const key = kind === 'video' ? 'videos' : 'notes';
    const apply = (on) => setData(d => {
      const next = new Set(d?.[key] || []);
      if (on) next.add(id); else next.delete(id);
      return { ...(d || { videos: new Set(), notes: new Set() }), [key]: next };
    });
    apply(done);
    try {
      await api.put(`/api/student/progress/${kind}/${id}`, { done });
      return true;
    } catch {
      apply(!done);
      return false;
    }
  }, [setData]);

  return {
    videos: data?.videos || new Set(),
    notes: data?.notes || new Set(),
    loading,
    error,
    reload,
    setDone
  };
}
