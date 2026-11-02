import React from 'react';
import { useStudent } from './StudentPortal';
import LearnView from './LearnView';

export default function Learn() {
  const { base } = useStudent();
  return <LearnView base={base} />;
}
