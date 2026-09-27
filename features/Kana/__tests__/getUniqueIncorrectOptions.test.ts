import { describe, expect, it } from 'vitest';
import { getUniqueIncorrectOptions } from '@/features/Kana/lib/getUniqueIncorrectOptions';
import { kanaReadingKey } from '@/features/Kana/lib/kanaReadingKey';

describe('getUniqueIncorrectOptions', () => {
  it('excludes every distractor that renders like the correct answer', () => {
    expect(
      getUniqueIncorrectOptions('ji', ['ji', 'ka', 'ji', 'zu'], 3),
    ).toEqual(['ka', 'zu']);
  });

  it('deduplicates shared ji and zu distractors', () => {
    expect(
      getUniqueIncorrectOptions(
        'ka',
        ['ji', 'ji', 'zu', 'zu', 'shi', 'chi'],
        4,
      ),
    ).toEqual(['ji', 'zu', 'shi', 'chi']);
  });

  it('preserves candidate order and respects the requested count', () => {
    expect(
      getUniqueIncorrectOptions('あ', ['い', 'う', 'え', 'お'], 3),
    ).toEqual(['い', 'う', 'え']);
  });

  it('returns fewer options when the pool lacks enough unique labels', () => {
    expect(getUniqueIncorrectOptions('zu', ['ji', 'ji', 'zu'], 4)).toEqual([
      'ji',
    ]);
  });

  it('deduplicates distractors through a custom keyOf function', () => {
    const lowercaseKey = (value: string) => value.toLowerCase();
    expect(
      getUniqueIncorrectOptions(
        'SHI',
        ['shi', 'ka', 'ZU', 'zu', 'MA'],
        4,
        lowercaseKey,
      ),
    ).toEqual(['ka', 'ZU', 'MA']);
  });

  it('excludes other-script variants of the correct answer via kanaReadingKey', () => {
    // Regression #28638: with hiragana and katakana groups both selected, the
    // opposite-script rendition (ヨ) is the same reading as the answer (よ) and
    // must not be offered as a distractor.
    expect(
      getUniqueIncorrectOptions('よ', ['ヨ', 'か', 'き'], 3, kanaReadingKey),
    ).toEqual(['か', 'き']);
  });

  it('deduplicates other-script duplicates among the distractors', () => {
    expect(
      getUniqueIncorrectOptions('か', ['ヨ', 'よ', 'き'], 3, kanaReadingKey),
    ).toEqual(['ヨ', 'き']);
  });
});
