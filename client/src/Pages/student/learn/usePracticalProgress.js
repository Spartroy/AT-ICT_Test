import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { PREVIEW, useLearnPreview } from '../../../lib/learnPreview';

const URL = '/api/student/practical-progress';

/** Finished practical guides and ticked skills for the signed-in student, with optimistic toggling. */
export default function usePracticalProgress() {
  const preview = useLearnPreview();
  const { data, setData, loading, error, reload } = useApi(preview ? null : URL, b => ({ guides: new Set(b.data?.guides || []), skills: new Set(b.data?.skills || []) }));

  const set = useCallback(async (kind, id, done) => {
    const key = kind === 'guide' ? 'guides' : 'skills';
    const apply = (on) => setData(d => {
      const next = new Set(d?.[key] || []);
      if (on) next.add(id); else next.delete(id);
      return { guides: d?.guides || new Set(), skills: d?.skills || new Set(), [key]: next };
    });
    apply(done);
    // A teacher's preview ticks on screen only
    if (preview) return PREVIEW;
    try {
      await api.put(`${URL}/${kind}/${id}`, { done });
      return true;
    } catch {
      apply(!done);
      return false;
    }
  }, [setData, preview]);

  return { guides: data?.guides || new Set(), skills: data?.skills || new Set(), loading, error, reload, set, preview };
}
