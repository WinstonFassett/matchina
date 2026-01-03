import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('statechart active element detail', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    // Find ALL elements with .active class
    const allActive = Array.from(document.querySelectorAll('.active'));
    
    return allActive.map(el => {
      const parent = el.parentElement;
      const grandparent = parent?.parentElement;
      const path = el.querySelector('path');
      const siblingPath = el.parentElement?.querySelector('path');
      
      return {
        tag: el.tagName,
        id: (el as Element).id || 'no-id',
        classes: Array.from(el.classList),
        parentId: parent?.id || 'no-id',
        parentTag: parent?.tagName,
        grandparentId: grandparent?.id || 'no-id',
        hasChildPath: !!path,
        hasSiblingPath: !!siblingPath,
        childPathFill: path ? window.getComputedStyle(path).fill : null,
        siblingPathFill: siblingPath ? window.getComputedStyle(siblingPath).fill : null
      };
    });
  });

  console.log('ALL ACTIVE ELEMENTS:', JSON.stringify(result, null, 2));
});
