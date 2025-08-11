import { test, expect } from '@playwright/test';

// Basic end-to-end check of router demo in the docs app
// Ensures Links and programmatic navigation render the right view

test.describe('Router basic navigation', () => {
  test('navigates between top-level routes and param route', async ({ page }) => {
    await page.goto('/matchina/router-demo');

    await expect(page.locator('h1')).toHaveText('Router Demo');
    // The demo component title
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Idiomatic Router Demo');
    // Initial route is '/', Home should be visible via Routes
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('Home');

    // Click About
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/#\/about$/);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('About');

    // Click Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/#\/products$/);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('Products');

    // Navigate to Product 42 via top nav Link (hash routing)
    await page.getByRole('link', { name: 'Product 42' }).click();
    await expect(page).toHaveURL(/#\/products\/42$/);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('Product');

    // Back to list (programmatic navigation)
    await page.getByRole('button', { name: 'Back to list' }).click();
    await expect(page).toHaveURL(/#\/products$/);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('Products');

    // User link with param
    await page.getByRole('link', { name: /User winston/ }).click();
    await expect(page).toHaveURL(/#\/users\/winston$/);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('User');
  });
});
