import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  testMatch: [
    // ONLY debug tests
    'debug/**/*.spec.ts',
  ],
  fullyParallel: false, // Run one at a time for debugging
  forbidOnly: false,
  retries: 0,
  workers: 1, // Single worker for debugging
  reporter: 'line',
  timeout: 10000, // Longer timeout for debugging
  expect: {
    timeout: 5000, // Longer assertion timeout
  },
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'on',
    headless: false, // Show browser for debugging
    actionTimeout: 5000,
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
