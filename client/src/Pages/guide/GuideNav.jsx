import React, { useEffect, useState } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';
import { chapterTag, groupChapters, plainText, sectionNum } from './guideLogic';

const Icon = ({ as: I }) => <I className="sg-i" aria-hidden="true" />;

/** The section that is currently being read: the last one whose top has passed the top of the viewport. */
function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return undefined;
    const seen = new Map();
    const pick = () => {
      const visible = ids.filter(id => seen.get(id));
      setActive(visible[0] || null);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => seen.set(e.target.dataset.sec, e.isIntersecting));
      pick();
    }, { rootMargin: '-15% 0px -70% 0px' });
    ids.forEach((id) => {
      const el = document.getElementById(`sec-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/**
 * Contents: the three phases, their chapters, and the sections of the chapter being read.
 * On a phone it folds into a single "Contents" bar so the page keeps its width.
 */
export default function GuideNav({ chapters, current, onSelect, onSection }) {
  const [open, setOpen] = useState(false);
  const groups = groupChapters(chapters);
  const ch = chapters[current];
  const ids = ch ? ch.secs.map(s => s.id) : [];
  const active = useActiveSection(ids);

  const go = (fn) => { fn(); setOpen(false); };

  return (
    <nav className={`sg-nav ${open ? 'open' : ''}`} aria-label="Guide contents">
      <button type="button" className="sg-nav-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <Icon as={ListTree} />
        <span><small>Contents</small><b>{ch ? `${chapterTag(ch)} · ${plainText(ch.title)}` : 'Choose a chapter'}</b></span>
        <Icon as={ChevronDown} />
      </button>
      <div className="sg-nav-body">
        {groups.map(g => (
          <div key={g.title} className="sg-nav-group">
            <div className="sg-nav-phase">{g.title}</div>
            {g.items.map(({ ch: c, index }) => (
              <div key={c.id}>
                <button type="button" className={`sg-nav-ch ${index === current ? 'on' : ''}`} onClick={() => go(() => onSelect(index))} aria-current={index === current ? 'page' : undefined}>
                  <i>{String(c.n).replace(' · PART ', ' P')}</i>
                  <span>{plainText(c.title)} {plainText(c.hl)}</span>
                </button>
                {index === current && (
                  <ul className="sg-nav-secs">
                    {c.secs.map(s => (
                      <li key={s.id}>
                        <button type="button" className={active === s.id ? 'on' : ''} onClick={() => go(() => onSection(s.id))}>
                          <i>{sectionNum(s)}</i><span>{plainText(s.title)}</span>
                        </button>
                      </li>
                    ))}
                    <li><button type="button" onClick={() => go(() => onSection('quiz'))}><i>MCQ</i><span>Chapter check</span></button></li>
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
