import { BookOpen, Compass, FilePenLine, Library, ListChecks, MonitorCog, Network, NotebookText, PlayCircle, ClipboardCheck } from 'lucide-react';
import { DEFAULT_SITE } from '../../site/siteContent';

export const AUTHOR = 'MR. AHMAD TAMER ALI';

// 201274584000 -> 01274584000 (printed on the cover like the real books)
export const COVER_PHONE = DEFAULT_SITE.whatsappNumber.replace(/^20/, '0');

// First matching keyword wins; otherwise the material type decides.
const BY_KEYWORD = [
  [/classif|past ?paper|paper \d/i, FilePenLine],
  [/mock|quiz|test|exam/i, ClipboardCheck],
  [/skill|check/i, ListChecks],
  [/guid/i, Compass],
  [/summary|notes?\b|revision/i, NotebookText],
  [/mind ?map|map/i, Network],
  [/video|lesson|record/i, PlayCircle],
  [/practical|excel|word|access|power ?point|share ?point/i, MonitorCog]
];
const BY_TYPE = { theory: BookOpen, practical: MonitorCog, other: Library };

/** A lucide icon that relates to the book (by title keyword, then by type). */
export const iconFor = (m) => BY_KEYWORD.find(([re]) => re.test(m.title || ''))?.[1] || BY_TYPE[m.type] || BookOpen;

/** Text size tier from the title length so long names stay fully visible: 'l' | 'm' | 's' | 'xs'. */
export const sizeTier = (title = '') => {
  const longest = Math.max(...title.split(/\s+/).map(w => w.length), 0);
  const n = title.trim().length;
  if (n <= 10 && longest <= 10) return 'l';
  if (n <= 20 && longest <= 12) return 'm';
  if (n <= 34 && longest <= 14) return 's';
  return 'xs';
};

/** Splits a title into first letter, middle and last letter (the cover colours the ends). */
export const splitTitle = (title = '') => {
  const t = title.trim();
  if (t.length < 3) return { first: t, middle: '', last: '' };
  return { first: t[0], middle: t.slice(1, -1), last: t.slice(-1) };
};
