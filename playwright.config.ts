import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm --workspace docs run start',
    port: 4321,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
