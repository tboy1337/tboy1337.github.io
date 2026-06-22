import { test, expect } from './test';
import { mockAudio, gotoHome } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Game menu', () => {
  test('switches between all four games', async ({ page }) => {
    await page.getByRole('button', { name: 'Play Snake Game' }).click();
    await expect(page.getByRole('button', { name: 'Start Snake Game' })).toBeVisible();

    await page.getByRole('button', { name: 'Play Typing Speed Test' }).click();
    await expect(page.getByRole('button', { name: 'Start Typing Speed Test' })).toBeVisible();

    await page.getByRole('button', { name: 'Play Advanced Music Studio' }).click();
    await expect(page.getByRole('button', { name: 'Start Advanced Music Studio' })).toBeVisible();

    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await expect(page.getByRole('button', { name: 'Start Memory Card Game' })).toBeVisible();
  });

  test('game menu buttons reference their game sections', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Play Memory Card Game' })).toHaveAttribute('aria-controls', 'memory-section');
    await expect(page.getByRole('button', { name: 'Play Snake Game' })).toHaveAttribute('aria-controls', 'snake-section');
    await expect(page.getByRole('button', { name: 'Play Typing Speed Test' })).toHaveAttribute('aria-controls', 'typing-section');
    await expect(page.getByRole('button', { name: 'Play Advanced Music Studio' })).toHaveAttribute('aria-controls', 'music-studio-section');
  });
});
