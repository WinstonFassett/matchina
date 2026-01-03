import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('verify path element gets highlight class', async ({ page }) => {
  // Clear cache
  await page.context().clearCookies();
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) {
    await nestedButton.click();
  }
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const stateNode = document.querySelector('#state-Red-7');
    if (!stateNode) return { error: 'not found' };

    const path = stateNode.querySelector('path');
    const pathClass = path?.getAttribute('class') || path?.className?.toString?.() || 'no class';
    
    // Check all elements with state-highlight
    const highlighted = Array.from(document.querySelectorAll('.state-highlight'));
    const highlightedTags = highlighted.map(el => el.tagName);

    return {
      pathClass,
      highlightedTags,
      pathHasHighlight: path?.classList?.contains('state-highlight') || false
    };
  });

  console.log('RESULT:', JSON.stringify(result, null, 2));
});
