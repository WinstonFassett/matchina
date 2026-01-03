import { test, Page, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Styling Visual Parity Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('nested mode - visual styling test', async ({ page }) => {
    // Ensure nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/styling-nested-light.png',
      fullPage: true 
    });

    // Check key visual elements
    const workingGroup = page.locator('[id*="Working"]');
    await expect(workingGroup).toBeVisible();

    console.log('✅ Nested mode styling captured');
  });

  test('flat mode - visual styling test', async ({ page }) => {
    // Switch to flat mode
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(500);

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/styling-flat-light.png',
      fullPage: true 
    });

    console.log('✅ Flat mode styling captured');
  });

  test('dark mode - nested visual styling test', async ({ page }) => {
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

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/styling-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ Nested dark mode styling captured');
  });

  test('dark mode - flat visual styling test', async ({ page }) => {
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

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'review/screenshots/styling-flat-dark.png',
      fullPage: true 
    });

    console.log('✅ Flat dark mode styling captured');
  });
});
