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
    await expect(page.getByRole('checkbox', { name: '🌊 Reverb' })).toBeChecked();
    await expect(page.getByRole('button', { name: '📁 Load' })).toBeEnabled();
  });

  test('plays notes from keyboard input', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.keyboard.press('d');
    await expect(page.locator('#arrow-notes')).not.toHaveText('0');
  });

  test('plays notes from arrow keys', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#arrow-notes')).toHaveText('2');
  });

  test('plays black keys and octave 3 number row', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('w');
    await page.keyboard.press('1');
    await expect(page.locator('#arrow-notes')).toHaveText('2');
  });

  test('plays notes from piano key clicks', async ({ page }) => {
    await startMusicStudio(page);
    await page.locator('.piano-key.white-key[data-note="C4"]').click();
    await page.locator('.piano-key.white-key[data-note="D4"]').click();
    await expect(page.locator('#arrow-notes')).toHaveText('2');
  });

  test('records a layer and enables playback controls', async ({ page }) => {
    await startMusicStudio(page);
    page.once('dialog', async (dialog) => { await dialog.dismiss(); });

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await expect(page.getByRole('button', { name: '▶️ Play' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '🔄 Loop Current' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '💾 Save' })).toBeEnabled();
  });

  test('loops the current layer', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();
    await page.getByRole('button', { name: '🔄 Loop Current' }).click();
    await expect(page.getByRole('button', { name: '⏹️ Stop Current' })).toBeVisible();
    await page.getByRole('button', { name: '⏹️ Stop Current' }).click();
    await expect(page.getByRole('button', { name: '🔄 Loop Current' })).toBeVisible();
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

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await saveComposition(page, 'Automation Suite');
    await expect(page.locator('#recording-status')).toContainText('saved successfully');

    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await startMusicStudio(page);

    await loadComposition(page, /Automation Suite/);
    await expect(page.locator('#recording-status')).toContainText('Loaded "Automation Suite"');
    await expect(page.getByRole('button', { name: '▶️ Play' })).toBeEnabled();
  });

  test('save rejects empty composition name', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.getByRole('button', { name: '💾 Save' }).click();
    await page.getByRole('button', { name: 'Save composition' }).click();
    await expect(page.locator('#composition-panel-error')).toContainText('Please enter a composition name');
  });

  test('load shows message for empty library', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => localStorage.setItem('musicCompositions', '[]'));
    await page.getByRole('button', { name: '📁 Load' }).click();
    await expect(page.getByText('No saved compositions yet')).toBeVisible();
  });

  test('cleans up audio and loops when switching games', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('g');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();
    await page.getByRole('button', { name: '🔄 Loop Current' }).click();

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    const audioState = await page.evaluate(() => ({
      hasCleanup: typeof window.cleanupMusicStudio === 'function',
      contextClosed: !window.arrowGameAudioContext || window.arrowGameAudioContext.state === 'closed'
    }));
    expect(audioState.hasCleanup).toBe(true);
    expect(audioState.contextClosed).toBe(true);
  });

  test('restores welcome screen when switching back to music studio', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('a');

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Play Advanced Music Studio' }).click();

    await expect(page.getByText('Click "Start Studio" to begin composing!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeEnabled();
    await expect(page.locator('#arrow-notes')).toHaveText('0');
  });

  test('switches layer via layer indicator click', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.getByRole('button', { name: 'Next ▶' }).click();
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.locator('.layer-indicator').first().click();
    await expect(page.locator('#current-layer')).toHaveText('1');
    await expect(page.getByRole('button', { name: '▶️ Play' })).toBeEnabled();
  });

  test('switches layer via layer indicator keyboard', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.getByRole('button', { name: 'Next ▶' }).click();
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.locator('.layer-indicator').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#current-layer')).toHaveText('1');
  });

  test('blocks navigation beyond max four layers', async ({ page }) => {
    await startMusicStudio(page);

    for (let layer = 0; layer < 3; layer += 1) {
      await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
      await page.keyboard.press('a');
      await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();
      await page.getByRole('button', { name: 'Next ▶' }).click();
    }

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await expect(page.locator('#current-layer')).toHaveText('4');
    await expect(page.getByRole('button', { name: 'Next ▶' })).toBeDisabled();
  });

  test('reset clears studio state', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('h');
    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await expect(page.getByText('Click "Start Studio" to begin composing!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeEnabled();
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
    const noteCount = Number(await page.locator('#arrow-notes').textContent());
    expect(noteCount).toBeGreaterThanOrEqual(2);
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
    await expect(page.getByRole('button', { name: '⏺️ Record Layer' })).toBeDisabled();
  });
});
