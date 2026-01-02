import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('dark mode statechart', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  await page.screenshot({ 
    path: 'review/screenshots/dark-statechart.png',
    clip: { x: 200, y: 200, width: 800, height: 600 }
  });
});

test('dark mode flowchart', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const flatButton = page.getByRole('button', { name: 'Flattened' });
  if (await flatButton.isVisible()) await flatButton.click();
  await page.waitForTimeout(300);

  await page.screenshot({ 
    path: 'review/screenshots/dark-flowchart.png',
    clip: { x: 200, y: 200, width: 800, height: 600 }
  });
});
