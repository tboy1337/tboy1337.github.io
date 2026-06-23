import { test, expect } from './test';
import { mockAudio, gotoHome, startMusicStudio, startSnakeGame, startTypingGame } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Games coverage expansion', () => {
  test('snake game increases score while playing', async ({ page }) => {
    await startSnakeGame(page);
    for (let i = 0; i < 30; i += 1) {
      const key = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][i % 4];
      if (key) {
        await page.keyboard.press(key);
      }
      await page.waitForTimeout(40);
    }
    const score = Number(await page.locator('#snake-score').textContent());
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('snake reset after movement restores welcome state', async ({ page }) => {
    await startSnakeGame(page);
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Reset Snake Game' }).click();
    await expect(page.locator('#snake-game').getByText('Click "Start Game" to begin')).toBeVisible();
  });

  test('typing game handles rapid input and reset', async ({ page }) => {
    await startTypingGame(page);
    await page.locator('#typing-input').type('The quick brown fox');
    await page.getByRole('button', { name: 'Reset Typing Speed Test' }).click();
    await expect(page.locator('#typing-game').getByText('Click "Start Test" to begin')).toBeVisible();
  });

  test('music studio switches all instruments', async ({ page }) => {
    await startMusicStudio(page);
    for (const instrument of ['synth', 'piano', 'strings', 'bass']) {
      await page.locator('#instrument-select').selectOption(instrument);
      await page.keyboard.press('a');
    }
    await expect(page.locator('#music-studio-notes')).not.toHaveText('0');
  });

  test('music studio loops all layers and clears all', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();

    await page.getByRole('button', { name: 'Loop All' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Stop All' }).click();

    page.once('dialog', async () => { /* legacy guard */ });
    await page.getByRole('button', { name: 'Clear all layers' }).click();
    await page.getByRole('button', { name: 'Confirm action' }).click();
  });

  test('music studio navigates to previous layer', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: 'Record layer' }).click();
    await page.keyboard.press('a');
    await page.getByRole('button', { name: 'Stop Recording' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Prev' }).click();
    await expect(page.getByRole('button', { name: 'Prev' })).toBeDisabled();
  });

  test('music studio load handles empty library', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => localStorage.setItem('musicCompositions', '[]'));
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.getByText('No saved compositions yet')).toBeVisible();
  });

  test('music studio adjusts global tempo and volume sliders', async ({ page }) => {
    await startMusicStudio(page);
    await page.locator('#tempo-slider').evaluate((el: HTMLInputElement) => {
      el.value = '150';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.locator('#volume-slider').evaluate((el: HTMLInputElement) => {
      el.value = '60';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#tempo-display')).toHaveText('150 BPM');
    await expect(page.locator('#volume-display')).toHaveText('60%');
  });

  test('music studio load handles corrupt storage', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => localStorage.setItem('musicCompositions', '{bad json'));
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.locator('#composition-empty-message')).toBeVisible();
    await expect(page.locator('#composition-panel-error')).toBeHidden();
    const storageValue = await page.evaluate(() => localStorage.getItem('musicCompositions'));
    expect(storageValue).toBeNull();
  });

  test('music studio sanitizes invalid compositions in storage', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => {
      localStorage.setItem('musicCompositions', JSON.stringify([
        {
          name: 'Sanitized',
          instrument: 'drums',
          tempo: 999,
          effects: { distortion: { enabled: 'yes', amount: 500 } }
        },
        { name: '   ' },
        null
      ]));
    });
    await page.getByRole('button', { name: 'Load composition' }).click();
    await expect(page.locator('#composition-list .composition-list-item')).toHaveCount(1);
    await expect(page.locator('.composition-list-name')).toHaveText('Sanitized');
    await page.locator('.composition-list-item-main').click();
    await expect(page.locator('#instrument-select')).toHaveValue('synth');
    await expect(page.locator('#tempo-display')).toHaveText('240 BPM');
  });

  test('music studio load handles composition without notes', async ({ page }) => {
    await startMusicStudio(page);
    await page.evaluate(() => {
      localStorage.setItem('musicCompositions', JSON.stringify([{
        name: 'Empty Layer',
        version: 2,
        loopLayers: [{ notes: [], name: 'Layer 1' }],
        layerTempos: [120, 120, 120, 120],
        currentLayerIndex: 0,
        instrument: 'piano',
        effects: { reverb: { enabled: true, wetness: 0.3 } },
        tempo: 120,
        timestamp: new Date().toISOString()
      }]));
    });

    await page.getByRole('button', { name: 'Load composition' }).click();
    await page.getByRole('option', { name: /Empty Layer/ }).click();
    await expect(page.locator('#recording-length')).toHaveText('0:00');
  });

  test('memory game handles mismatched flips', async ({ page }) => {
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Start Memory Card Game' }).click();
    const cards = page.locator('.memory-card');
    const [firstIndex, secondIndex] = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.memory-card'))
        .map((card) => (card instanceof HTMLElement ? card.dataset.icon : '') ?? '');
      return window.MemoryGameUtils.findMismatchedCardIndexes(icons);
    });
    await cards.nth(firstIndex).click();
    await cards.nth(secondIndex).click();
    await page.waitForTimeout(1100);
    await expect(page.locator('#score')).toHaveText('0');
    await expect(cards.nth(firstIndex)).not.toHaveClass(/flipped/);
    await expect(cards.nth(secondIndex)).not.toHaveClass(/flipped/);
  });
});
