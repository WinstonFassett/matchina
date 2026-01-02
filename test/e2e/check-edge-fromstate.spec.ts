import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check edge fromState values vs current state', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const stateHighlight = document.querySelector('.state-highlight');
    const currentState = stateHighlight?.textContent?.trim();
    
    const edges = Array.from(document.querySelectorAll('.edgeLabel p')).map(el => ({
      text: el.textContent?.trim(),
      fromState: (el as any)._edge?.fromState,
      currentState: currentState,
      matches: (el as any)._edge?.fromState === currentState
    }));
    
    return {
      currentState,
      edges: edges
    };
  });

  console.log('EDGE FROMSTATE COMPARISON:', JSON.stringify(result, null, 2));
});
