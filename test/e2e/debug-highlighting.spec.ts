import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/matchina/examples/hsm-traffic-light';

test.describe('Debug Highlighting Issues', () => {
  test('capture flowchart and statechart state for comparison', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Capture nested (statechart) mode
    const nestedButton = page.getByRole('button', { name: 'Nested' });
    if (await nestedButton.isVisible()) {
      await nestedButton.click();
    }
    await page.waitForTimeout(1000);

    // Get statechart DOM structure for active state
    const statechartInfo = await page.evaluate(() => {
      const container = document.querySelector('.mermaid-container, [class*="mermaid"]');
      if (!container) return { error: 'No mermaid container found' };

      // Find elements with 'active' class
      const activeElements = Array.from(container.querySelectorAll('.active, .state-highlight, .mermaid-active-state'));
      const activeInfo = activeElements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        classes: el.className,
        parentClasses: el.parentElement?.className || 'none'
      }));

      // Find all state nodes
      const stateNodes = Array.from(container.querySelectorAll('g[class*="state"], g.node'));
      const stateInfo = stateNodes.slice(0, 5).map(el => ({
        tagName: el.tagName,
        id: el.id,
        classes: el.className,
        hasRect: !!el.querySelector('rect'),
        hasPath: !!el.querySelector('path'),
        hasBasic: !!el.querySelector('.basic')
      }));

      // Find edge labels
      const edgeLabels = Array.from(container.querySelectorAll('.edgeLabel p'));
      const edgeInfo = edgeLabels.slice(0, 5).map(el => ({
        text: el.textContent?.trim(),
        classes: el.className
      }));

      return { activeInfo, stateInfo, edgeInfo, diagramType: 'statechart' };
    });

    console.log('STATECHART INFO:', JSON.stringify(statechartInfo, null, 2));

    await page.screenshot({ 
      path: 'review/screenshots/debug-statechart-dark.png',
      fullPage: true 
    });

    // Switch to flat (flowchart) mode
    const flatButton = page.getByRole('button', { name: 'Flattened' });
    if (await flatButton.isVisible()) {
      await flatButton.click();
    }
    await page.waitForTimeout(1000);

    // Get flowchart DOM structure for active state
    const flowchartInfo = await page.evaluate(() => {
      const container = document.querySelector('.mermaid-container, [class*="mermaid"]');
      if (!container) return { error: 'No mermaid container found' };

      // Find elements with 'active' class
      const activeElements = Array.from(container.querySelectorAll('.active, .state-highlight, .mermaid-active-state'));
      const activeInfo = activeElements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        classes: el.className,
        parentClasses: el.parentElement?.className || 'none'
      }));

      // Find all nodes
      const nodes = Array.from(container.querySelectorAll('g.node'));
      const nodeInfo = nodes.slice(0, 5).map(el => ({
        tagName: el.tagName,
        id: el.id,
        classes: el.className,
        hasRect: !!el.querySelector('rect'),
        hasPath: !!el.querySelector('path')
      }));

      // Find edge labels
      const edgeLabels = Array.from(container.querySelectorAll('.edgeLabel p'));
      const edgeInfo = edgeLabels.slice(0, 5).map(el => ({
        text: el.textContent?.trim(),
        classes: el.className
      }));

      return { activeInfo, nodeInfo, edgeInfo, diagramType: 'flowchart' };
    });

    console.log('FLOWCHART INFO:', JSON.stringify(flowchartInfo, null, 2));

    await page.screenshot({ 
      path: 'review/screenshots/debug-flowchart-dark.png',
      fullPage: true 
    });

    // Verify we got data
    expect(statechartInfo).not.toHaveProperty('error');
    expect(flowchartInfo).not.toHaveProperty('error');
  });
});
