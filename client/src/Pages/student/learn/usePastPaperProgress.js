import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { announcePoints } from '../pointsEvents';
import { PREVIEW, useLearnEndpoints, useLearnPreview } from '../../../lib/learnPreview';

/** Keys of the past papers the student has marked as practised, with optimistic tick/untick. */
export default function usePastPaperProgress() {
  const preview = useLearnPreview();
  const { pastPaperProgress: url } = useLearnEndpoints();
  const { data, setData, loading, error } = useApi(url, b => new Set(b.data?.keys || []));

  const setDone = useCallback(async (key, done) => {
    const apply = (on) => setData(d => {
      const next = new Set(d || []);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
    apply(done);
    // A teacher's preview ticks the box on screen only; nothing is sent.
    if (preview) return PREVIEW;
    try {
      const res = await api.put(`/api/student/pastpaper-progress/${key}`, { done });
      announcePoints(res.data?.points);
      return true;
    } catch {
      apply(!done);
      return false;
    }
  }, [setData, preview]);

  return { done: data || new Set(), loading, error, setDone };
}
