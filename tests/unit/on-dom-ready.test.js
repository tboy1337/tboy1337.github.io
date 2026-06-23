// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { onDomReady } from '../../lib/on-dom-ready.mjs';

describe('onDomReady', () => {
  it('runs the callback immediately when the document is already ready', () => {
    const callback = vi.fn();
    onDomReady(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('waits for DOMContentLoaded when the document is still loading', () => {
    const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading'
    });

    const callback = vi.fn();
    onDomReady(callback);
    expect(callback).not.toHaveBeenCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(callback).toHaveBeenCalledTimes(1);

    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });
});
