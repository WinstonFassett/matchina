import { test, Page, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Styling Before/After Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('BEFORE consolidation - nested mode', async ({ page }) => {
    // Ensure nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Take BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-before-nested-light.png',
      fullPage: true 
    });

    console.log('✅ BEFORE: Nested mode captured');
  });

  test('BEFORE consolidation - flat mode', async ({ page }) => {
    // Switch to flat mode
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(500);

    // Take BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-before-flat-light.png',
      fullPage: true 
    });

    console.log('✅ BEFORE: Flat mode captured');
  });

  test('BEFORE consolidation - nested dark mode', async ({ page }) => {
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

    // Take BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-before-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ BEFORE: Nested dark mode captured');
  });

  test('BEFORE consolidation - flat dark mode', async ({ page }) => {
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

    // Take BEFORE screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-before-flat-dark.png',
      fullPage: true 
    });

    console.log('✅ BEFORE: Flat dark mode captured');
  });

  test('AFTER consolidation - nested mode', async ({ page }) => {
    // Ensure nested mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(500);

    // Take AFTER screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-after-nested-light.png',
      fullPage: true 
    });

    console.log('✅ AFTER: Nested mode captured');
  });

  test('AFTER consolidation - flat mode', async ({ page }) => {
    // Switch to flat mode
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(500);

    // Take AFTER screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-after-flat-light.png',
      fullPage: true 
    });

    console.log('✅ AFTER: Flat mode captured');
  });

  test('AFTER consolidation - nested dark mode', async ({ page }) => {
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

    // Take AFTER screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-after-nested-dark.png',
      fullPage: true 
    });

    console.log('✅ AFTER: Nested dark mode captured');
  });

  test('AFTER consolidation - flat dark mode', async ({ page }) => {
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

    // Take AFTER screenshot
    await page.screenshot({ 
      path: 'review/screenshots/styling-after-flat-dark.png',
      fullPage: true 
    });

    console.log('✅ AFTER: Flat dark mode captured');
  });
});
