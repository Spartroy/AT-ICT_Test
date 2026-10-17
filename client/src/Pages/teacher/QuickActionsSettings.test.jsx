import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickActionsSettings from './QuickActionsSettings';
import { DEFAULT_QUICK_ACTIONS } from './quickActionCatalog';

jest.mock('../../components/portal/PortalUI', () => ({ useToast: () => mockToast }));
const mockToast = jest.fn();

/** Behaves like useTeacherSettings: save() asks the "server", then merges what it kept into settings. */
function Harness({ server, initial = null, extra = {} }) {
  const [settings, setSettings] = useState({ quickActions: initial, examSessions: [], ...extra });
  const save = async (changes) => {
    const kept = server(changes);
    setSettings(s => ({ ...s, ...kept }));
    return { ok: true, message: 'Settings saved', data: kept };
  };
  return (
    <>
      <QuickActionsSettings settings={settings} save={save} />
      <button type="button" onClick={() => setSettings(s => ({ ...s, examSessions: [...s.examSessions, { code: 'X' }], notifications: { fresh: true } }))}>refresh unrelated</button>
    </>
  );
}

const rows = () => within(screen.getByRole('list')).getAllByRole('listitem').map(li => li.querySelector('.set-qa__l').textContent);
const labelsOf = (ids) => ids.length;

beforeEach(() => mockToast.mockClear());

describe('QuickActionsSettings', () => {
  it('starts with the default actions', () => {
    render(<Harness server={() => ({})} />);
    expect(rows()).toHaveLength(DEFAULT_QUICK_ACTIONS.length);
  });

  it('adds an action, saves, and keeps every other action', async () => {
    const server = jest.fn(changes => ({ quickActions: changes.quickActions }));
    render(<Harness server={server} />);
    await userEvent.click(screen.getByRole('button', { name: /Add material/ }));
    expect(rows()).toHaveLength(DEFAULT_QUICK_ACTIONS.length + 1);
    await userEvent.click(screen.getByRole('button', { name: 'Save quick actions' }));

    expect(server).toHaveBeenCalledWith({ quickActions: [...DEFAULT_QUICK_ACTIONS, 'material'] });
    expect(rows()).toHaveLength(DEFAULT_QUICK_ACTIONS.length + 1);
    expect(rows()).toContain('Create H.W');
    expect(rows()).toContain('Add material');
    expect(mockToast).toHaveBeenCalledWith('Quick actions saved');
  });

  it('keeps unsaved edits when other settings refresh in the background', async () => {
    render(<Harness server={() => ({})} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Create quiz' }));
    await userEvent.click(screen.getByRole('button', { name: 'refresh unrelated' }));
    expect(rows()).not.toContain('Create quiz');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('says so when the server says "saved" but did not keep the change', async () => {
    render(<Harness server={() => ({})} />); // an out-of-date server ignores quickActions
    await userEvent.click(screen.getByRole('button', { name: /Add material/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save quick actions' }));
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("didn't keep"));
    expect(labelsOf(rows())).toBe(DEFAULT_QUICK_ACTIONS.length);
  });

  it('reorders and removes, and cannot go below one action or above ten', async () => {
    render(<Harness server={() => ({})} initial={['hw', 'quiz']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Move Create quiz up' }));
    expect(rows()).toEqual(['Create quiz', 'Create H.W']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Create quiz' }));
    expect(screen.getByRole('button', { name: 'Remove Create H.W' })).toBeDisabled();
  });

  it('only offers Add while there is room', async () => {
    render(<Harness server={() => ({})} initial={['hw', 'quiz', 'announcement', 'video', 'note', 'regs', 'schedule', 'material', 'flashcard', 'live']} />);
    expect(screen.queryByText('Add:')).toBeNull();
  });
});
