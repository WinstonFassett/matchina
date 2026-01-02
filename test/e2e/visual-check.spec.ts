import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('visual check statechart', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(300);

  await page.screenshot({ 
    path: 'review/screenshots/visual-check-statechart.png',
    clip: { x: 0, y: 0, width: 1280, height: 800 }
  });
});

test('visual check flowchart', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const flatButton = page.getByRole('button', { name: 'Flattened' });
  if (await flatButton.isVisible()) {
    await flatButton.click();
  }
  await page.waitForTimeout(300);

  await page.screenshot({ 
    path: 'review/screenshots/visual-check-flowchart.png',
    clip: { x: 0, y: 0, width: 1280, height: 800 }
  });
});
