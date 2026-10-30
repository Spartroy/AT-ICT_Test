import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, Network, NotebookText, ArrowRight, Layers } from 'lucide-react';
import { Ic } from '../../../components/portal/kit';
import ResourceViewer from '../../../components/portal/viewer/ResourceViewer';
import Flashcards from './Flashcards';
import StudyGuideReader from '../../guide/StudyGuideReader';

// Experiments that are not part of the normal course yet. They are the same pages the public website links to.
const LABS = [
  { id: 'mindmap', title: 'ICT Mindmap', text: 'The whole syllabus at a glance. Tap a topic to branch into what you need to revise.', src: '/ict-mindmap.html', icon: Network, tag: 'Visual revision' },
  // These two open inside the portal: the revision guide (written by the teacher) and decks of cards per phase.
  { id: 'guide', title: 'Complete IGCSE ICT Revision', text: 'Every chapter in one place: clear notes, practical activities to try, and a quick quiz after each chapter.', icon: NotebookText, tag: 'Revision notes', inline: true },
  { id: 'flashcards', title: 'Flashcards', text: 'Decks of question and answer cards for every phase. Flip them to test yourself, or make your own stack.', icon: Layers, tag: 'Memorise', inline: true }
];

/** Learn › Labs: mind map and study notes, flagged as test-only. */
export default function Labs() {
  const [open, setOpen] = useState(null);
  const [params, setParams] = useSearchParams();
  const lab = params.get('lab');
  const setLab = (id) => setParams(id ? { lab: id } : {}, { replace: false });

  if (lab === 'flashcards') return <Flashcards onBack={() => setLab(null)} />;
  if (lab === 'guide') return <StudyGuideReader onBack={() => setLab(null)} />;
  return (
    <>
      <div className="lab-banner" role="note">
        <span className="lab-ic"><Ic as={FlaskConical} /></span>
        <div>
          <b>For testing purposes only</b>
          <p>These are early versions we're trying out. They may change or disappear, and your progress here isn't tracked.</p>
        </div>
      </div>
      <div className="lab-grid">
        {LABS.map(l => (
          <button type="button" className="card lab-card" key={l.id} onClick={() => (l.inline ? setLab(l.id) : setOpen(l))}>
            <span className="lab-top"><span className="lab-ic"><Ic as={l.icon} /></span><span className="chip c-am">{l.tag}</span></span>
            <h3>{l.title}</h3>
            <p className="sub">{l.text}</p>
            <span className="lab-go">Open <Ic as={ArrowRight} /></span>
          </button>
        ))}
      </div>
      {open && <ResourceViewer kind="web" src={open.src} title={open.title} backLabel="Back to Labs" onClose={() => setOpen(null)} />}
    </>
  );
}
