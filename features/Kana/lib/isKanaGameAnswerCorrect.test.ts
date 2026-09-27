import { describe, expect, it } from 'vitest';
import { isKanaGameAnswerCorrect } from './isKanaGameAnswerCorrect';

const shi = { kana: 'し', romaji: 'shi', altRomanji: ['si'] };
const a = { kana: 'あ', romaji: 'a', altRomanji: [] };
const dzi = { kana: 'ぢ', romaji: 'ji', altRomanji: ['di'] };
const dzu = { kana: 'づ', romaji: 'zu', altRomanji: ['du'] };

describe('isKanaGameAnswerCorrect', () => {
  it('accepts the primary romaji (case- and whitespace-insensitive)', () => {
    expect(isKanaGameAnswerCorrect(shi, 'shi', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, 'SHI', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, ' shi ', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, 's h i', false)).toBe(true);
  });

  it('accepts alternative romanizations in normal mode', () => {
    // Regression: Blitz/Gauntlet previously only accepted the primary romaji,
    // so "si" for し was wrongly marked incorrect while the main Type mode
    // accepted it.
    expect(isKanaGameAnswerCorrect(shi, 'si', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, 'SI', false)).toBe(true);
  });

  it('accepts di/du romanizations for ぢ and づ', () => {
    // Regression #29312: 'di' is the standard keystroke for ぢ and 'du' for づ.
    expect(isKanaGameAnswerCorrect(dzi, 'di', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(dzi, 'ji', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(dzu, 'du', false)).toBe(true);
    expect(isKanaGameAnswerCorrect(dzu, 'zu', false)).toBe(true);
  });

  it('rejects an incorrect romaji', () => {
    expect(isKanaGameAnswerCorrect(shi, 'su', false)).toBe(false);
    expect(isKanaGameAnswerCorrect(a, 'si', false)).toBe(false);
  });

  it('matches the kana character itself in reverse mode', () => {
    expect(isKanaGameAnswerCorrect(shi, 'し', true)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, ' し ', true)).toBe(true);
    expect(isKanaGameAnswerCorrect(shi, 'shi', true)).toBe(false);
  });

  it('accepts the same reading entered in the opposite script in reverse mode', () => {
    // Regression #28638: with both hiragana and katakana groups selected, a
    // katakana tile is the same reading as a hiragana answer and vice versa.
    const yo = { kana: 'よ', romaji: 'yo', altRomanji: [] };
    expect(isKanaGameAnswerCorrect(yo, 'ヨ', true)).toBe(true);
    expect(
      isKanaGameAnswerCorrect(
        { kana: 'ヨ', romaji: 'yo', altRomanji: [] },
        'よ',
        true,
      ),
    ).toBe(true);
    expect(
      isKanaGameAnswerCorrect(
        { kana: 'りゅ', romaji: 'ryu', altRomanji: [] },
        'リュ',
        true,
      ),
    ).toBe(true);
  });

  it('still rejects the opposite script for a different reading', () => {
    expect(isKanaGameAnswerCorrect(shi, 'サ', true)).toBe(false);
  });
});
