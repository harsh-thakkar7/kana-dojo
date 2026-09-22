export type ClassicGoAction =
  | 'game-modes-modal'
  | 'manual-selection'
  | 'auto-learning';

interface ClassicGoInput {
  currentDojo: string;
  isFilled: boolean;
  showExperimentalModes: boolean;
}

export function resolveClassicGoAction({
  currentDojo,
  isFilled,
  showExperimentalModes,
}: ClassicGoInput): ClassicGoAction {
  if (showExperimentalModes) return 'game-modes-modal';
  if (currentDojo === 'vocabulary' && isFilled) return 'manual-selection';
  return 'auto-learning';
}
