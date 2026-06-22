import { describe, expect, it } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  calculateFinalStats
} from '../../lib/typing-stats.mjs';

describe('typing-stats', () => {
  it('calculates live WPM from elapsed time', () => {
    expect(calculateWpm(0, 25, 60000)).toBe(5);
    expect(calculateWpm(25, 0, 60000)).toBe(5);
  });

  it('returns zero WPM for non-positive elapsed time', () => {
    expect(calculateWpm(10, 10, 0)).toBe(0);
  });

  it('calculates live accuracy', () => {
    expect(calculateAccuracy(0, 10, 0, 8)).toBe(80);
    expect(calculateAccuracy(0, 0, 0, 0)).toBe(0);
  });

  it('calculates final stats', () => {
    expect(calculateFinalStats(50, 60, 60000)).toEqual({ wpm: 10, accuracy: 83 });
    expect(calculateFinalStats(0, 0, 60000)).toEqual({ wpm: 0, accuracy: 0 });
  });
});
