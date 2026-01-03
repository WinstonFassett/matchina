import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  testMatch: [
    // Include functional and visual tests for CI
    'functional/**/*.spec.ts',
    'visual/**/*.spec.ts',
    // Exclude debug tests (agent observation tools)
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: 'line', // REQUIRED: Use line reporter for agents, never HTML (starts server)
  timeout: 5000, // 5 seconds per test (reasonable buffer)
  expect: {
    timeout: 2000, // 2 seconds per assertion (fail fast on bad selectors)
  },
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'on',
    headless: true, // Run in background by default
    actionTimeout: 2000, // 2 seconds for actions like click/fill
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
