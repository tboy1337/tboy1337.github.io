import { test as base, expect } from '@playwright/test';
import { collectPageCoverage } from './coverage';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);
    await collectPageCoverage(page, testInfo);
  }
});

export { expect };
