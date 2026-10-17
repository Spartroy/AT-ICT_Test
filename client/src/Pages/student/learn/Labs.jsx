import React, { useState } from 'react';
import { FlaskConical, Network, NotebookText, ArrowRight } from 'lucide-react';
import { Ic } from '../../../components/portal/kit';
import ResourceViewer from '../../../components/portal/viewer/ResourceViewer';

// Experiments that are not part of the normal course yet. They are the same pages the public website links to.
const LABS = [
  { id: 'mindmap', title: 'ICT Mindmap', text: 'The whole syllabus at a glance. Tap a topic to branch into what you need to revise.', src: '/ict-mindmap.html', icon: Network, tag: 'Visual revision' },
  { id: 'guide', title: 'Complete IGCSE ICT Revision', text: 'Every chapter in one place: the full revision notes as one study guide.', src: '/study-guide.html', icon: NotebookText, tag: 'Revision notes' }
];

/** Learn › Labs: mind map and study notes, flagged as test-only. */
export default function Labs() {
  const [open, setOpen] = useState(null);
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
          <button type="button" className="card lab-card" key={l.id} onClick={() => setOpen(l)}>
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
