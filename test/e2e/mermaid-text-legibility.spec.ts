import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Text Legibility in Dark Mode', () => {
  test('verify text colors are legible', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(1000);

    // Check node text colors
    const nodeTexts = page.locator('.node text, .node .nodeLabel, .statediagram-state text');
    const textCount = await nodeTexts.count();
    console.log('Node text elements found:', textCount);

    for (let i = 0; i < Math.min(textCount, 5); i++) {
      const text = nodeTexts.nth(i);
      const fill = await text.evaluate(el => window.getComputedStyle(el).fill);
      const color = await text.evaluate(el => window.getComputedStyle(el).color);
      const content = await text.textContent();
      console.log(`Text ${i} "${content?.substring(0, 20)}": fill=${fill}, color=${color}`);
    }

    // Check edge label colors
    const edgeLabels = page.locator('.edgeLabel p, .edgeLabel text');
    const labelCount = await edgeLabels.count();
    console.log('Edge label elements found:', labelCount);

    for (let i = 0; i < Math.min(labelCount, 5); i++) {
      const label = edgeLabels.nth(i);
      const color = await label.evaluate(el => window.getComputedStyle(el).color);
      const bg = await label.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const content = await label.textContent();
      console.log(`Edge label ${i} "${content?.substring(0, 20)}": color=${color}, bg=${bg}`);
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/text-legibility-dark.png',
      fullPage: true 
    });

    console.log('✅ Text legibility test complete');
  });
});
