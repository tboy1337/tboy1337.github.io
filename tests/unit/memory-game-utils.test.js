import { describe, expect, it } from 'vitest';
import {
  isMemoryMatch,
  updateMemoryScore,
  isMemoryGameComplete,
  findMismatchedCardIndexes
} from '../../lib/memory-game-utils.mjs';

describe('memory-game-utils', () => {
  it('detects matching icons', () => {
    expect(isMemoryMatch('star', 'star')).toBe(true);
    expect(isMemoryMatch('star', 'moon')).toBe(false);
  });

  it('updates score only on matches', () => {
    expect(updateMemoryScore(0, true)).toBe(10);
    expect(updateMemoryScore(20, false)).toBe(20);
  });

  it('detects completed boards', () => {
    expect(isMemoryGameComplete(16, 16)).toBe(true);
    expect(isMemoryGameComplete(10, 16)).toBe(false);
  });

  it('finds two cards that do not match', () => {
    const icons = ['star', 'star', 'moon', 'moon'];
    const [first, second] = findMismatchedCardIndexes(icons);
    expect(icons[first]).not.toBe(icons[second]);
    expect(first).toBe(0);
    expect(second).toBe(2);
  });

  it('falls back to the first two cards when every icon matches', () => {
    expect(findMismatchedCardIndexes(['star', 'star', 'star'])).toEqual([0, 1]);
  });

  it('treats missing icons as empty strings when comparing', () => {
    expect(findMismatchedCardIndexes([undefined, 'moon'])).toEqual([0, 1]);
    expect(findMismatchedCardIndexes(['star', null])).toEqual([0, 1]);
  });
});
