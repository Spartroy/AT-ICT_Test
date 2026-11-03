import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PermissionGrid } from './Assistants';
import { DEFAULT_PERMISSIONS, FEATURES, GROUPS } from '../assistant/access';
import { FEATURE_ICONS, GROUP_ICONS } from '../assistant/featureIcons';

jest.mock('./TeacherPortal', () => ({ useTeacher: () => ({ base: '/teacher-dashboard' }) }));

describe('assistant feature icons', () => {
  it('has an icon for every section and every feature', () => {
    GROUPS.forEach(g => expect(GROUP_ICONS[g.id]).toBeTruthy());
    FEATURES.forEach(f => expect(FEATURE_ICONS[f.id]).toBeTruthy());
  });
});

describe('PermissionGrid', () => {
  it('shows every section and feature with its own none / view / edit control', () => {
    render(<PermissionGrid value={DEFAULT_PERMISSIONS} onChange={() => {}} />);
    GROUPS.forEach(g => expect(screen.getByText(g.label, { selector: 'b' })).toBeInTheDocument());
    FEATURES.forEach(f => expect(screen.getByRole('radiogroup', { name: `${f.label} access` })).toBeInTheDocument());
    const quizzes = within(screen.getByRole('radiogroup', { name: 'Quizzes access' }));
    expect(quizzes.getByRole('radio', { name: 'No access' })).toHaveAttribute('aria-checked', 'true');
  });

  it('changes one feature at a time', () => {
    const onChange = jest.fn();
    render(<PermissionGrid value={DEFAULT_PERMISSIONS} onChange={onChange} />);
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Quizzes access' })).getByRole('radio', { name: 'Can edit' }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_PERMISSIONS, quizzes: 'edit' });
  });

  it('sets every feature in a section from its "set all" control', () => {
    const onChange = jest.fn();
    render(<PermissionGrid value={DEFAULT_PERMISSIONS} onChange={onChange} />);
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Set all Library access' })).getByRole('radio', { name: 'View only' }));
    const sent = onChange.mock.calls[0][0];
    ['videos', 'notes', 'materials', 'pastPapers', 'flashcards', 'guide'].forEach(id => expect(sent[id]).toBe('view'));
    expect(sent.studentList).toBe('view');
    expect(sent.quizzes).toBe('none');
  });

  it('disables the controls while saving', () => {
    render(<PermissionGrid value={DEFAULT_PERMISSIONS} onChange={() => {}} disabled />);
    expect(within(screen.getByRole('radiogroup', { name: 'Videos access' })).getByRole('radio', { name: 'Can edit' })).toBeDisabled();
  });
});
