import React from 'react';
import HomeworkModal from './HomeworkModal';
import { QuizModal, AnnouncementModal, VideoModal, NoteModal } from './ContentModals';
import { MaterialModal } from './MaterialWizard';
import { ScheduleModal, AssignStudentsModal } from './ScheduleModals';
import { LiveSessionModal, AttendanceModal } from './LiveModals';
import { SampleModal } from './SampleModal';
import { StackFormDialog } from '../../../components/portal/Flashcards';
import { announceChange } from './form';
import { Dialog, DialogHeader } from '../../../components/portal/PortalUI';
import { ShieldCheck } from 'lucide-react';

/** Shown when an assistant without edit access opens an editing dialog. */
function ViewOnlyDialog({ open, onClose, area }) {
  if (!open) return null;
  return (
    <Dialog open onClose={onClose} size="sm" labelledBy="vo-title">
      <DialogHeader id="vo-title" icon={ShieldCheck} title="View-only access" sub="Ask the teacher for edit access" onClose={onClose} />
      <div className="mbody">
        <p>{area ? `You can look at ${area}, but not change it.` : 'This is only available to the teacher.'}</p>
        <div className="mfoot"><button type="button" className="btn p" onClick={onClose}>OK</button></div>
      </div>
    </Dialog>
  );
}

/** Renders whichever global teacher modal is open (quick actions and page buttons share these). */
export default function TeacherModals({ modal, onClose }) {
  const type = modal?.type;
  return (
    <>
      <ViewOnlyDialog open={type === 'denied'} onClose={onClose} area={modal?.area} />
      <HomeworkModal open={type === 'hw'} onClose={onClose} />
      <QuizModal open={type === 'quiz'} onClose={onClose} />
      <AnnouncementModal open={type === 'announcement'} onClose={onClose} announcement={modal?.announcement} />
      <VideoModal open={type === 'video'} onClose={onClose} video={modal?.video} />
      <NoteModal open={type === 'note'} onClose={onClose} note={modal?.note} />
      <MaterialModal open={type === 'material'} onClose={onClose} material={modal?.material} pastpaper={modal?.pastpaper} />
      <ScheduleModal open={type === 'schedule'} onClose={onClose} schedule={modal?.schedule} />
      <AssignStudentsModal open={type === 'assign'} onClose={onClose} schedule={modal?.schedule} />
      <LiveSessionModal open={type === 'live'} onClose={onClose} session={modal?.session} slot={modal?.slot} />
      <AttendanceModal open={type === 'attendance'} onClose={onClose} session={modal?.session} />
      <SampleModal open={type === 'sample'} onClose={onClose} sample={modal?.sample} />
      <StackFormDialog open={type === 'flashcard'} onClose={onClose} stack={modal?.stack} onSaved={() => announceChange('flashcard')} />
    </>
  );
}
