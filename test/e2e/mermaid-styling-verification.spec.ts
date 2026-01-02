import { test, Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Styling Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Capture console logs to see what diagram is generated
    page.on('console', msg => {
      if (msg.text().includes('Generated Mermaid diagram:')) {
        console.log('BROWSER:', msg.text());
      }
    });
  });

  test('verify nested mode styling', async ({ page }) => {
    // Switch to dark mode for better visibility
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Ensure nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Check for hierarchical structure
    const workingGroup = page.locator('[id*="Working"]');
    await expect(workingGroup).toBeVisible();

    // Check for transparent background (no white background)
    const workingGroupRects = page.locator('[id*="Working"] rect');
    const rectCount = await workingGroupRects.count();
    console.log('Working group rect elements found:', rectCount);

    // Check the outer rect for transparency
    const outerRect = workingGroupRects.first();
    const bgColor = await outerRect.evaluate(el => {
      return window.getComputedStyle(el).fill;
    });

    console.log('Nested mode Working group outer background:', bgColor);

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/verify-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ Nested mode verification captured');
  });

  test('verify flat mode styling', async ({ page }) => {
    // Switch to dark mode for better visibility
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Switch to flat mode
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(500);

    // Check for hierarchical structure - either group or individual nodes
    const workingGroup = page.locator('[id*="Working"]');
    const workingNodes = page.locator('[id^="Working_"]');
    
    const hasGroup = await workingGroup.count() > 0;
    const hasNodes = await workingNodes.count() > 0;
    
    console.log('Flat mode - hasGroup:', hasGroup, 'hasNodes:', hasNodes);
    
    if (hasGroup) {
      await expect(workingGroup.first()).toBeVisible();
      
      // Check for transparent background (no white background)
      const workingGroupRects = page.locator('[id*="Working"] rect');
      const rectCount = await workingGroupRects.count();
      console.log('Working group rect elements found:', rectCount);

      // Check the outer rect for transparency
      const outerRect = workingGroupRects.first();
      const bgColor = await outerRect.evaluate(el => {
        return window.getComputedStyle(el).fill;
      });

      console.log('Flat mode Working group outer background:', bgColor);
    } else if (hasNodes) {
      console.log('Flat mode has individual Working nodes, no group structure');
      await expect(workingNodes.first()).toBeVisible();
    } else {
      throw new Error('No Working structure found in flat mode');
    }

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'review/screenshots/verify-flat-dark.png',
      fullPage: true 
    });

    console.log('✅ Flat mode verification captured');
  });
});
