import { test, expect } from '@playwright/test';

test.describe('ForceGraph Basic Test', () => {
  test('ForceGraph renders', async ({ page }) => {
    await page.goto('http://localhost:4321/matchina/examples/hsm-combobox');
    
    // Wait for page to load
    await page.waitForSelector('.hsm-visualizer-demo');
    
    // Select Force Graph visualizer
    await page.locator('.visualizer-controls button').filter({ hasText: 'Force Graph' }).click();
    await page.waitForTimeout(1000);
    
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
