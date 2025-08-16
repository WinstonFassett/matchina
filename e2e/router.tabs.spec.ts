import { test, expect } from '@playwright/test';

// E2E for nested product tabs and default redirect to overview

test.describe('Router product tabs', () => {
  test('default redirect and tab navigation', async ({ page }) => {
    await page.goto('/matchina/router-demo');

    // Go to Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/#\/products$/);

    // Open Product 42 via top nav link
    await page.getByRole('link', { name: 'Product 42' }).click();
    // Default redirect should take us to /overview
    await expect(page).toHaveURL(/#\/products\/42\/overview$/);
    await expect(page.getByRole('heading', { level: 4 })).toHaveText('Overview');

    // Click Specs tab
    await page.getByRole('link', { name: 'Specs' }).click();
    await expect(page).toHaveURL(/#\/products\/42\/specs$/);
    await expect(page.getByRole('heading', { level: 4 })).toHaveText('Specs');

    // Click Reviews tab
    await page.getByRole('link', { name: 'Reviews' }).click();
    await expect(page).toHaveURL(/#\/products\/42\/reviews$/);
    await expect(page.getByRole('heading', { level: 4 })).toHaveText('Reviews');

    // Deep link reload should preserve view
    await page.reload();
    await expect(page).toHaveURL(/#\/products\/42\/reviews$/);
    await expect(page.getByRole('heading', { level: 4 })).toHaveText('Reviews');
  });
});
