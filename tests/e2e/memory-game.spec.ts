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

    let firstIndex = 0;
    let secondIndex = icons.findIndex((icon, index) => index > 0 && icon === icons[0]);
    if (secondIndex < 0) {
      secondIndex = 1;
    }

    await cards.nth(firstIndex).click();
    await cards.nth(secondIndex).click();

    if (icons[firstIndex] === icons[secondIndex]) {
      await expect(page.locator('#score')).toHaveText('10');
    } else {
      await expect(page.locator('#score')).toHaveText('0');
    }
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
