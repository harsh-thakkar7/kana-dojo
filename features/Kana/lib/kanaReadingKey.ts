import { isKana, toHiragana } from 'wanakana';

const stripSpaces = (value: string): string =>
  value.replace(/\s+/g, '').normalize('NFC');

export const kanaReadingKey = (value: string): string =>
  toHiragana(stripSpaces(value));

export const areKanaReadingsEqual = (a: string, b: string): boolean => {
  const normalizedA = stripSpaces(a);
  const normalizedB = stripSpaces(b);
  if (!isKana(normalizedA) || !isKana(normalizedB)) {
    return normalizedA === normalizedB;
  }
  return toHiragana(normalizedA) === toHiragana(normalizedB);
};
