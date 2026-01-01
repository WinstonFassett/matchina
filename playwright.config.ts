import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  timeout: 3000, // 3 seconds per test - fail fast
  expect: {
    timeout: 2000, // 2 seconds per assertion
  },
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'on',
    headless: true, // Run in background by default
    actionTimeout: 1000, // 1 second for actions like click/fill
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
