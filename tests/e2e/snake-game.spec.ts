import { test, expect } from './test';
import { mockAudio, gotoHome, startSnakeGame } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Snake Game', () => {
  test('starts and renders the canvas', async ({ page }) => {
    await startSnakeGame(page);
    await expect(page.locator('#snake-score')).toHaveText('0');
    await expect(page.locator('.touch-controls')).toBeVisible();
  });

  test('responds to arrow key input', async ({ page }) => {
    await startSnakeGame(page);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#snake-game canvas')).toBeVisible();
  });

  test('touch controls move the snake', async ({ page }) => {
    await startSnakeGame(page);
    await expect(page.getByRole('button', { name: 'Move snake up' })).toBeVisible();
    await page.getByRole('button', { name: 'Move snake up' }).click();
    await page.getByRole('button', { name: 'Move snake right' }).click();
    await expect(page.locator('#snake-game canvas')).toBeVisible();
  });

  test('reset returns to welcome screen', async ({ page }) => {
    await startSnakeGame(page);
    await page.getByRole('button', { name: 'Reset Snake Game' }).click();
    await expect(page.locator('#snake-game').getByText('Click "Start Game" to begin')).toBeVisible();
  });

  test('stops game loop when switching games', async ({ page }) => {
    await startSnakeGame(page);
    await page.getByRole('button', { name: 'Play Typing Speed Test' }).click();
    await expect(page.getByRole('button', { name: 'Start Typing Speed Test' })).toBeVisible();
    const snakeState = await page.evaluate(() => ({
      active: window.snakeGameActive,
      interval: window.snakeGameInterval
    }));
    expect(snakeState.active).toBe(false);
    expect(snakeState.interval).toBeNull();
  });

  test('switching away resets snake welcome screen', async ({ page }) => {
    await startSnakeGame(page);
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Play Snake Game' }).click();
    await expect(page.locator('#snake-game').getByText('Click "Start Game" to begin')).toBeVisible();
    await expect(page.locator('#snake-game canvas')).toHaveCount(0);
  });
});
