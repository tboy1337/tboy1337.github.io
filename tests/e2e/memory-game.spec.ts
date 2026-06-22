import { test, expect } from './test';
import { mockAudio, gotoHome, startMemoryGame } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Memory Card Game', () => {
  test('starts and displays a shuffled card grid', async ({ page }) => {
    await startMemoryGame(page);
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#time')).toHaveText(/^\d+$/);
  });

  test('flips cards and updates score on match', async ({ page }) => {
    await startMemoryGame(page);
    const cards = page.locator('.memory-card');
    const icons = await cards.evaluateAll((elements) => elements.map((el) => el.dataset.icon));
    const firstIndex = 0;
    const secondIndex = icons.findIndex((icon, index) => icon === icons[0] && index !== 0);

    await cards.nth(firstIndex).click();
    await cards.nth(secondIndex).click();

    await expect(page.locator('#score')).toHaveText('10');
  });

  test('flips cards with keyboard', async ({ page }) => {
    await startMemoryGame(page);
    const firstCard = page.locator('.memory-card').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await expect(firstCard).toHaveClass(/flipped/);
    await expect(firstCard).toHaveAttribute('role', 'button');
  });

  test('reset returns to welcome screen', async ({ page }) => {
    await startMemoryGame(page);
    await page.getByRole('button', { name: 'Reset Memory Card Game' }).click();
    await expect(page.locator('#memory-game').getByText('Click "Start Game" to begin')).toBeVisible();
  });

  test('timer stops when switching away from memory game', async ({ page }) => {
    await startMemoryGame(page);
    const initialTime = await page.locator('#time').textContent();
    await page.getByRole('button', { name: 'Play Snake Game' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await expect(page.locator('#time')).toHaveText(initialTime || '');
  });
});
