import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Folder, Play, BookOpen, FlaskConical, FileClock } from 'lucide-react';
import { Seg } from '../../components/portal/kit';
import Bookshelf from './learn/Bookshelf';
import VideoMaps from './learn/VideoMaps';
import NotesOrbit from './learn/NotesOrbit';
import Labs from './learn/Labs';
import PastPapers from './learn/PastPapers';

export const LEARN_TABS = [
  { id: 'materials', label: 'Materials', icon: Folder, Component: Bookshelf },
  { id: 'videos', label: 'Videos', icon: Play, Component: VideoMaps },
  { id: 'notes', label: 'Notes', icon: BookOpen, Component: NotesOrbit },
  { id: 'pastpapers', label: 'Past papers', icon: FileClock, Component: PastPapers },
  { id: 'labs', label: 'Labs', icon: FlaskConical, Component: Labs }
];

/** The Learn tabs under `${base}/learn/:tab` (students) or `${base}/:tab` with `learnPath=""` (teacher preview). */
export default function LearnView({ base, learnPath = '/learn' }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const root = `${base}${learnPath}`;
  const current = LEARN_TABS.find(t => t.id === tab);
  if (tab === 'flashcards') return <Navigate to={`${root}/labs?lab=flashcards`} replace />; // flashcards live in Labs now
  if (!current) return <Navigate to={`${root}/materials`} replace />;
  const { Component } = current;

  return (
    <>
      <div className="ph"><h1>Everything you study, in one place</h1></div>
      <Seg tabs={LEARN_TABS} value={tab} onChange={id => navigate(`${root}/${id}`)} label="Learning sections" slide />
      <div className="sub-v on" key={tab}>
        <Component />
      </div>
    </>
  );
}
