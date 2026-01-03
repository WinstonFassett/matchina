import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check CSS variable values', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = getComputedStyle(root);
    
    return {
      textColorVar: computed.getPropertyValue('--sl-color-text').trim(),
      bgColorVar: computed.getPropertyValue('--sl-color-bg').trim(),
      accentHighVar: computed.getPropertyValue('--sl-color-accent-high').trim(),
      accentVar: computed.getPropertyValue('--sl-color-accent').trim()
    };
  });

  console.log('CSS VARIABLES:', JSON.stringify(result, null, 2));
});
