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
      resolveClassicGoAction({ isFilled: true, showExperimentalModes: true }),
    ).toBe('game-modes-modal');
  });

  it('uses the manual selection when the user has filled a selection', () => {
    expect(resolveClassicGoAction({ ...base, isFilled: true })).toBe(
      'manual-selection',
    );
  });

  it('falls back to auto-learning without a manual selection', () => {
    expect(resolveClassicGoAction(base)).toBe('auto-learning');
  });
});
