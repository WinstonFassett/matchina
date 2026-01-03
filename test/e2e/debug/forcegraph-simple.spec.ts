import { test, expect } from '@playwright/test';

test.describe('ForceGraph Simple Test', () => {
  test('ForceGraph renders and works', async ({ page }) => {
    await page.goto('http://localhost:4321/matchina/examples/hsm-combobox');
    
    // Wait for page to load
    await page.waitForSelector('.hsm-visualizer-demo');
    
    // Select Force Graph visualizer
    await page.locator('.visualizer-controls button').filter({ hasText: 'Force Graph' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot - initial state
    await page.screenshot({
      path: 'review/screenshots/forcegraph-simple-1-inactive.png',
      fullPage: false
    });
    
    // Check if ForceGraph canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Trigger some interactions
    const input = page.locator('input[placeholder*="Type"]');
    await input.fill('type');
    await page.waitForTimeout(400);
    
    await page.screenshot({
      path: 'review/screenshots/forcegraph-simple-2-typing.png',
      fullPage: false
    });
    
    // Select a suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    
    await page.screenshot({
      path: 'review/screenshots/forcegraph-simple-3-selected.png',
      fullPage: false
    });
    
    // Verify canvas is still visible after interactions
    await expect(canvas).toBeVisible();
  });
});
