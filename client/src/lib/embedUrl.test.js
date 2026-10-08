import { toEmbedUrl } from './embedUrl';

describe('toEmbedUrl', () => {
  it('uses the preview page for Google Drive files', () => {
    expect(toEmbedUrl('https://drive.google.com/file/d/1AbC_dEf/view?usp=sharing')).toBe('https://drive.google.com/file/d/1AbC_dEf/preview');
    expect(toEmbedUrl('https://drive.google.com/open?id=1AbC_dEf')).toBe('https://drive.google.com/file/d/1AbC_dEf/preview');
    expect(toEmbedUrl('https://drive.google.com/uc?export=download&id=1AbC_dEf')).toBe('https://drive.google.com/file/d/1AbC_dEf/preview');
  });

  it('embeds a Drive folder as a list', () => {
    expect(toEmbedUrl('https://drive.google.com/drive/folders/FOLDER1?usp=sharing')).toBe('https://drive.google.com/embeddedfolderview?id=FOLDER1#list');
  });

  it('uses /preview for Docs, Sheets and Slides but leaves published links alone', () => {
    expect(toEmbedUrl('https://docs.google.com/document/d/DOC1/edit?usp=sharing')).toBe('https://docs.google.com/document/d/DOC1/preview');
    expect(toEmbedUrl('https://docs.google.com/presentation/d/SL1/edit#slide=id.p')).toBe('https://docs.google.com/presentation/d/SL1/preview');
    const published = 'https://docs.google.com/document/d/e/2PACX-1v/pub';
    expect(toEmbedUrl(published)).toBe(published);
  });

  it('turns YouTube watch links into embeds', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=abc123&t=5s')).toBe('https://www.youtube.com/embed/abc123');
    expect(toEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube.com/embed/abc123');
  });

  it('returns other links (and invalid ones) unchanged', () => {
    expect(toEmbedUrl('https://prezi.com/view/xyz/')).toBe('https://prezi.com/view/xyz/');
    expect(toEmbedUrl('not a url')).toBe('not a url');
  });
});
