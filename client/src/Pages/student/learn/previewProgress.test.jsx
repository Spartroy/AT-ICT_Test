import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { api } from '../../../lib/api';
import { LearnPreviewProvider, PREVIEW } from '../../../lib/learnPreview';
import useProgress from './useProgress';
import usePastPaperProgress from './usePastPaperProgress';

jest.mock('../../../lib/api', () => ({ api: { get: jest.fn(), put: jest.fn() } }));
jest.mock('../pointsEvents', () => ({ announcePoints: jest.fn() }));

const inPreview = ({ children }) => <LearnPreviewProvider value>{children}</LearnPreviewProvider>;

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
});

describe('a teacher preview records nothing', () => {
  it('video / note progress is neither loaded nor saved, but the tick shows on screen', async () => {
    const { result } = renderHook(() => useProgress(), { wrapper: inPreview });
    let outcome;
    await act(async () => { outcome = await result.current.setDone('video', 'v1', true); });
    expect(outcome).toBe(PREVIEW);
    expect(result.current.videos.has('v1')).toBe(true);
    expect(api.get).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('practised ticks on past papers are neither loaded nor saved', async () => {
    const { result } = renderHook(() => usePastPaperProgress(), { wrapper: inPreview });
    let outcome;
    await act(async () => { outcome = await result.current.setDone('2-2024-jun-1', true); });
    expect(outcome).toBe(PREVIEW);
    expect(api.get).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe('students still save their progress', () => {
  it('loads and saves video progress', async () => {
    api.get.mockResolvedValue({ data: { videos: ['v0'], notes: [] } });
    api.put.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useProgress());
    await waitFor(() => expect(result.current.videos.has('v0')).toBe(true));
    await act(async () => { await result.current.setDone('video', 'v1', true); });
    expect(api.put).toHaveBeenCalledWith('/api/student/progress/video/v1', { done: true });
  });
});
