import { expect, type Page } from '@playwright/test';

export async function mockAudio(page: Page) {
  await page.addInitScript(() => {
    class MockOscillator {
      connect() { return this; }
      start() {}
      stop() {}
      frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    }

    class MockGain {
      connect() { return this; }
      gain = {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {}
      };
    }

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() { return new MockOscillator(); }
      createGain() { return new MockGain(); }
      createBiquadFilter() {
        return {
          connect() { return this; },
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          Q: { value: 1 },
          type: 'lowpass'
        };
      }
      createWaveShaper() { return { connect() { return this; }, curve: null, oversample: '4x' }; }
      createDelay() { return { connect() { return this; }, delayTime: { value: 0 } }; }
      resume() { return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
    }

    // @ts-expect-error Mock AudioContext for headless browser tests
    window.AudioContext = MockAudioContext;
    // @ts-expect-error Legacy webkit prefix for mock audio
    window.webkitAudioContext = MockAudioContext;
  });
}

export async function gotoHome(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.GameUtils !== 'undefined');
}

export async function startMemoryGame(page: Page) {
  await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
  await page.getByRole('button', { name: 'Start Memory Card Game' }).click();
  await expect(page.locator('.memory-card')).toHaveCount(16);
}

export async function startSnakeGame(page: Page) {
  await page.getByRole('button', { name: 'Play Snake Game' }).click();
  await page.getByRole('button', { name: 'Start Snake Game' }).click();
  await expect(page.locator('#snake-game canvas')).toBeVisible();
}

export async function startTypingGame(page: Page) {
  await page.getByRole('button', { name: 'Play Typing Speed Test' }).click();
  await page.getByRole('button', { name: 'Start Typing Speed Test' }).click();
  await expect(page.locator('#typing-input')).toBeEnabled();
}

export async function startMusicStudio(page: Page) {
  await page.getByRole('button', { name: 'Play Advanced Music Studio' }).click();
  await page.getByRole('button', { name: 'Start Advanced Music Studio' }).click();
  await expect(page.getByRole('button', { name: '⏺️ Record Layer' })).toBeVisible();
}
