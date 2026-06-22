import { describe, expect, it } from 'vitest';
import {
  isMemoryMatch,
  updateMemoryScore,
  isMemoryGameComplete
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
});
