import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../../lib/api';
import StudentPreview from './StudentPreview';

jest.mock('./TeacherPortal', () => ({ useTeacher: () => ({ base: '/teacher-dashboard' }) }));
jest.mock('../../lib/api', () => ({ api: { get: jest.fn(), put: jest.fn(), post: jest.fn() }, downloadFile: jest.fn() }));
jest.mock('../student/pointsEvents', () => ({ announcePoints: jest.fn() }));

const notes = { data: { notes: { phase1: [{ _id: 'n1', title: 'Chapter 1 Types of computer', chapter: 1, order: 1, linkUrl: '' }], phase2: [], phase3: [] } } };

const renderAt = (url) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes><Route path="/teacher-dashboard/preview/:tab" element={<StudentPreview />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
  api.post.mockReset();
  api.get.mockImplementation(async (url) => {
    if (url.includes('/api/teacher/preview/notes')) return notes;
    throw new Error(`unexpected GET ${url}`);
  });
});

describe('Preview as student', () => {
  it('shows the student notes from the teacher endpoint and says it is a preview', async () => {
    renderAt('/teacher-dashboard/preview/notes');
    expect(screen.getByText(/Previewing as a student/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Open chapter 1/ })).toBeInTheDocument();
    expect(api.get.mock.calls.map(c => c[0]).some(u => u.includes('/api/student/'))).toBe(false);
  });

  it('marking a chapter read saves nothing and says so', async () => {
    renderAt('/teacher-dashboard/preview/notes');
    await screen.findByRole('button', { name: /Open chapter 1/ });
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(await screen.findByText('Preview only. Nothing is saved.')).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
