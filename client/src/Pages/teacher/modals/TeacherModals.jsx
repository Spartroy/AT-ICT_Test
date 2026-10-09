import React from 'react';
import HomeworkModal from './HomeworkModal';
import { QuizModal, AnnouncementModal, VideoModal, NoteModal } from './ContentModals';
import { MaterialModal } from './MaterialWizard';
import { ScheduleModal, AssignStudentsModal } from './ScheduleModals';
import { StackFormDialog } from '../../../components/portal/Flashcards';
import { announceChange } from './form';

/** Renders whichever global teacher modal is open (quick actions and page buttons share these). */
export default function TeacherModals({ modal, onClose }) {
  const type = modal?.type;
  return (
    <>
      <HomeworkModal open={type === 'hw'} onClose={onClose} />
      <QuizModal open={type === 'quiz'} onClose={onClose} />
      <AnnouncementModal open={type === 'announcement'} onClose={onClose} announcement={modal?.announcement} />
      <VideoModal open={type === 'video'} onClose={onClose} video={modal?.video} />
      <NoteModal open={type === 'note'} onClose={onClose} note={modal?.note} />
      <MaterialModal open={type === 'material'} onClose={onClose} material={modal?.material} pastpaper={modal?.pastpaper} />
      <ScheduleModal open={type === 'schedule'} onClose={onClose} schedule={modal?.schedule} />
      <AssignStudentsModal open={type === 'assign'} onClose={onClose} schedule={modal?.schedule} />
      <StackFormDialog open={type === 'flashcard'} onClose={onClose} stack={modal?.stack} onSaved={() => announceChange('flashcard')} />
    </>
  );
}
