// Where "Preview as student" opens for each Library tab, relative to the teacher base (e.g. '/teacher-dashboard').
// With an item id the preview jumps straight to that item (?focus=<id>); the Learn pages read it.

const PAGES = {
  videos: '/preview/videos',
  notes: '/preview/notes',
  materials: '/preview/materials',
  pastpapers: '/preview/pastpapers',
  flashcards: '/preview/labs?lab=flashcards',
  guide: '/preview/labs?lab=guide'
};

/** Path for a Library tab, optionally focused on one item. Tabs without student pages open the materials shelf. */
export function previewPath(tab, id) {
  const page = PAGES[tab] || PAGES.materials;
  if (id === undefined || id === null || id === '') return page;
  return `${page}${page.includes('?') ? '&' : '?'}focus=${encodeURIComponent(id)}`;
}
