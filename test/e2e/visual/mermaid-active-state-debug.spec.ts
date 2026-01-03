import { test, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('Mermaid Active State Debug', () => {
  test('debug active state highlighting', async ({ page }) => {
    // Capture console
    page.on('console', msg => {
      if (msg.text().includes('currentStateKey') || msg.text().includes('active') || msg.text().includes('highlight')) {
        console.log('DEBUG:', msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500);

    // List all node IDs in the diagram
    const nodeIds = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.node, g[class*="state"], .statediagram-state');
      return Array.from(nodes).map(n => ({
        id: n.id,
        classes: n.className.toString(),
        tagName: n.tagName
      }));
    });
    console.log('All node elements:', JSON.stringify(nodeIds, null, 2));

    // Check for any .active classes
    const activeElements = await page.evaluate(() => {
      const actives = document.querySelectorAll('.active, .mermaid-active-state, .state-highlight');
      return Array.from(actives).map(n => ({
        id: n.id,
        classes: n.className.toString(),
        tagName: n.tagName
      }));
    });
    console.log('Active elements:', JSON.stringify(activeElements, null, 2));

    // Check cluster label styling
    const clusterLabels = await page.evaluate(() => {
      const labels = document.querySelectorAll('.cluster-label');
      return Array.from(labels).map(l => {
        const div = l.querySelector('div');
        const span = l.querySelector('span');
        return {
          divBg: div ? window.getComputedStyle(div).backgroundColor : 'no div',
          spanColor: span ? window.getComputedStyle(span).color : 'no span',
          text: l.textContent?.trim()
        };
      });
    });
    console.log('Cluster labels:', JSON.stringify(clusterLabels, null, 2));

    // Take screenshot
    await page.screenshot({ 
      path: 'review/screenshots/active-state-debug.png',
      fullPage: true 
    });

    console.log('✅ Active state debug complete');
  });
});
