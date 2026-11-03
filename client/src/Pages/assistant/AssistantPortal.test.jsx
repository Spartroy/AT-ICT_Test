import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TeacherPortal from '../teacher/TeacherPortal';

const mockGet = jest.fn();
jest.mock('../../lib/api', () => ({
  api: { get: (...a) => mockGet(...a), post: jest.fn(), put: jest.fn(), del: jest.fn() },
  API: ''
}));
jest.mock('../../components/portal/NotificationBell', () => () => null);
jest.mock('../../components/Seo', () => () => null);

const withPermissions = (permissions) => {
  localStorage.setItem('user', JSON.stringify({ firstName: 'Sara', lastName: 'Hassan', role: 'assistant', roleData: { permissions } }));
  mockGet.mockImplementation((url) => {
    if (url === '/api/assistant/me') return Promise.resolve({ data: { assistant: { permissions } } });
    return Promise.resolve({ data: {} });
  });
};

const renderPortal = () => render(
  <MemoryRouter initialEntries={['/assistant-dashboard']}>
    <Routes><Route path="/assistant-dashboard/*" element={<TeacherPortal assistant />} /></Routes>
  </MemoryRouter>
);

afterEach(() => { localStorage.clear(); mockGet.mockReset(); });

describe('assistant portal', () => {
  it('shows only the areas the teacher granted, and never Income or Settings', async () => {
    withPermissions({ studentList: 'view', homework: 'edit' });
    renderPortal();
    const nav = within((await screen.findAllByRole('navigation', { name: 'Main' }))[0]);
    expect(nav.getByText('Home')).toBeInTheDocument();
    expect(nav.getByText('Students')).toBeInTheDocument();
    expect(nav.getByText('Work')).toBeInTheDocument();
    ['Library', 'Schedule', 'Inbox', 'Income', 'Settings'].forEach(label => expect(nav.queryByText(label)).not.toBeInTheDocument());
    expect(screen.getByText('Assistant portal')).toBeInTheDocument();
  });

  it('tells an assistant with no access to ask the teacher', async () => {
    withPermissions({});
    renderPortal();
    expect(await screen.findByText(/has not given you access/i)).toBeInTheDocument();
  });

  it('does not ask the server for registrations or income', async () => {
    withPermissions({ studentList: 'view' });
    renderPortal();
    await screen.findAllByText('Students');
    const urls = mockGet.mock.calls.map(c => c[0]);
    expect(urls.some(u => /registration|income|settings/.test(u))).toBe(false);
  });
});
