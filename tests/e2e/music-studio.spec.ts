import { test, expect } from './test';
import { mockAudio, gotoHome, startMusicStudio, saveComposition, loadComposition } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Advanced Music Studio', () => {
  test('starts with full control panel', async ({ page }) => {
    await startMusicStudio(page);
    await expect(page.locator('#instrument-select')).toBeVisible();
    await expect(page.locator('#instrument-select option[value="synth"]')).toHaveText('🎹 Synthesizer');
    await expect(page.getByRole('checkbox', { name: 'Reverb' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Load composition' })).toBeEnabled();
    await expect(page.getByText('Metronome:')).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Reverb amount' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Layer tempo' })).toBeVisible();
  });

  test('plays notes from keyboard input', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.keyboard.press('d');
    await expect(page.locator('#music-studio-notes')).not.toHaveText('0');
  });

  test('plays notes from arrow keys', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#music-studio-notes')).toHaveText('2');
  });

  test('plays black keys and octave 3 number row', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('w');
    await page.keyboard.press('1');
    await expect(page.locator('#music-studio-notes')).toHaveText('2');
  });

  test('plays notes from piano key clicks', async ({ page }) => {
    await startMusicStudio(page);
    await page.locator('.piano-key.white-key[data-note="C4"]').click();
    await page.locator('.piano-key.white-key[data-note="D4"]').click();
    await expect(page.locator('#music-studio-notes')).toHaveText('2');
  });

  test('plays notes when piano keys are activated with Enter', async ({ page }) => {
    await startMusicStudio(page);

    const c4Key = page.locator('.piano-key.white-key[data-note="C4"]');
    await c4Key.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#music-studio-notes')).toHaveText('1');
  });

  test('records a layer and enables playback controls', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await expect(page.locator('#play-btn')).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Loop Current' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save composition' })).toBeEnabled();
  });

  test('does not inflate the note counter during layer playback', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.keyboard.press('d');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await expect(page.locator('#music-studio-notes')).toHaveText('3');

    await page.locator('#play-btn').click();
    await expect.poll(async () => {
      const label = await page.locator('#play-btn').textContent();
      return label?.includes('Stop') ? 1 : 0;
    }, { timeout: 5000 }).toBe(1);
    await expect.poll(async () => {
      return page.locator('#music-studio-notes').textContent();
    }, { timeout: 5000 }).toBe('3');
  });

  test('does not inflate the note counter during layer loop', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await expect(page.locator('#music-studio-notes')).toHaveText('2');

    await page.getByRole('button', { name: 'Loop Current' }).click();
    await expect(page.getByRole('button', { name: 'Stop Current' })).toBeVisible();
    await expect.poll(async () => {
      return page.locator('#music-studio-notes').textContent();
    }, { timeout: 5000 }).toBe('2');
    await page.getByRole('button', { name: 'Stop Current' }).click();
  });

  test('shows message when stopping empty recording', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await expect(page.locator('#recording-status')).toContainText('No notes recorded');
    await expect(page.locator('#play-btn')).toBeDisabled();
  });

  test('loops the current layer', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Loop Current' }).click();
    await expect(page.getByRole('button', { name: 'Stop Current' })).toBeVisible();
    await page.getByRole('button', { name: 'Stop Current' }).click();
    await expect(page.getByRole('button', { name: 'Loop Current' })).toBeVisible();
  });

  test('loop all starts remaining layers without stopping a single-layer loop', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Loop Current' }).click();
    await expect(page.getByRole('button', { name: 'Stop Current' })).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.getByRole('button', { name: 'Loop All' }).click();
    await expect(page.getByRole('button', { name: 'Stop All' })).toBeVisible();

    await expect.poll(async () => {
      return page.evaluate(() => document.querySelectorAll('.layer-status.playing').length);
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(2);

    await page.locator('.layer-indicator').first().click();
    await expect(page.getByRole('button', { name: 'Stop Current' })).toBeVisible();
  });

  test('loading a composition stops active loops', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await saveComposition(page, 'Loop Stop Test');

    await page.getByRole('button', { name: 'Loop Current' }).click();
    await expect(page.getByRole('button', { name: 'Stop Current' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await startMusicStudio(page);
    await loadComposition(page, /Loop Stop Test/);

    await expect(page.getByRole('button', { name: 'Loop Current' })).toBeVisible();
    const loopState = await page.evaluate(() => ({
      intervalCount: window.layerIntervals ? window.layerIntervals.size : 0,
      timeoutMapEmpty: !window.layerLoopTimeouts || window.layerLoopTimeouts.size === 0
    }));
    expect(loopState.intervalCount).toBe(0);
    expect(loopState.timeoutMapEmpty).toBe(true);
  });

  test('stops loop and clears active layer state', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Loop Current' }).click();
    await page.getByRole('button', { name: 'Stop Current' }).click();

    const loopState = await page.evaluate(() => ({
      timeoutMapEmpty: !window.layerLoopTimeouts || window.layerLoopTimeouts.size === 0
    }));
    expect(loopState.timeoutMapEmpty).toBe(true);
  });

  test('does not accumulate loop timeouts during active looping', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Loop Current' }).click();

    const countTimeouts = () => page.evaluate(() => {
      if (!window.layerLoopTimeouts) {
        return 0;
      }
      let total = 0;
      window.layerLoopTimeouts.forEach((timeouts) => {
        total += timeouts.length;
      });
      return total;
    });

    const firstCount = await countTimeouts();
    await expect.poll(async () => {
      const secondCount = await countTimeouts();
      return secondCount <= 1 ? 1 : 0;
    }, { timeout: 5000 }).toBe(1);
    const secondCount = await countTimeouts();

    expect(firstCount).toBeLessThanOrEqual(1);
    expect(secondCount).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Stop Current' }).click();
  });

  test('does not play notes when typing in composition save dialog', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    const notesBefore = await page.locator('#music-studio-notes').textContent();
    await page.getByRole('button', { name: 'Save composition' }).click();
    await page.getByLabel('Composition name').focus();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.keyboard.press('d');
    await expect(page.locator('#music-studio-notes')).toHaveText(notesBefore ?? '');
  });

  test('renders stored composition names as plain text', async ({ page }) => {
    const maliciousName = '<img src=x onerror=window.__xssTriggered=true>';
    await page.evaluate((name) => {
      localStorage.setItem('musicCompositions', JSON.stringify([{
        name,
        timestamp: new Date().toISOString(),
        layers: [{ notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' }],
        layerTempos: [120],
        currentInstrument: 'synth',
        masterVolume: 0.3,
        currentTempo: 120
      }]));
    }, maliciousName);

    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.locator('.composition-list-name')).toHaveText(maliciousName);
    const xssTriggered = await page.evaluate(() => {
      return Object.prototype.hasOwnProperty.call(window, '__xssTriggered');
    });
    expect(xssTriggered).toBe(false);
  });

  test('adjusts layer tempo via slider', async ({ page }) => {
    await startMusicStudio(page);
    const slider = page.locator('#layer-tempo-slider');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '140';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#layer-tempo')).toHaveText('140');
  });

  test('saves and loads multi-layer compositions from localStorage', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await saveComposition(page, 'Automation Suite');
    await expect(page.locator('#recording-status')).toContainText('saved successfully');

    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await startMusicStudio(page);

    await loadComposition(page, /Automation Suite/);
    await expect(page.locator('#recording-status')).toContainText('Loaded "Automation Suite"');
    await expect(page.locator('#play-btn')).toBeEnabled();
  });

  test('save rejects empty composition name', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.getByRole('button', { name: 'Save composition' }).click();
    await page.getByRole('button', { name: 'Confirm save' }).click();
    await expect(page.locator('#composition-panel-error')).toContainText('Please enter a composition name');
  });

  test('save overwrites duplicate composition name', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await saveComposition(page, 'Duplicate Suite');
    await page.getByRole('button', { name: 'Save composition' }).click();
    await page.getByLabel('Composition name').fill('Duplicate Suite');
    await page.getByRole('button', { name: 'Confirm save' }).click();
    await expect(page.locator('#composition-panel-error')).toContainText('already exists');
    await page.getByRole('button', { name: 'Overwrite existing composition' }).click();
    await expect(page.locator('#recording-status')).toContainText('saved successfully');
  });

  test('deletes composition from library', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await saveComposition(page, 'Delete Me');

    await page.getByRole('button', { name: 'Load composition' }).click();
    await page.getByRole('button', { name: 'Delete Delete Me' }).click();
    await page.getByRole('button', { name: 'Confirm action' }).click();
    await expect(page.locator('#recording-status')).toContainText('Deleted "Delete Me"');
  });

  test('load shows message for empty library', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => localStorage.setItem('musicCompositions', '[]'));
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.getByText('No saved compositions yet')).toBeVisible();
  });

  test('closes composition panel with Escape key', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.locator('#composition-panel')).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#composition-panel')).toHaveClass(/hidden/);
    await expect(page.locator('#composition-panel-scrim')).toHaveClass(/hidden/);
  });

  test('closes the composition panel when switching away from music studio', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.locator('#composition-panel')).not.toHaveClass(/hidden/);

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await expect(page.locator('#composition-panel')).toHaveCount(0);
    await expect(page.locator('#composition-panel-scrim')).toHaveCount(0);

    await page.getByRole('button', { name: 'Play Advanced Music Studio' }).click();
    await expect(page.getByText('Click "Start Studio" to begin.')).toBeVisible();
  });

  test('cleans up audio and loops when switching games', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('g');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Loop Current' }).click();

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    const audioState = await page.evaluate(() => ({
      hasCleanup: typeof window.cleanupMusicStudio === 'function',
      contextClosed: !window.musicStudioAudioContext || window.musicStudioAudioContext.state === 'closed'
    }));
    expect(audioState.hasCleanup).toBe(true);
    expect(audioState.contextClosed).toBe(true);
  });

  test('restores welcome screen when switching back to music studio', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('a');

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Play Advanced Music Studio' }).click();

    await expect(page.getByText('Click "Start Studio" to begin.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeEnabled();
    await expect(page.locator('#music-studio-notes')).toHaveText('0');
  });

  test('switches layer via layer indicator click', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.locator('.layer-indicator').first().click();
    await expect(page.locator('#current-layer')).toHaveText('1');
    await expect(page.locator('#play-btn')).toBeEnabled();
  });

  test('switches layer via layer indicator keyboard', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.locator('.layer-indicator').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#current-layer')).toHaveText('1');
  });

  test('blocks navigation beyond max four layers', async ({ page }) => {
    await startMusicStudio(page);

    for (let layer = 0; layer < 3; layer += 1) {
      await page.getByRole('button', { name: 'Record layer' }).click();
      await page.keyboard.press('a');
      await page.getByRole('button', { name: 'Stop Recording' }).click();
      await page.getByRole('button', { name: 'Next' }).click();
    }

    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await expect(page.locator('#current-layer')).toHaveText('4');
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  test('reset clears studio state', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('h');
    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await expect(page.getByText('Click "Start Studio" to begin.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeEnabled();
  });

  test('clears current layer via confirm panel', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Clear current layer' }).click();
    await page.getByRole('button', { name: 'Confirm action' }).click();
    await expect(page.locator('#play-btn')).toBeDisabled();
  });
});

test.describe('Advanced Music Studio mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true
  });

  test('touch piano plays notes including C5', async ({ page }) => {
    await startMusicStudio(page);
    await expect(page.locator('.touch-piano-container')).toBeVisible();
    await page.locator('.touch-key.white-key[data-note="C4"]').tap();
    await page.locator('.touch-key.white-key[data-note="C5"]').tap();
    const noteCount = Number(await page.locator('#music-studio-notes').textContent());
    expect(noteCount).toBeGreaterThanOrEqual(2);
  });

  test('hides desktop piano on mobile', async ({ page }) => {
    await startMusicStudio(page);
    await expect(page.locator('.piano-container')).toBeHidden();
    await expect(page.locator('.keyboard-legend')).toBeHidden();
    await expect(page.locator('.touch-piano-container')).toBeVisible();
  });

  test('touch piano black keys show sharp labels not double hash', async ({ page }) => {
    await startMusicStudio(page);
    const blackKey = page.locator('.touch-key.black-key[data-note="C#4"]');
    await expect(blackKey).toHaveText('C#');
    await expect(blackKey).not.toHaveText('C##');
  });

  test('touch piano appears above the control panel on mobile', async ({ page }) => {
    await startMusicStudio(page);
    const touchBox = await page.locator('.touch-piano-container').boundingBox();
    const controlBox = await page.locator('.control-panel').boundingBox();
    expect(touchBox).not.toBeNull();
    expect(controlBox).not.toBeNull();
    if (touchBox && controlBox) {
      expect(touchBox.y).toBeLessThan(controlBox.y);
    }
  });
});

test.describe('Advanced Music Studio audio failure', () => {
  test('shows banner when audio context cannot be created', async ({ page }) => {
    await page.addInitScript(() => {
      class FailingAudioContext {
        constructor() {
          throw new Error('Audio not supported');
        }
      }
      // @ts-expect-error Mock failing AudioContext for test
      window.AudioContext = FailingAudioContext;
      // @ts-expect-error Legacy webkit prefix for mock audio
      window.webkitAudioContext = FailingAudioContext;
    });
    await gotoHome(page);
    await startMusicStudio(page);
    await expect(page.locator('#audio-unavailable-banner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record layer' })).toBeDisabled();
  });
});
