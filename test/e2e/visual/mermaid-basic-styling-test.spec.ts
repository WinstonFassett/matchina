import { test, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Basic Styling Test', () => {
  test('check if themeCSS is being applied', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(1000);

    // Check if our custom CSS is being applied
    const mermaidContainer = page.locator('.mermaid');
    await expect(mermaidContainer).toBeVisible();

    // Check for transparent backgrounds
    const workingGroup = page.locator('[id*="Working"]');
    if (await workingGroup.count() > 0) {
      const rects = workingGroup.locator('rect');
      const rectCount = await rects.count();
      console.log('Working group rects found:', rectCount);

      for (let i = 0; i < rectCount; i++) {
        const rect = rects.nth(i);
        const fill = await rect.evaluate(el => {
          return window.getComputedStyle(el).fill;
        });
        console.log(`Rect ${i} fill:`, fill);
      }
    }

    // Check node styling
    const nodes = page.locator('.node');
    const nodeCount = await nodes.count();
    console.log('Nodes found:', nodeCount);

    if (nodeCount > 0) {
      const firstNode = nodes.first();
      const nodeRect = firstNode.locator('rect, circle, path');
      if (await nodeRect.count() > 0) {
        const nodeFill = await nodeRect.first().evaluate(el => {
          return window.getComputedStyle(el).fill;
        });
        console.log('First node fill:', nodeFill);
      }
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/basic-styling-check.png',
      fullPage: true 
    });

    console.log('✅ Basic styling check captured');
  });
});
