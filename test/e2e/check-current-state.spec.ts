import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test('check current state and active edges', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('currentStateKey') || msg.text().includes('applyHighlights')) {
      logs.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const nestedButton = page.getByRole('button', { name: 'Nested' });
  if (await nestedButton.isVisible()) await nestedButton.click();
  await page.waitForTimeout(500);

  console.log('CONSOLE LOGS:', logs);

  const result = await page.evaluate(() => {
    // Find the current active state
    const stateHighlight = document.querySelector('.state-highlight');
    
    // Find edges that should be active (from current state)
    const currentState = stateHighlight?.textContent?.trim();
    
    const edges = Array.from(document.querySelectorAll('.edgeLabel p')).map(el => ({
      text: el.textContent?.trim(),
      classes: Array.from(el.classList),
      metadata: (el as any)._edge,
      shouldBeActive: (el as any)._edge?.fromState === currentState
    }));
    
    return {
      currentState,
      edges: edges.filter(e => e.shouldBeActive)
    };
  });

  console.log('CURRENT STATE AND EDGES:', JSON.stringify(result, null, 2));
});