import { previewPath } from './previewLinks';

describe('previewPath', () => {
  it('opens the matching student page for each Library tab', () => {
    expect(previewPath('videos')).toBe('/preview/videos');
    expect(previewPath('notes')).toBe('/preview/notes');
    expect(previewPath('pastpapers')).toBe('/preview/pastpapers');
    expect(previewPath('guide')).toBe('/preview/labs?lab=guide');
  });

  it('adds the item to focus, joining onto an existing query', () => {
    expect(previewPath('materials', 'abc123')).toBe('/preview/materials?focus=abc123');
    expect(previewPath('flashcards', 's1')).toBe('/preview/labs?lab=flashcards&focus=s1');
    expect(previewPath('pastpapers', '2-2024')).toBe('/preview/pastpapers?focus=2-2024');
  });

  it('falls back to the materials shelf for tabs with no student page', () => {
    expect(previewPath('samples')).toBe('/preview/materials');
    expect(previewPath('site', 'x')).toBe('/preview/materials?focus=x');
  });
});
