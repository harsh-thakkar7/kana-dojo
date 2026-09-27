import { describe, expect, it } from 'vitest';
import {
  areKanaReadingsEqual,
  kanaReadingKey,
} from '@/features/Kana/lib/kanaReadingKey';

describe('kanaReadingKey', () => {
  it('maps katakana and hiragana to the same reading key', () => {
    expect(kanaReadingKey('ヨ')).toBe(kanaReadingKey('よ'));
    expect(kanaReadingKey('るリュリ')).toBe(kanaReadingKey('るりゅり'));
    expect(kanaReadingKey('シツ')).toBe(kanaReadingKey('しつ'));
  });

  it('strips whitespace before producing the key', () => {
    expect(kanaReadingKey(' ル ')).toBe(kanaReadingKey('る'));
  });
});

describe('areKanaReadingsEqual', () => {
  it('accepts the same reading across scripts', () => {
    expect(areKanaReadingsEqual('るリュリ', 'るりゅり')).toBe(true);
    expect(areKanaReadingsEqual('ヨ', 'よ')).toBe(true);
    expect(areKanaReadingsEqual('しつ', 'シツ')).toBe(true);
  });

  it('strips whitespace before comparing', () => {
    expect(areKanaReadingsEqual(' し ', 'し')).toBe(true);
    expect(areKanaReadingsEqual('シ ツ', 'シツ')).toBe(true);
  });

  it('normalises canonically equivalent kana', () => {
    expect(areKanaReadingsEqual('か\u3099', 'が')).toBe(true);
  });

  it('never transliterates non-kana input into a kana match', () => {
    expect(areKanaReadingsEqual('shi', 'し')).toBe(false);
    expect(areKanaReadingsEqual('yo', 'よ')).toBe(false);
  });

  it('keeps exact comparison for non-kana strings', () => {
    expect(areKanaReadingsEqual('shi', 'shi')).toBe(true);
    expect(areKanaReadingsEqual('shi', 'su')).toBe(false);
  });

  it('rejects different readings', () => {
    expect(areKanaReadingsEqual('か', 'き')).toBe(false);
  });
});
