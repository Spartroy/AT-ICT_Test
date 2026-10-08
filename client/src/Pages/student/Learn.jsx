import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Folder, Play, BookOpen, LayoutGrid } from 'lucide-react';
import { Seg } from '../../components/portal/kit';
import { useStudent } from './StudentPortal';
import Bookshelf from './learn/Bookshelf';
import VideoMaps from './learn/VideoMaps';
import NotesOrbit from './learn/NotesOrbit';
import Flashcards from './learn/Flashcards';

const TABS = [
  { id: 'materials', label: 'Materials', icon: Folder, Component: Bookshelf },
  { id: 'videos', label: 'Videos', icon: Play, Component: VideoMaps },
  { id: 'notes', label: 'Notes', icon: BookOpen, Component: NotesOrbit },
  { id: 'flashcards', label: 'Flashcards', icon: LayoutGrid, Component: Flashcards }
];

export default function Learn() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base } = useStudent();
  const current = TABS.find(t => t.id === tab);
  if (!current) return <Navigate to={`${base}/learn/materials`} replace />;
  const { Component } = current;

  return (
    <>
      <div className="ph"><h1>Everything you study, in one place</h1></div>
      <Seg tabs={TABS} value={tab} onChange={id => navigate(`${base}/learn/${id}`)} label="Learning sections" />
      <div className="sub-v on" key={tab}>
        <Component />
      </div>
    </>
  );
}
