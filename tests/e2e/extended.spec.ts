import { test, expect } from './test';
import { mockAudio, gotoHome, startMusicStudio } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Contact form validation', () => {
  test('shows validation feedback for invalid fields', async ({ page }) => {
    const nameInput = page.getByRole('textbox', { name: 'Your Name' });
    const emailInput = page.getByRole('textbox', { name: 'Your Email' });
    const subjectInput = page.getByRole('textbox', { name: 'Subject' });
    const messageInput = page.getByRole('textbox', { name: 'Message' });

    await nameInput.fill('A');
    await nameInput.blur();
    await expect(nameInput).toHaveClass(/border-red-500/);
    await expect(page.locator('#name-error')).toBeVisible();

    await emailInput.fill('not-an-email');
    await emailInput.blur();
    await expect(emailInput).toHaveClass(/border-red-500/);

    await subjectInput.fill('Hi');
    await subjectInput.blur();
    await expect(subjectInput).toHaveClass(/border-red-500/);

    await messageInput.fill('short');
    await messageInput.blur();
    await expect(messageInput).toHaveClass(/border-red-500/);
  });

  test('accepts valid contact form values', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Your Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Your Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Subject' }).fill('Portfolio inquiry');
    await page.getByRole('textbox', { name: 'Message' }).fill('This is a valid test message for automation.');

    await page.getByRole('textbox', { name: 'Your Name' }).blur();
    await expect(page.getByRole('textbox', { name: 'Your Name' })).not.toHaveClass(/border-red-500/);
    await expect(page.locator('#name-error')).toBeHidden();
  });
});

test.describe('Music studio extended interactions', () => {
  test('switches instruments and toggles effects', async ({ page }) => {
    await startMusicStudio(page);

    await page.locator('#instrument-select').selectOption('piano');
    await page.keyboard.press('a');
    await expect(page.locator('#arrow-notes')).not.toHaveText('0');

    await page.getByRole('checkbox', { name: '🌊 Reverb' }).uncheck();
    await page.getByRole('checkbox', { name: '🌊 Reverb' }).check();
    await page.getByRole('checkbox', { name: '🔄 Delay' }).check();
    await page.getByRole('checkbox', { name: '🌈 Chorus' }).check();
    await page.getByRole('checkbox', { name: '⚡ Distortion' }).check();
  });

  test('navigates layers and plays recorded audio', async ({ page }) => {
    await startMusicStudio(page);

    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    const nextLayerButton = page.getByRole('button', { name: 'Next ▶' });
    await expect(nextLayerButton).toBeEnabled();
    await nextLayerButton.click();
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('d');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    await page.getByRole('button', { name: '▶️ Play' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: '⏸️ Stop' }).click();
  });

  test('clears current layer recording', async ({ page }) => {
    await startMusicStudio(page);
    await page.getByRole('button', { name: '⏺️ Record Layer' }).click();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: '⏹️ Stop Recording' }).click();

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: '🗑️ Clear Current' }).click();
    await expect(page.getByRole('button', { name: '▶️ Play' })).toBeDisabled();
  });
});

test.describe('Memory game extended play', () => {
  test('completes multiple card flips without errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Play Memory Card Game' }).click();
    await page.getByRole('button', { name: 'Start Memory Card Game' }).click();

    const cards = page.locator('.memory-card');
    for (let i = 0; i < 6; i += 1) {
      await cards.nth(i % 16).click();
      await page.waitForTimeout(150);
    }

    await expect(page.locator('#score')).toHaveText(/^\d+$/);
  });
});

test.describe('Typing game extended play', () => {
  test('updates accuracy while typing multiple words', async ({ page }) => {
    await page.getByRole('button', { name: 'Play Typing Speed Test' }).click();
    await page.getByRole('button', { name: 'Start Typing Speed Test' }).click();

    const prompt = await page.locator('#text-display').innerText();
    const words = prompt.split(' ').slice(0, 4).join(' ');
    await page.locator('#typing-input').type(words);

    await expect(page.locator('#typing-accuracy')).not.toHaveText('100%');
    await expect(page.locator('#typing-wpm')).not.toHaveText('0');
  });
});
