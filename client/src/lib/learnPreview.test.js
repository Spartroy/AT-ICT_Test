import { learnEndpoints, pastPaperOfFocus, PREVIEW_API } from './learnPreview';

describe('learnEndpoints', () => {
  it('reads from the student endpoints for students', () => {
    const e = learnEndpoints(false);
    expect(e.videos).toMatch(/\/api\/student\/videos$/);
    expect(e.notes).toMatch(/\/api\/student\/notes$/);
    expect(e.materials).toMatch(/\/api\/student\/materials$/);
    expect(e.progress).toBe('/api/student/progress');
    expect(e.pastPaperProgress).toBe('/api/student/pastpaper-progress');
  });

  it('reads from the teacher preview endpoints in a preview, with no progress to load or save', () => {
    const e = learnEndpoints(true);
    expect(e.videos).toBe(`${PREVIEW_API}/videos`);
    expect(e.notes).toBe(`${PREVIEW_API}/notes`);
    expect(e.materials).toBe(`${PREVIEW_API}/materials`);
    expect(e.pastPapers).toMatch(/\/api\/teacher\/pastpapers$/);
    expect(e.progress).toBeNull();
    expect(e.pastPaperProgress).toBeNull();
  });
});

describe('pastPaperOfFocus', () => {
  it('reads the paper from a "paper-year" id', () => {
    expect(pastPaperOfFocus('2-2024')).toBe(2);
    expect(pastPaperOfFocus('3-2019')).toBe(3);
  });

  it('ignores anything that is not paper 1-3', () => {
    expect(pastPaperOfFocus('9-2024')).toBeNull();
    expect(pastPaperOfFocus('')).toBeNull();
    expect(pastPaperOfFocus(null)).toBeNull();
  });
});
