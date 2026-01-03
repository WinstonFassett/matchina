import { test, expect } from '@playwright/test';

const BASE_URL = '/matchina/examples/hsm-traffic-light';

test.describe('HSM Traffic Light Flattened Mermaid Flowchart', () => {
  test('verify flowchart structure and styling', async ({ page }) => {
    // Capture console for debugging
    page.on('console', msg => {
      if (msg.text().includes('graph LR') || msg.text().includes('Generated') || msg.text().includes('FLOWCHART DEBUG')) {
        console.log('FLOWCHART:', msg.text());
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

    // Switch to FLATTENED mode - this should default to flowchart
    const flattenedButton = page.getByRole('button', { name: 'Flattened' });
    await expect(flattenedButton).toBeVisible();
    await flattenedButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot of current state
    await page.screenshot({ 
      path: 'review/screenshots/flattened-flowchart-current.png',
      fullPage: true 
    });

    // Check for Working subgraph
    const workingCluster = page.locator('[id*="Working"], .cluster');
    const clusterCount = await workingCluster.count();
    console.log('Working clusters found:', clusterCount);

    // Check for duplicate nodes
    const allNodes = page.locator('.node');
    const nodeCount = await allNodes.count();
    console.log('Total nodes:', nodeCount);

    // List all node IDs
    for (let i = 0; i < Math.min(nodeCount, 10); i++) {
      const node = allNodes.nth(i);
      const nodeId = await node.getAttribute('id');
      console.log(`Node ${i}: ${nodeId}`);
    }

    // Check cluster background color
    const clusterRects = page.locator('.cluster rect');
    const rectCount = await clusterRects.count();
    console.log('Cluster rects found:', rectCount);

    for (let i = 0; i < rectCount; i++) {
      const rect = clusterRects.nth(i);
      const fill = await rect.evaluate(el => window.getComputedStyle(el).fill);
      const stroke = await rect.evaluate(el => window.getComputedStyle(el).stroke);
      console.log(`Cluster rect ${i} fill: ${fill}, stroke: ${stroke}`);
    }

    // Check cluster label styling
    const clusterLabels = page.locator('.cluster-label');
    const labelCount = await clusterLabels.count();
    console.log('Cluster labels found:', labelCount);

    for (let i = 0; i < labelCount; i++) {
      const label = clusterLabels.nth(i);
      
      // Debug: show actual HTML structure
      const labelHtml = await label.innerHTML();
      console.log(`Cluster label ${i} HTML:`, labelHtml.substring(0, 500));
      
      // Check all rects inside label
      const labelRects = label.locator('rect');
      const labelRectCount = await labelRects.count();
      console.log(`Cluster label ${i} has ${labelRectCount} rects`);
      
      for (let j = 0; j < labelRectCount; j++) {
        const labelRect = labelRects.nth(j);
        const labelFill = await labelRect.evaluate(el => window.getComputedStyle(el).fill);
        const labelStroke = await labelRect.evaluate(el => window.getComputedStyle(el).stroke);
        console.log(`  Label rect ${j} fill: ${labelFill}, stroke: ${labelStroke}`);
      }
      
      const labelText = label.locator('span, text, .nodeLabel');
      if (await labelText.count() > 0) {
        const textColor = await labelText.first().evaluate(el => window.getComputedStyle(el).color || window.getComputedStyle(el).fill);
        const textBg = await labelText.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`Cluster label ${i} text color: ${textColor}, bg: ${textBg}`);
      }
    }

    console.log('✅ Flattened flowchart test complete');

    // Take final screenshot
    await page.screenshot({ 
      path: 'review/screenshots/flattened-flowchart-final.png',
      fullPage: true 
    });
  });
});
