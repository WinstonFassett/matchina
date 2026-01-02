import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('debug applyHighlights execution', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(500);

  // Filter for applyHighlights logs
  const highlightLogs = logs.filter(l => l.includes('applyHighlights'));
  console.log('HIGHLIGHT LOGS:', highlightLogs);

  // Check if path has inline style
  const result = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'no state-Red-7' };
    
    const path = stateNode.querySelector('path');
    return {
      pathStyleFill: path ? (path as SVGElement).style.fill : 'no path',
      pathStyleStroke: path ? (path as SVGElement).style.stroke : 'no path',
      pathHasClass: path ? Array.from(path.classList) : []
    };
  });

  console.log('PATH INLINE STYLES:', JSON.stringify(result, null, 2));
});
