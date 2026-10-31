import React, { useState } from 'react';
import { NotebookText, Pencil } from 'lucide-react';
import { Ic } from '../../components/portal/kit';
import StudyGuideEditor from './StudyGuideEditor';

/** Library › Study guide: a card that opens the full-screen editor, like the notes and videos open theirs. */
export default function StudyGuideManager() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="card sg-manage">
        <span className="sg-manage-ic"><Ic as={NotebookText} /></span>
        <div className="sg-manage-t">
          <h3>Complete IGCSE ICT Revision</h3>
          <p className="sub">The study guide students read in Labs. Click any text to change it, remove or add cards, tips, common mistakes and quiz questions, and move practical activities. Edits stay a draft until you publish.</p>
        </div>
        <button type="button" className="btn p" onClick={() => setOpen(true)}><Ic as={Pencil} />Open editor</button>
      </div>
      {open && <StudyGuideEditor onClose={() => setOpen(false)} />}
    </>
  );
}
