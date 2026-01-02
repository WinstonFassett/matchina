import { test, Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('REAL BEFORE Consolidation Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('REAL BEFORE - nested dark mode', async ({ page }) => {
    // Switch to dark mode
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

    // Take REAL BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-real-before-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ REAL BEFORE: Nested dark mode captured');
  });

  test('REAL BEFORE - flat dark mode', async ({ page }) => {
    // Switch to dark mode
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

    // Take REAL BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-real-before-flat-dark.png',
      fullPage: true 
    });

    console.log('✅ REAL BEFORE: Flat dark mode captured');
  });
});
