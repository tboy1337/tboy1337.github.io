import { test, expect } from './test';
import { mockAudio, gotoHome, startMusicStudio } from './support';

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

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Automation Suite');
    });
    await page.getByRole('button', { name: '💾 Save' }).click();

    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await startMusicStudio(page);

    let dialogStep = 0;
    page.on('dialog', async (dialog) => {
      dialogStep += 1;
      if (dialog.type() === 'prompt') {
        await dialog.accept('1');
        return;
      }
      expect(dialog.message()).toContain('Automation Suite');
      await dialog.accept();
    });
    await page.getByRole('button', { name: '📁 Load' }).click();

    await expect(page.getByText(/Loaded "Automation Suite"/)).toBeVisible();
    await expect(page.getByRole('button', { name: '▶️ Play' })).toBeEnabled();
    expect(dialogStep).toBeGreaterThanOrEqual(1);
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

  test('reset clears studio state', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.press('h');
    await page.getByRole('button', { name: 'Reset Advanced Music Studio' }).click();
    await expect(page.getByText('Click "Start Studio" to begin composing!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeEnabled();
  });
});
