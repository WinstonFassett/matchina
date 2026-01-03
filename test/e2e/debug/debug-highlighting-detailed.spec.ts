import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Debug Highlighting Detailed', () => {
  test('check statechart selector matching', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Ensure nested (statechart) mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(1000);

    // Get console logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('applyHighlights')) {
        logs.push(msg.text());
      }
    });

    // Trigger a state change to see the logs
    const breakButton = page.getByRole('button', { name: 'break' });
    if (await breakButton.isVisible()) {
      await breakButton.click();
      await page.waitForTimeout(500);
    }

    // Get all state node IDs in the statechart
    const stateInfo = await page.evaluate(() => {
      const container = document.querySelector('.mermaid-container svg, [class*="mermaid"] svg');
      if (!container) return { error: 'No SVG found' };

      // Get all g elements with IDs containing 'state'
      const stateGs = Array.from(container.querySelectorAll('g[id*="state"], g[id*="State"]'));
      const stateIds = stateGs.map(g => ({
        id: g.id,
        classes: (g as Element).className?.toString() || '',
        hasPath: !!g.querySelector('path'),
        hasRect: !!g.querySelector('rect'),
        hasBasic: !!g.querySelector('.basic')
      }));

      // Get all g.node elements
      const nodeGs = Array.from(container.querySelectorAll('g.node'));
      const nodeIds = nodeGs.map(g => ({
        id: g.id,
        classes: (g as Element).className?.toString() || ''
      }));

      return { stateIds, nodeIds };
    });

    console.log('STATE INFO:', JSON.stringify(stateInfo, null, 2));
    console.log('CONSOLE LOGS:', logs);

    // Now check what the CSS is doing - find elements with state-highlight class
    const highlightInfo = await page.evaluate(() => {
      const highlighted = Array.from(document.querySelectorAll('.state-highlight, .mermaid-active-state, .active'));
      return highlighted.map(el => ({
        tagName: el.tagName,
        id: el.id,
        classes: (el as Element).className?.toString() || ''
      }));
    });

    console.log('HIGHLIGHTED ELEMENTS:', JSON.stringify(highlightInfo, null, 2));
  });
});
