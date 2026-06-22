import { describe, expect, it } from 'vitest';
import {
  isDirectionQueueAvailable,
  isValidDirectionChange,
  resolveDirectionChange,
  resolveKeyboardDirection,
  getNextHead,
  isFoodEaten,
  hitsWall,
  hitsSelf,
  hasCollision,
  shouldRemoveTail
} from '../../lib/snake-logic.mjs';

describe('snake-logic direction helpers', () => {
  it('only queues when direction matches nextDirection', () => {
    expect(isDirectionQueueAvailable('up', 'up')).toBe(true);
    expect(isDirectionQueueAvailable('up', 'right')).toBe(false);
  });

  it('blocks opposite direction changes', () => {
    expect(isValidDirectionChange('up', 'down')).toBe(false);
    expect(isValidDirectionChange('left', 'right')).toBe(false);
    expect(isValidDirectionChange('up', 'left')).toBe(true);
  });

  it('resolves direction changes safely', () => {
    expect(resolveDirectionChange('right', 'right', 'up')).toBe('up');
    expect(resolveDirectionChange('right', 'right', 'left')).toBe('right');
    expect(resolveDirectionChange('right', 'up', 'left')).toBe('up');
  });

  it('maps keyboard arrows to directions', () => {
    expect(resolveKeyboardDirection('ArrowUp', 'right', 'right')).toBe('up');
    expect(resolveKeyboardDirection('Space', 'right', 'right')).toBe('right');
    expect(resolveKeyboardDirection('ArrowDown', 'up', 'up')).toBe('up');
  });
});

describe('snake-logic movement helpers', () => {
  it('calculates next head positions', () => {
    expect(getNextHead({ x: 10, y: 10 }, 'right', 10)).toEqual({ x: 20, y: 10 });
    expect(getNextHead({ x: 10, y: 10 }, 'up', 10)).toEqual({ x: 10, y: 0 });
    expect(getNextHead({ x: 10, y: 10 }, 'down', 10)).toEqual({ x: 10, y: 20 });
    expect(getNextHead({ x: 10, y: 10 }, 'left', 10)).toEqual({ x: 0, y: 10 });
    expect(getNextHead({ x: 10, y: 10 }, 'invalid', 10)).toEqual({ x: 10, y: 10 });
  });

  it('detects food collisions', () => {
    expect(isFoodEaten({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(true);
    expect(isFoodEaten({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(false);
  });

  it('detects wall and self collisions', () => {
    const head = { x: -1, y: 0 };
    expect(hitsWall(head, 100, 100)).toBe(true);
    expect(hitsSelf({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 0, y: 0 }])).toBe(true);
    expect(hasCollision({ x: 5, y: 5 }, [{ x: 5, y: 5 }, { x: 5, y: 5 }], 100, 100)).toBe(true);
    expect(hasCollision({ x: 5, y: 5 }, [{ x: 5, y: 5 }, { x: 20, y: 5 }], 100, 100)).toBe(false);
  });

  it('decides when to remove the tail', () => {
    expect(shouldRemoveTail(false)).toBe(true);
    expect(shouldRemoveTail(true)).toBe(false);
  });
});
