import { iconFor, sizeTier, splitTitle, COVER_PHONE } from './bookDesign';
import { BookOpen, Compass, FilePenLine, ListChecks, MonitorCog } from 'lucide-react';

describe('book design helpers', () => {
  it('picks an icon from the title, then the type', () => {
    expect(iconFor({ title: 'Classified', type: 'theory' })).toBe(FilePenLine);
    expect(iconFor({ title: 'Practical Guideance', type: 'practical' })).toBe(Compass);
    expect(iconFor({ title: 'Practical Skill Checker', type: 'practical' })).toBe(ListChecks);
    expect(iconFor({ title: 'Excel files', type: 'practical' })).toBe(MonitorCog);
    expect(iconFor({ title: 'Something else', type: 'theory' })).toBe(BookOpen);
  });

  it('shrinks the text as titles get longer', () => {
    expect(sizeTier('Classified')).toBe('l');
    expect(sizeTier('Theory Summary')).toBe('m');
    expect(sizeTier('Practical Skill Checker')).toBe('s');
    expect(sizeTier('Complete IGCSE ICT Revision Pack 2027')).toBe('xs');
    expect(sizeTier('Supercalifragilistic')).toBe('xs');
  });

  it('splits a title into first, middle and last letter', () => {
    expect(splitTitle('Classified')).toEqual({ first: 'C', middle: 'lassifie', last: 'd' });
    expect(splitTitle('AB')).toEqual({ first: 'AB', middle: '', last: '' });
  });

  it('prints the phone number in local format', () => {
    expect(COVER_PHONE).toBe('01274584000');
  });
});
