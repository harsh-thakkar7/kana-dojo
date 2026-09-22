import { describe, expect, it } from 'vitest';

import { resolveClassicGoAction } from './trainingAction';

describe('resolveClassicGoAction', () => {
  const base = { isFilled: false, showExperimentalModes: false };

  it('opens the game modes modal when experimental modes are enabled', () => {
    expect(
      resolveClassicGoAction({ ...base, showExperimentalModes: true }),
    ).toBe('game-modes-modal');
  });

  it('opens the game modes modal even with a manual selection available', () => {
    expect(
      resolveClassicGoAction({
        currentDojo: 'vocabulary',
        isFilled: true,
        showExperimentalModes: true,
      }),
    ).toBe('game-modes-modal');
  });

  it('uses the manual selection for vocabulary when the user has filled a selection', () => {
    expect(
      resolveClassicGoAction({
        ...base,
        currentDojo: 'vocabulary',
        isFilled: true,
      }),
    ).toBe('manual-selection');
  });

  it('falls back to auto-learning for vocabulary without a manual selection', () => {
    expect(resolveClassicGoAction({ currentDojo: 'vocabulary', ...base })).toBe(
      'auto-learning',
    );
  });

  it('falls back to auto-learning for kana', () => {
    expect(resolveClassicGoAction({ currentDojo: 'kana', ...base })).toBe(
      'auto-learning',
    );
  });

  it('falls back to auto-learning for kanji', () => {
    expect(resolveClassicGoAction({ currentDojo: 'kanji', ...base })).toBe(
      'auto-learning',
    );
  });
});
