import { test, expect } from './test';
import { mockAudio, gotoHome, startTypingGame } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Typing Speed Test', () => {
  test('starts and enables the typing input', async ({ page }) => {
    await startTypingGame(page);
    await expect(page.locator('#timer-display')).toHaveText('60');
    await expect(page.locator('#text-display')).not.toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Typing input' })).toBeVisible();
  });

  test('tracks typed characters and updates stats', async ({ page }) => {
    await startTypingGame(page);
    const prompt = await page.locator('#text-display').innerText();
    const firstWord = prompt.split(' ')[0] || 'The';
    await page.locator('#typing-input').type(firstWord);
    await expect(page.locator('#typing-wpm')).not.toHaveText('0');
  });

  test('reset returns to welcome screen', async ({ page }) => {
    await startTypingGame(page);
    await page.getByRole('button', { name: 'Reset Typing Speed Test' }).click();
    await expect(page.locator('#typing-game').getByText('Click "Start Test" to begin')).toBeVisible();
  });

  test('timer stops when switching away', async ({ page }) => {
    await startTypingGame(page);
    await expect.poll(async () => {
      const running = await page.evaluate(
        () => window.typingGameActive === true && window.typingTimerInterval !== null,
      );
      return running ? 1 : 0;
    }, { timeout: 5000 }).toBe(1);
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    const typingState = await page.evaluate(() => ({
      active: window.typingGameActive,
      interval: window.typingTimerInterval
    }));
    expect(typingState.active).toBe(false);
    expect(typingState.interval).toBeNull();
  });

  test('switching away resets typing welcome screen', async ({ page }) => {
    await startTypingGame(page);
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Play Typing Speed Test' }).click();
    await expect(page.locator('#typing-game').getByText('Click "Start Test" to begin')).toBeVisible();
    await expect(page.locator('#typing-input')).toHaveCount(0);
  });
});
