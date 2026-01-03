import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check what .basic element is', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(1000);

  const basicInfo = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'not found' };

    const basic = stateNode.querySelector('.basic');
    const path = stateNode.querySelector('path');
    const rect = stateNode.querySelector('rect');

    return {
      basic: basic ? { tag: basic.tagName, class: basic.getAttribute('class') } : null,
      path: path ? { tag: path.tagName, class: path.getAttribute('class') } : null,
      rect: rect ? { tag: rect.tagName, class: rect.getAttribute('class') } : null,
      querySelectorResult: stateNode.querySelector('path, rect, .basic')?.tagName
    };
  });

  console.log('BASIC INFO:', JSON.stringify(basicInfo, null, 2));
});
