import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statsApi } from '@/shared/events';
import { useGameStats } from './useGameStats';
import useStatsStore from '../store/useStatsStore';

vi.mock('@/features/Achievements/hooks/useAchievementPrompts', () => ({
  useAchievementPrompts: () => ({
    checkForAchievementProgress: vi.fn(),
  }),
}));

const snapshot = () => useStatsStore.getState();

describe('useGameStats facade (vocabulary stat tracking)', () => {
  let initialState: ReturnType<typeof snapshot>;
  let unmount: () => void;

  beforeEach(() => {
    initialState = snapshot();
    useStatsStore.setState(initialState, true);
  });

  afterEach(() => {
    unmount?.();
    useStatsStore.setState(initialState, true);
  });

  const render = () => {
    const renderResult = renderHook(() => useGameStats());
    unmount = renderResult.unmount;
    return renderResult;
  };

  it('counts a vocabulary correct event toward vocabulary stats and answer time', async () => {
    expect(snapshot().allTimeStats.vocabularyCorrect).toBe(0);
    expect(snapshot().allTimeStats.fastestAnswerMs).toBe(Infinity);

    render();
    await act(async () => {
      statsApi.recordCorrect('vocabulary', '犬', { timeTaken: 1234 });
    });

    const state = snapshot();
    expect(state.numCorrectAnswers).toBe(1);
    expect(state.allTimeStats.vocabularyCorrect).toBe(1);
    expect(state.characterHistory).toContain('犬');
    expect(state.allTimeStats.fastestAnswerMs).toBe(1234);
    expect(state.allTimeStats.answerTimesMs).toEqual([1234]);
  });

  it('does not increment vocabulary stats for non-vocabulary content types', async () => {
    render();
    await act(async () => {
      statsApi.recordCorrect('kana', 'あ');
    });

    const state = snapshot();
    expect(state.numCorrectAnswers).toBe(1);
    expect(state.allTimeStats.vocabularyCorrect).toBe(0);
    expect(state.allTimeStats.answerTimesMs).toEqual([]);
    expect(state.characterHistory).toContain('あ');
  });

  it('records a newer faster answer time and keeps the slower one', async () => {
    render();
    await act(async () => {
      statsApi.recordCorrect('vocabulary', '猫', { timeTaken: 900 });
      statsApi.recordCorrect('vocabulary', '犬', { timeTaken: 1500 });
    });

    const state = snapshot();
    expect(state.allTimeStats.fastestAnswerMs).toBe(900);
    expect(state.allTimeStats.answerTimesMs).toEqual([900, 1500]);
    expect(state.allTimeStats.vocabularyCorrect).toBe(2);
  });

  it('handles a vocabulary event without a timeTaken value', async () => {
    render();
    await act(async () => {
      statsApi.recordCorrect('vocabulary', '魚');
    });

    const state = snapshot();
    expect(state.allTimeStats.vocabularyCorrect).toBe(1);
    expect(state.allTimeStats.answerTimesMs).toEqual([]);
    expect(state.allTimeStats.fastestAnswerMs).toBe(Infinity);
  });
});
