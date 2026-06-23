import { expect, type Page } from '@playwright/test';

export async function mockAudio(page: Page) {
  await page.addInitScript(() => {
    class MockOscillator {
      type = 'sine';
      frequency = { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
      connect() { return this; }
      disconnect() {}
      start() {}
      stop() {}
    }

    class MockGain {
      connect() { return this; }
      disconnect() {}
      gain = {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
        linearRampToValueAtTime() {},
        cancelScheduledValues() {}
      };
    }

    class MockAnalyser {
      fftSize = 4096;
      frequencyBinCount = 2048;
      connect() { return this; }
      disconnect() {}
      getByteFrequencyData(buffer: Uint8Array) {
        const effects = window.getMusicStudioEffects?.();
        let intensity = 0;
        if (effects) {
          if (effects.distortion?.enabled) {
            intensity += effects.distortion.amount * effects.distortion.wetness;
          }
          if (effects.delay?.enabled) {
            intensity += effects.delay.wetness * 120;
          }
          if (effects.reverb?.enabled) {
            intensity += effects.reverb.wetness * 80;
          }
          if (effects.chorus?.enabled) {
            intensity += effects.chorus.wetness * 60;
          }
          if (effects.filter?.enabled) {
            intensity += Math.min(effects.filter.frequency / 40, 120);
          }
        }
        const peak = Math.min(255, Math.round(intensity));
        for (let i = 0; i < buffer.length; i += 1) {
          buffer[i] = i < 128 ? peak : Math.round(peak * 0.25);
        }
      }
    }

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      sampleRate = 44100;
      destination = { connect() { return this; }, disconnect() {} };
      createOscillator() { return new MockOscillator(); }
      createGain() { return new MockGain(); }
      createAnalyser() { return new MockAnalyser(); }
      createBiquadFilter() {
        return {
          connect() { return this; },
          disconnect() {},
          frequency: { value: 1000, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          Q: { value: 1 },
          type: 'lowpass'
        };
      }
      createWaveShaper() {
        return { connect() { return this; }, disconnect() {}, curve: null, oversample: '4x' };
      }
      createDelay() {
        return { connect() { return this; }, disconnect() {}, delayTime: { value: 0 } };
      }
      resume() { return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
    }

    // @ts-expect-error Mock AudioContext for headless browser tests
    window.AudioContext = MockAudioContext;
    // @ts-expect-error Legacy webkit prefix for mock audio
    window.webkitAudioContext = MockAudioContext;
  });
}

export async function gotoHome(page: Page, options?: { loadGames?: boolean }) {
  await page.goto('/');
  if (options?.loadGames === false) {
    return;
  }
  await page.waitForFunction(() => typeof window.loadGamesBundle === 'function');
  await page.evaluate(async () => {
    const load = window.loadGamesBundle;
    if (!load) throw new Error('loadGamesBundle not available');
    await load();
  });
  await expect.poll(async () => {
    const ready = await page.evaluate(
      () => typeof window.switchPortfolioGame === 'function'
        && typeof window.GameUtils !== 'undefined',
    );
    return ready ? 1 : 0;
  }, { timeout: 30000 }).toBe(1);
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
  await expect(page.getByRole('button', { name: 'Record layer' })).toBeVisible();
}

export async function saveComposition(page: Page, name: string) {
  await page.getByRole('button', { name: 'Save composition' }).click();
  await page.getByLabel('Composition name').fill(name);
  await page.getByRole('button', { name: 'Confirm save' }).click();
}

export async function loadComposition(page: Page, namePattern: RegExp | string) {
  await page.getByRole('button', { name: 'Load composition' }).click();
  const pattern = typeof namePattern === 'string' ? new RegExp(namePattern) : namePattern;
  await page.getByRole('option', { name: pattern }).click();
}
