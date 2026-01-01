import { test, expect } from '@playwright/test';

test('hierarchical force graph renders correctly', async ({ page }) => {
  // Navigate to the hierarchical force graph page
  await page.goto('http://localhost:4321/matchina/examples/hierarchical-force-graphs');
  await page.waitForLoadState('networkidle');
  
  // Check that the page title is correct (use the more specific h1)
  await expect(page.locator('h1#hierarchical-force-directed-graph-experiments')).toContainText('Hierarchical Force-Directed Graph Experiments');
  
  // Wait for the React component to load
  await page.waitForSelector('astro-island', { timeout: 10000 });
  
  // Wait for the component to render (check for the force graph title)
  await page.waitForSelector('text=Traffic Light HSM - Hierarchical Force Graph', { timeout: 10000 });
  
  // Take a screenshot to see what's actually rendering
  await page.screenshot({ 
    path: 'review/screenshots/hierarchical-force-graph.png',
    fullPage: false
  });
  
  // Look for the force graph SVG specifically (not all the other SVGs on the page)
  const forceGraphContainer = page.locator('div:has(h3:text("Traffic Light HSM - Hierarchical Force Graph"))');
  const svgInForceGraph = forceGraphContainer.locator('svg');
  
  // Check if the force graph SVG exists
  const svgCount = await svgInForceGraph.count();
  console.log(`Found ${svgCount} SVG elements in force graph container`);
  
  if (svgCount > 0) {
    await expect(svgInForceGraph.first()).toBeVisible({ timeout: 5000 });
    
    // Check if nodes are rendered (circles)
    const nodes = svgInForceGraph.first().locator('circle');
    const nodeCount = await nodes.count();
    console.log(`Found ${nodeCount} nodes`);
    expect(nodeCount).toBeGreaterThan(0);
    
    // Check if links are rendered (lines)
    const links = svgInForceGraph.first().locator('line');
    const linkCount = await links.count();
    console.log(`Found ${linkCount} links`);
    expect(linkCount).toBeGreaterThan(0);
    
    // Check if containers are rendered (paths)
    const containers = svgInForceGraph.first().locator('path.container');
    const containerCount = await containers.count();
    console.log(`Found ${containerCount} containers`);
    
    // Check if labels are rendered
    const labels = svgInForceGraph.first().locator('text');
    const labelCount = await labels.count();
    console.log(`Found ${labelCount} labels`);
    expect(labelCount).toBeGreaterThan(0);
    
    // Test drag and drop functionality
    if (nodeCount > 0) {
      const firstNode = nodes.first();
      await firstNode.hover();
      
      // Get initial position
      const initialBox = await firstNode.boundingBox();
      expect(initialBox).toBeTruthy();
      
      // Drag the node
      await page.mouse.move(initialBox!.x + initialBox!.width / 2, initialBox!.y + initialBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox!.x + initialBox!.width / 2 + 50, initialBox!.y + initialBox!.height / 2 + 50);
      await page.mouse.up();
      
      // Wait a bit for the force simulation to update
      await page.waitForTimeout(1000);
      
      // Take another screenshot after dragging
      await page.screenshot({ 
        path: 'review/screenshots/hierarchical-force-graph-after-drag.png',
        fullPage: false
      });
    }
  }
  
  // Wait a bit more to see the animation
  await page.waitForTimeout(3000);
  
  // Final screenshot
  await page.screenshot({ 
    path: 'review/screenshots/hierarchical-force-graph-final.png',
    fullPage: false
  });
  
  // Console logging for debugging
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
});
