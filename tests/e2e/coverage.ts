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

  fs.mkdirSync(COVERAGE_DIR, { recursive: true });
  const filePath = path.join(COVERAGE_DIR, `coverage-${testInfo.testId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(coverage));
}
