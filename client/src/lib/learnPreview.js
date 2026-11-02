import { createContext, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

/**
 * "Preview as student": the teacher portal shows the student Learn pages read-only.
 * Inside a preview the pages read from teacher endpoints (every active item, no access rules) and never
 * write: no progress, points, practised ticks, flashcard study counts or download counts.
 */
export const PREVIEW_API = `${API_ENDPOINTS.BASE_URL}/api/teacher/preview`;

/** What setDone() returns in a preview, so the page can say nothing was saved. */
export const PREVIEW = 'preview';
export const PREVIEW_NOTE = 'Preview only. Nothing is saved.';

/** Where each Learn page reads from. `progress` is null in a preview (there is no student to track). */
export const learnEndpoints = (preview) => (preview ? {
  materials: `${PREVIEW_API}/materials`,
  videos: `${PREVIEW_API}/videos`,
  notes: `${PREVIEW_API}/notes`,
  pastPapers: API_ENDPOINTS.TEACHER_PASTPAPERS,
  progress: null,
  pastPaperProgress: null
} : {
  materials: API_ENDPOINTS.STUDENT.MATERIALS,
  videos: API_ENDPOINTS.STUDENT.VIDEOS,
  notes: API_ENDPOINTS.STUDENT.NOTES,
  pastPapers: API_ENDPOINTS.PASTPAPERS,
  progress: '/api/student/progress',
  pastPaperProgress: '/api/student/pastpaper-progress'
});

const LearnPreviewContext = createContext(false);
export const LearnPreviewProvider = LearnPreviewContext.Provider;

/** True when the Learn pages are shown to a teacher. */
export const useLearnPreview = () => useContext(LearnPreviewContext);

export const useLearnEndpoints = () => learnEndpoints(useLearnPreview());

/** The item a Library row asked to open (?focus=<id>), only inside a preview. */
export const useFocusTarget = () => {
  const preview = useLearnPreview();
  const [params] = useSearchParams();
  return preview ? params.get('focus') : null;
};

/** `focus` ids for Library rows: past papers are one row per paper + year ("2-2024"). */
export const pastPaperOfFocus = (focus) => {
  const [paper] = String(focus || '').split('-');
  return [1, 2, 3].includes(Number(paper)) ? Number(paper) : null;
};
