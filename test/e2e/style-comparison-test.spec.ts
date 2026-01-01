import { test, expect } from '@playwright/test';

test('style comparison - force graphs vs reactflow vs mermaid', async ({ page }) => {
  // Navigate to hierarchical force graphs
  await page.goto('http://localhost:4321/matchina/examples/hierarchical-force-graphs');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('h1#hierarchical-force-directed-graph-experiments');
  
  // Capture force graph experiments
  const forceGraphSelectors = [
    { selector: 'h3:text("Traffic Light HSM - Hierarchical Force Graph")', name: 'force-graph-custom' },
    { selector: 'h3:text("Traffic Light HSM - WebCola Constraint Layout")', name: 'force-graph-webcola' }
  ];
  
  for (const experiment of forceGraphSelectors) {
    try {
      const element = page.locator(experiment.selector);
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Find the SVG/graph container within each section
      const section = element.locator('xpath=./ancestor::div[1]');
      const graphContainer = section.locator('svg').first();
      
      if (await graphContainer.isVisible()) {
        await graphContainer.screenshot({ 
          path: `review/screenshots/style-comparison-${experiment.name}.png`
        });
      }
    } catch (error) {
      console.log(`Could not capture ${experiment.name}: ${error}`);
    }
  }
  
  // Navigate to ReactFlow example for comparison
  await page.goto('http://localhost:4321/matchina/examples/hsm-traffic-light');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Try to capture ReactFlow
  try {
    const reactFlowButton = page.locator('button:has-text("React Flow")');
    if (await reactFlowButton.isVisible()) {
      await reactFlowButton.click();
      await page.waitForTimeout(1000);
      
      const reactFlowContainer = page.locator('.react-flow__viewport');
      if (await reactFlowContainer.isVisible()) {
        await reactFlowContainer.screenshot({ 
          path: 'review/screenshots/style-comparison-reactflow.png'
        });
      }
    }
  } catch (error) {
    console.log(`Could not capture ReactFlow: ${error}`);
  }
  
  // Try to capture Mermaid
  try {
    const mermaidButton = page.locator('button:has-text("Mermaid Diagram")');
    if (await mermaidButton.isVisible()) {
      await mermaidButton.click();
      await page.waitForTimeout(1000);
      
      const mermaidContainer = page.locator('.mermaid');
      if (await mermaidContainer.isVisible()) {
        await mermaidContainer.screenshot({ 
          path: 'review/screenshots/style-comparison-mermaid.png'
        });
      }
    }
  } catch (error) {
    console.log(`Could not capture Mermaid: ${error}`);
  }
  
  // Capture overall layout comparison
  await page.screenshot({ 
    path: 'review/screenshots/style-comparison-hsm-traffic-light-layout.png',
    fullPage: true
  });
});
