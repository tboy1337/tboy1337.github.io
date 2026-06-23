import { test, expect } from './test';
import { gotoHome, startMusicStudio } from './support';

const C4_HZ = 261.63;

test.describe('Music Studio audio stability', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('maintains C4 pitch after rapid A/S/D key spam', async ({ page }) => {
    await startMusicStudio(page);

    await page.keyboard.press('a');
    const baseline = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(baseline).toBeCloseTo(C4_HZ, 1);

    for (let round = 0; round < 40; round += 1) {
      await page.keyboard.press('a');
      await page.keyboard.press('s');
      await page.keyboard.press('d');
    }

    await page.waitForTimeout(1200);

    await page.keyboard.press('a');
    const afterSpam = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(afterSpam).toBeCloseTo(baseline, 1);
    expect(afterSpam).toBeCloseTo(C4_HZ, 1);
  });

  test('releases all voices after rapid key spam', async ({ page }) => {
    await startMusicStudio(page);

    for (let round = 0; round < 40; round += 1) {
      await page.keyboard.press('a');
      await page.keyboard.press('s');
      await page.keyboard.press('d');
    }

    await page.waitForTimeout(1200);
    const activeVoices = await page.evaluate(() => window.getMusicStudioActiveVoiceCount?.() ?? -1);
    expect(activeVoices).toBe(0);
  });

  test('uses a single destination connection in the audio engine', async ({ page }) => {
    await startMusicStudio(page);
    const destinationConnections = await page.evaluate(
      () => window.getMusicStudioDestinationConnections?.() ?? -1
    );
    expect(destinationConnections).toBe(1);
  });

  test('ignores held-key repeat events when playing notes', async ({ page }) => {
    await startMusicStudio(page);
    await page.keyboard.down('a');
    await page.waitForTimeout(250);
    await page.keyboard.up('a');
    const notesPlayed = Number(await page.locator('#music-studio-notes').textContent());
    expect(notesPlayed).toBe(1);
  });

  test('plays notes after changing instrument without clicking the page', async ({ page }) => {
    await startMusicStudio(page);

    await page.locator('#instrument-select').selectOption('piano');
    await page.keyboard.press('a');

    const frequency = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(frequency).toBeCloseTo(C4_HZ, 1);
    await expect(page.locator('#music-studio-notes')).toHaveText('1');
  });

  test('maintains pitch after rapid W and D key spam', async ({ page }) => {
    await startMusicStudio(page);

    await page.keyboard.press('w');
    const baseline = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(baseline).toBeGreaterThan(C4_HZ);

    for (let round = 0; round < 40; round += 1) {
      await page.keyboard.press('w');
      await page.keyboard.press('d');
    }

    await page.waitForTimeout(1200);

    await page.keyboard.press('w');
    const afterSpam = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(afterSpam).toBeCloseTo(baseline, 1);
  });

  test('plays notes after toggling an effect without clicking the page', async ({ page }) => {
    await startMusicStudio(page);

    await page.locator('#reverb-toggle').click();
    await page.keyboard.press('d');

    const frequency = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(frequency).toBeCloseTo(329.63, 1);
    await expect(page.locator('#music-studio-notes')).toHaveText('1');
  });

  test('applies distortion slider changes to the engine immediately', async ({ page }) => {
    await startMusicStudio(page);

    await page.locator('#distortion-amount').fill('15');
    const lowDistortion = await page.evaluate(() => window.getMusicStudioEffects?.().distortion.amount ?? -1);
    expect(lowDistortion).toBe(15);

    await page.locator('#distortion-amount').fill('95');
    const highDistortion = await page.evaluate(() => window.getMusicStudioEffects?.().distortion ?? null);
    expect(highDistortion?.amount).toBe(95);
    expect(highDistortion?.wetness).toBeCloseTo(0.95, 2);
  });

  test('changes timbre when distortion mix is increased', async ({ page }) => {
    await startMusicStudio(page);

    for (const effectId of ['reverb-toggle', 'delay-toggle', 'chorus-toggle', 'filter-toggle']) {
      await page.locator(`#${effectId}`).click();
    }
    await page.waitForTimeout(200);

    await page.locator('#distortion-amount').fill('5');
    await page.keyboard.press('a');
    await page.waitForTimeout(150);
    const lowEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    await page.locator('#distortion-amount').fill('100');
    await page.keyboard.press('a');
    await page.waitForTimeout(150);
    const highEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    expect(highEnergy).not.toBe(lowEnergy);
    const frequency = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(frequency).toBeCloseTo(C4_HZ, 1);
  });
});
