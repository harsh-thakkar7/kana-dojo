/**
 * Selects distinct displayed distractors while excluding the displayed
 * correct answer. Candidate order is preserved so callers can shuffle first.
 */
export const getUniqueIncorrectOptions = (
  correctAnswer: string,
  candidates: readonly string[],
  count: number,
  keyOf: (value: string) => string = value => value,
): string[] => {
  const seen = new Set([keyOf(correctAnswer)]);
  const options: string[] = [];

  for (const candidate of candidates) {
    if (options.length >= count) break;
    const key = keyOf(candidate);
    if (seen.has(key)) continue;

    seen.add(key);
    options.push(candidate);
  }

  return options;
};
