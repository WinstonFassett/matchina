import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('debug statechart selector', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('applyHighlights')) logs.push(msg.text());
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  
  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(500);

  console.log('CONSOLE LOGS:', logs);

  const result = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'state-Red-7 not found' };

    const path = stateNode.querySelector('path');
    return {
      pathFill: path ? (path as SVGElement).style.fill : 'no path',
      pathComputedFill: path ? window.getComputedStyle(path).fill : 'no path',
      stateNodeClasses: stateNode.className?.toString?.() || stateNode.getAttribute('class')
    };
  });

  console.log('RESULT:', JSON.stringify(result, null, 2));
});
