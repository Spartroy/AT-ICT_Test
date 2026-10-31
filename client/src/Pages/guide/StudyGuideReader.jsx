import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, fmtDate } from '../../components/portal/kit';
import { GuideCtx } from './GuideBlocks';
import GuideScreen from './GuideScreen';
import ChapterView from './GuideChapter';
import GuideNav from './GuideNav';
import { chapterTag, plainText } from './guideLogic';

const READ_ONLY = { editing: false };

/** Smooth-scrolls to a section, or to the chapter quiz. */
export const scrollToSection = (id) => {
  document.getElementById(id === 'quiz' ? 'sg-quiz' : `sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Learn › Labs › the revision study guide, as students read it: full screen over the portal. */
export default function StudyGuideReader({ onBack }) {
  const guide = useApi(API_ENDPOINTS.GUIDE.BASE, (b) => b.data);
  const [params, setParams] = useSearchParams();
  const top = useRef(null);

  const chapters = guide.data?.content?.chapters || [];
  const wanted = chapters.findIndex(c => c.key === params.get('ch'));
  const current = wanted === -1 ? 0 : wanted;

  const select = (index) => {
    const next = new URLSearchParams(params);
    next.set('ch', chapters[index].key);
    setParams(next, { replace: true });
  };

  // A new chapter starts at the top of the page.
  useEffect(() => {
    if (params.get('ch')) top.current?.scrollIntoView({ block: 'start' });
    // Only when the chapter changes, not on every param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('ch')]);

  const screen = (children, actions) => (
    <GuideScreen title="Complete IGCSE ICT Revision" backLabel="Back to Labs" onClose={onBack} actions={actions}>{children}</GuideScreen>
  );
  if (guide.loading && !guide.data) return screen(<Loading label="Opening the study guide…" />);
  if (guide.error) return screen(<ErrorNote error={guide.error} onRetry={guide.reload} />);
  if (!chapters.length) return screen(<Empty>The study guide is empty right now.</Empty>);

  const ch = chapters[current];
  const prev = chapters[current - 1];
  const next = chapters[current + 1];

  const updated = guide.data.publishedAt && <small className="sg-updated">Updated {fmtDate(guide.data.publishedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</small>;
  return screen(
    <div ref={top}>
      <div className="sg-layout">
        <GuideNav chapters={chapters} current={current} onSelect={select} onSection={scrollToSection} />
        <main className="sg-paper">
          <GuideCtx.Provider value={READ_ONLY}>
            <ChapterView key={ch.id} ch={ch} ci={current} />
          </GuideCtx.Provider>
          <div className="sg-pager">
            {prev ? <button type="button" className="sg-btn" onClick={() => select(current - 1)}><Ic as={ArrowLeft} /><span><small>Previous</small>{chapterTag(prev)} · {plainText(prev.title)}</span></button> : <span />}
            {next ? <button type="button" className="sg-btn pri" onClick={() => select(current + 1)}><span><small>Next chapter</small>{chapterTag(next)} · {plainText(next.title)}</span><Ic as={ArrowRight} /></button> : <span />}
          </div>
        </main>
      </div>
    </div>,
    updated
  );
}
