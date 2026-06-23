import { test, expect } from './test';
import { gotoHome, startMusicStudio } from './support';

const C4_HZ = 261.63;

async function waitForActiveVoicesReleased(page: import('@playwright/test').Page) {
  await expect.poll(async () => {
    return page.evaluate(() => window.getMusicStudioActiveVoiceCount?.() ?? -1);
  }, { timeout: 5000 }).toBe(0);
}

async function waitForSpectralSample(page: import('@playwright/test').Page) {
  await expect.poll(async () => {
    return page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);
  }, { timeout: 3000 }).toBeGreaterThan(0);
}

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

    await waitForActiveVoicesReleased(page);

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

    await waitForActiveVoicesReleased(page);
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
    await expect.poll(async () => {
      return Number(await page.locator('#music-studio-notes').textContent());
    }, { timeout: 3000 }).toBe(1);
    await page.keyboard.up('a');
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

    await waitForActiveVoicesReleased(page);

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

  test('maps delay slider to time and feedback as well as wetness', async ({ page }) => {
    await startMusicStudio(page);

    await page.locator('#delay-amount').fill('20');
    const lightDelay = await page.evaluate(() => window.getMusicStudioEffects?.().delay ?? null);
    expect(lightDelay?.wetness).toBeCloseTo(0.2, 2);
    expect(lightDelay?.time).toBeCloseTo(0.2, 1);
    expect(lightDelay?.feedback).toBeCloseTo(0.3, 1);

    await page.locator('#delay-amount').fill('90');
    const heavyDelay = await page.evaluate(() => window.getMusicStudioEffects?.().delay ?? null);
    expect(heavyDelay?.wetness).toBeCloseTo(0.9, 2);
    expect(heavyDelay?.time).toBeGreaterThan(0.6);
    expect(heavyDelay?.feedback).toBeGreaterThan(0.7);
  });

  test('changes timbre when distortion mix is increased', async ({ page }) => {
    await startMusicStudio(page);

    for (const effectId of ['reverb-toggle', 'delay-toggle', 'chorus-toggle', 'filter-toggle']) {
      await page.locator(`#${effectId}`).click();
    }

    await page.locator('#distortion-amount').fill('5');
    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const lowEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    await page.locator('#distortion-amount').fill('100');
    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const highEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    expect(highEnergy).not.toBe(lowEnergy);
    const frequency = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(frequency).toBeCloseTo(C4_HZ, 1);
  });

  test('changes timbre when only distortion is enabled after disabling all effects', async ({ page }) => {
    await startMusicStudio(page);

    for (const effectId of [
      'reverb-toggle',
      'delay-toggle',
      'chorus-toggle',
      'distortion-toggle',
      'filter-toggle'
    ]) {
      await page.locator(`#${effectId}`).click();
    }

    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const dryEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    await page.locator('#distortion-toggle').click();
    await page.locator('#distortion-amount').fill('100');
    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const distortedEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    expect(distortedEnergy).not.toBe(dryEnergy);
    const frequency = await page.evaluate(() => window.getMusicStudioLastFrequency?.() ?? 0);
    expect(frequency).toBeCloseTo(C4_HZ, 1);
  });

  test('changes timbre when delay is enabled at high wetness', async ({ page }) => {
    await startMusicStudio(page);

    for (const effectId of [
      'reverb-toggle',
      'delay-toggle',
      'chorus-toggle',
      'distortion-toggle',
      'filter-toggle'
    ]) {
      await page.locator(`#${effectId}`).click();
    }

    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const dryEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    await page.locator('#delay-toggle').click();
    await page.locator('#delay-amount').fill('100');
    await page.keyboard.press('a');
    await waitForSpectralSample(page);
    const delayedEnergy = await page.evaluate(() => window.getMusicStudioSpectralEnergy?.() ?? 0);

    expect(delayedEnergy).not.toBe(dryEnergy);
  });
});
