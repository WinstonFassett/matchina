import { test, expect } from '@playwright/test';

test.describe('ForceGraph Basic Test', () => {
  test('ForceGraph renders', async ({ page }) => {
    await page.goto('/matchina/examples/hsm-combobox');
    
    // Wait for page to load
    await page.waitForSelector('.machine-visualizer');
    
    // Check if visualizer picker exists
    const picker = page.locator('[data-testid="visualizer-picker"]');
    if (await picker.isVisible()) {
      await picker.selectOption('forcegraph');
      await page.waitForSelector('canvas', { timeout: 300 });
    }
    
    // Take screenshot
    await page.screenshot({
      path: 'review/screenshots/forcegraph-basic-test.png',
      fullPage: false
    });
    
    // Check if ForceGraph canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
