import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check where active class is applied', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    // Find all elements with .active class
    const activeElements = Array.from(document.querySelectorAll('.active'));
    
    return activeElements.map(el => {
      const id = el.id;
      const tag = el.tagName;
      const classList = el.classList ? Array.from(el.classList) : [];
      
      // Check if this element or its children have path/rect
      const hasPath = !!el.querySelector('path');
      const hasRect = !!el.querySelector('rect');
      const pathFill = el.querySelector('path') ? window.getComputedStyle(el.querySelector('path')!).fill : null;
      const rectFill = el.querySelector('rect') ? window.getComputedStyle(el.querySelector('rect')!).fill : null;
      
      return { id, tag, classList, hasPath, hasRect, pathFill, rectFill };
    });
  });

  console.log('ACTIVE ELEMENTS:', JSON.stringify(result, null, 2));
});
