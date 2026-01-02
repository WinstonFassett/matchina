import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('debug path structure', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'not found' };

    const path = stateNode.querySelector('path');
    const rect = stateNode.querySelector('rect');
    const allPaths = stateNode.querySelectorAll('path');
    const allRects = stateNode.querySelectorAll('rect');

    return {
      pathCount: allPaths.length,
      rectCount: allRects.length,
      firstPathParent: path?.parentElement?.tagName,
      firstPathParentClass: path?.parentElement?.className?.toString?.(),
      pathStyleFill: path ? (path as SVGElement).style.fill : null,
      rectStyleFill: rect ? (rect as SVGElement).style.fill : null
    };
  });

  console.log('RESULT:', JSON.stringify(result, null, 2));
});
