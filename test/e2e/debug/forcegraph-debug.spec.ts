import { test, expect } from '@playwright/test';

test.describe('ForceGraph Debug', () => {
  test('Check ForceGraph component presence', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    
    await page.goto('http://localhost:4321/matchina/examples/hsm-combobox');
    
    // Wait for page to load
    await page.waitForSelector('.hsm-visualizer-demo');
    
    // Check if Force Graph button exists
    const forceGraphButton = page.locator('.visualizer-controls button').filter({ hasText: 'Force Graph' });
    const buttonCount = await forceGraphButton.count();
    console.log(`Force Graph buttons found: ${buttonCount}`);
    
    if (buttonCount > 0) {
      await forceGraphButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({
        path: 'review/screenshots/forcegraph-debug.png',
        fullPage: false
      });
      
      // Check for any div with forcegraph in the name
      const forceGraphElement = page.locator('[class*="forcegraph"], [id*="forcegraph"], div[data-testid*="forcegraph"]');
      const elementCount = await forceGraphElement.count();
      console.log(`ForceGraph elements found: ${elementCount}`);
      
      // Check for canvas elements
      const canvas = page.locator('canvas');
      const canvasCount = await canvas.count();
      console.log(`Canvas elements found: ${canvasCount}`);
      
      // Check for any div that might contain the force graph
      const container = page.locator('.hsm-visualizer-demo > div > div');
      const containerCount = await container.count();
      console.log(`Container divs found: ${containerCount}`);
      
      // Get the HTML of the visualizer area
      const visualizerHTML = await page.locator('.hsm-visualizer-demo').innerHTML();
      console.log('Visualizer HTML length:', visualizerHTML.length);
      console.log('Contains ForceGraph:', visualizerHTML.includes('ForceGraph'));
    }
  });
});
