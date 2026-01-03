import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('find what has active class', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const allActive = Array.from(document.querySelectorAll('.active, .state-highlight, .mermaid-active-state'));
    
    return allActive.map(el => ({
      tag: el.tagName,
      id: el.id || 'no-id',
      classes: Array.from(el.classList),
      parent: el.parentElement?.id || 'no-parent',
      hasText: !!el.querySelector('text'),
      hasP: !!el.querySelector('p'),
      hasForeignObject: !!el.querySelector('foreignObject'),
      textContent: el.textContent?.trim().slice(0, 20)
    }));
  });

  console.log('ACTIVE ELEMENTS:', JSON.stringify(result, null, 2));
});
