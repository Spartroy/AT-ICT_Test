import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportCard from './ReportCard';
import ReportsView from './ReportsView';

const report = {
  _id: 'r2', weekNumber: 4, weekStart: '2026-11-02T00:00:00.000Z', session: 'JUN 27', gained: 43, possible: 50, status: 'published',
  lessons: [
    { number: 1, contribution: 5, hw: { title: 'CH 5 Database', state: 'done', mark: 9, max: 10 }, quiz: { title: 'Quiz 1', state: 'done', mark: 28, max: 30 } },
    { number: 2, contribution: 4, hw: { title: 'CH 6 P1', state: 'late', mark: 6, max: 10 }, quiz: { title: '', state: 'none', mark: null, max: null } }
  ],
  attitude: [{ label: 'Focus', rating: 5 }, { label: 'Respect', rating: 4 }],
  comments: 'Lovely work this week.'
};
const previous = { _id: 'r1', weekNumber: 3, weekStart: '2026-10-26T00:00:00.000Z', gained: 30, possible: 50, lessons: [], attitude: [] };

describe('ReportCard', () => {
  it('shows the score, trend, lessons, ratings and the teacher note', () => {
    render(<ReportCard report={report} reports={[report, previous]} name="Sara Ali" />);
    expect(screen.getByText('Sara’s week')).toBeInTheDocument();
    expect(screen.getByText('43')).toBeInTheDocument();
    expect(screen.getByText(/26% up on last week/)).toBeInTheDocument();
    expect(screen.getByText('CH 5 Database')).toBeInTheDocument();
    expect(screen.getByText('Handed in late')).toBeInTheDocument();
    expect(screen.getByLabelText('Focus: 5 / 5')).toBeInTheDocument();
    expect(screen.getByText('Lovely work this week.')).toBeInTheDocument();
    expect(screen.getByText('Homework hero')).toBeInTheDocument();
  });

  it('says so when no one has published anything yet', () => {
    render(<ReportsView state={{ data: { reports: [] }, loading: false }} name="Sara" />);
    expect(screen.getByText(/No weekly reports yet/)).toBeInTheDocument();
  });
});
