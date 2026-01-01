import { test, expect } from '@playwright/test';

test.describe('ForceGraph Visual Review', () => {
  const themes = ['light', 'dark'] as const;
  const modes = ['flat', 'nested'] as const;

  themes.forEach(theme => {
    modes.forEach(mode => {
      test(`${theme} - ${mode}`, async ({ page }) => {
        await page.goto('http://localhost:4321/matchina/examples/hsm-combobox');
        
        // Wait for page to load
        await page.waitForSelector('.hsm-visualizer-demo');
        
        // Set theme
        if (theme === 'dark') {
          await page.click('button[aria-label="Toggle dark mode"]');
          await page.waitForTimeout(200);
        }
        
        // Set mode (flat/nested)
        const modeButton = mode === 'flat' ? 'Flat Machine' : 'Nested Machine';
        await page.click(`button:has-text("${modeButton}")`);
        await page.waitForTimeout(400);
        
        // Select Force Graph visualizer
        await page.locator('.visualizer-controls button').filter({ hasText: 'Force Graph' }).click();
        await page.waitForTimeout(1000);
        
        // Take screenshot
        await page.screenshot({
          path: `review/screenshots/forcegraph-${theme}-${mode}-1-inactive.png`,
          fullPage: false
        });
        
        // Trigger some interactions
        const input = page.locator('input[placeholder*="Type"]');
        await input.fill('type');
        await page.waitForTimeout(400);
        
        await page.screenshot({
          path: `review/screenshots/forcegraph-${theme}-${mode}-2-typing.png`,
          fullPage: false
        });
        
        // Select a suggestion
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        
        await page.screenshot({
          path: `review/screenshots/forcegraph-${theme}-${mode}-3-selected.png`,
          fullPage: false
        });
      });
    });
  });
});
