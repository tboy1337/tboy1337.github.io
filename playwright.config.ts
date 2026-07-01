import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'translation',
      testMatch: /translation\.spec\.ts/,
      retries: 2,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /translation\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npx vite --port 4173 --host localhost',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
