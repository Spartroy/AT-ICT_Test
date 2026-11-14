import { useCallback } from 'react';
import useApi from '../../../hooks/useApi';
import { api } from '../../../lib/api';
import { PREVIEW, useLearnPreview } from '../../../lib/learnPreview';

const URL = '/api/student/practical-progress';
const read = (d) => ({
  guides: new Set(d?.guides || []),
  skills: new Set(d?.skills || []),
  submissions: new Map((d?.submissions || []).map(s => [s.guide, s]))
});

/**
 * The student's skill tree: guides with evidence handed in, ticked skills, and the submissions themselves.
 * `set` ticks a skill (optimistic); `submit` uploads evidence for a guide.
 */
export default function usePracticalProgress() {
  const preview = useLearnPreview();
  const { data, setData, loading, error, reload } = useApi(preview ? null : URL, b => read(b.data));

  const set = useCallback(async (kind, id, done) => {
    const key = kind === 'guide' ? 'guides' : 'skills';
    const apply = (on) => setData(d => {
      const next = new Set(d?.[key] || []);
      if (on) next.add(id); else next.delete(id);
      return { guides: d?.guides || new Set(), skills: d?.skills || new Set(), submissions: d?.submissions || new Map(), [key]: next };
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

  /** Hands in evidence for one guide: `files` is a list of File objects. Resolves with the saved state, or throws with a message. */
  const submit = useCallback(async (guide, files, note) => {
    if (preview) return PREVIEW;
    const fd = new FormData();
    files.forEach(f => fd.append('homework', f));
    fd.append('note', note || '');
    const res = await api.post(`${URL}/submit/${guide}`, fd);
    setData(read(res.data));
    return true;
  }, [setData, preview]);

  return {
    guides: data?.guides || new Set(),
    skills: data?.skills || new Set(),
    submissions: data?.submissions || new Map(),
    loading, error, reload, set, submit, preview
  };
}
