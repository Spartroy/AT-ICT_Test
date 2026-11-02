import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { announcePoints } from '../pointsEvents';
import { PREVIEW, useLearnEndpoints, useLearnPreview } from '../../../lib/learnPreview';

/** Completed video / note ids for the signed-in student, with optimistic mark/unmark. */
export default function useProgress() {
  const preview = useLearnPreview();
  const { progress: url } = useLearnEndpoints();
  const { data, setData, loading, error, reload } = useApi(url, b => ({
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
    // A teacher's preview ticks the box on screen only; nothing is sent.
    if (preview) return PREVIEW;
    try {
      const res = await api.put(`/api/student/progress/${kind}/${id}`, { done });
      announcePoints(res.data?.points);
      return true;
    } catch {
      apply(!done);
      return false;
    }
  }, [setData, preview]);

  return {
    videos: data?.videos || new Set(),
    notes: data?.notes || new Set(),
    loading,
    error,
    reload,
    setDone
  };
}
