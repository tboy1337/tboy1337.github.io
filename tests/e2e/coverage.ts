import fs from 'node:fs';
import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';

const COVERAGE_DIR = path.resolve('coverage-e2e');

type IstanbulCoverage = Record<string, unknown>;

export async function collectPageCoverage(page: Page, testInfo: TestInfo): Promise<void> {
  const coverage = await page.evaluate(() => {
    const globalWindow = window as typeof window & { __coverage__?: IstanbulCoverage };
    return globalWindow.__coverage__ ?? null;
  });

  if (!coverage) {
    return;
  }

  try {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
    const filePath = path.join(COVERAGE_DIR, `coverage-${testInfo.testId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(coverage));
  } catch (error) {
    console.warn(`Failed to write e2e coverage for ${testInfo.title}:`, error);
    testInfo.annotations.push({
      type: 'warning',
      description: `Coverage write failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
