import type { IKanjiObj } from '@/entities/kanji';
import { toHiragana } from 'wanakana';
import {
  normalizeAnswerValue,
  normalizeMeaningAnswer,
} from '@/shared/utils/meanings';

const readingKey = (value: string): string =>
  toHiragana(normalizeAnswerValue(value));

const normalizeReading = (reading: string): string =>
  readingKey(reading.split(' ')[0] ?? '');

export const isKanjiAnswerCorrect = (
  kanji: IKanjiObj,
  answer: string,
  isReverse: boolean | undefined,
): boolean => {
  const normalizedAnswer = isReverse
    ? normalizeAnswerValue(answer)
    : normalizeMeaningAnswer(answer);
  if (!normalizedAnswer) return false;

  if (!isReverse) {
    return kanji.meanings.some(
      meaning => normalizeMeaningAnswer(meaning) === normalizedAnswer,
    );
  }

  return (
    normalizeAnswerValue(kanji.kanjiChar) === normalizedAnswer ||
    kanji.kunyomi.some(
      reading => normalizeReading(reading) === readingKey(normalizedAnswer),
    ) ||
    kanji.onyomi.some(
      reading => normalizeReading(reading) === readingKey(normalizedAnswer),
    )
  );
};
