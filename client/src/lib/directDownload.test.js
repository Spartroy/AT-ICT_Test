import { directDownload, isDriveFolder } from './directDownload';

describe('directDownload', () => {
  it('turns Drive file links into direct downloads', () => {
    expect(directDownload('https://drive.google.com/file/d/ABC123/view?usp=sharing')).toEqual({ url: 'https://drive.usercontent.google.com/download?id=ABC123&export=download&confirm=t', isDirect: true });
    expect(directDownload('https://drive.google.com/open?id=ABC123').url).toBe('https://drive.usercontent.google.com/download?id=ABC123&export=download&confirm=t');
  });

  it('does not pretend a Drive folder is one file', () => {
    expect(directDownload('https://drive.google.com/drive/folders/F1').isDirect).toBe(false);
  });

  it('exports Docs, Sheets and Slides', () => {
    expect(directDownload('https://docs.google.com/document/d/D1/edit').url).toBe('https://docs.google.com/document/d/D1/export?format=pdf');
    expect(directDownload('https://docs.google.com/spreadsheets/d/S1/edit#gid=0').url).toBe('https://docs.google.com/spreadsheets/d/S1/export?format=xlsx');
    expect(directDownload('https://docs.google.com/presentation/d/P1/edit').url).toBe('https://docs.google.com/presentation/d/P1/export/pptx');
  });

  it('switches Dropbox links to dl=1', () => {
    expect(directDownload('https://www.dropbox.com/s/abc/files.zip?dl=0')).toEqual({ url: 'https://www.dropbox.com/s/abc/files.zip?dl=1', isDirect: true });
  });

  it('leaves other links alone', () => {
    expect(directDownload('https://example.com/files.zip')).toEqual({ url: 'https://example.com/files.zip', isDirect: false });
    expect(directDownload('not a url').isDirect).toBe(false);
  });

  it('recognises Drive folder links', () => {
    expect(isDriveFolder('https://drive.google.com/drive/folders/1BV0?usp=sharing')).toBe(true);
    expect(isDriveFolder('https://drive.google.com/file/d/ABC/view')).toBe(false);
    expect(isDriveFolder('nope')).toBe(false);
  });
});
