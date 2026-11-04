import { BookOpen, CalendarDays, ClipboardCheck, ClipboardList, FileText, Folder, GraduationCap, Inbox, Layers, LayoutGrid, Library, Megaphone, MessageSquare, NotebookText, Phone, Play, Users, Video } from 'lucide-react';

/** One icon per portal section and per feature, so access settings read at a glance. */
export const GROUP_ICONS = {
  students: Users,
  work: ClipboardCheck,
  library: Library,
  schedule: CalendarDays,
  inbox: Inbox
};

export const FEATURE_ICONS = {
  studentList: Users,
  groups: Layers,
  parentNumbers: Phone,
  submissions: ClipboardCheck,
  homework: FileText,
  quizzes: GraduationCap,
  videos: Play,
  notes: NotebookText,
  materials: Folder,
  pastPapers: ClipboardList,
  flashcards: LayoutGrid,
  guide: BookOpen,
  classSchedule: CalendarDays,
  live: Video,
  announcements: Megaphone,
  chat: MessageSquare
};
